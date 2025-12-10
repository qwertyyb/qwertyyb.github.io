<template>
  <div class="md-editor">
    <header class="md-editor-header">
      <a href="javascript:void(0)" @click="openSettingDialog" class="btn setting-btn"><svg t="1765272442706" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7395" width="256" height="256"><path d="M313.7536 716.8a115.2 115.2 0 0 1 217.2928 0H921.6v76.8h-390.5536a115.2512 115.2512 0 0 1-217.2928 0H153.6V716.8h160.1536z m230.4-268.8a115.2512 115.2512 0 0 1 217.2928 0H921.6v76.8h-160.1536a115.2512 115.2512 0 0 1-217.2928 0H153.6v-76.8h390.5536z m-230.4-268.8a115.2 115.2 0 0 1 217.2928 0H921.6V256h-390.5536a115.2512 115.2512 0 0 1-217.2928 0H153.6V179.2h160.1536zM422.4 256a38.4 38.4 0 1 0 0-76.8 38.4 38.4 0 0 0 0 76.8z m230.4 268.8a38.4 38.4 0 1 0 0-76.8 38.4 38.4 0 0 0 0 76.8z m-230.4 268.8a38.4 38.4 0 1 0 0-76.8 38.4 38.4 0 0 0 0 76.8z" fill="#333333" opacity=".8" p-id="7396"></path></svg></a>
      <a href="javascript:void(0)" @click="togglePreview" class="preview-btn btn">{{ view === 'preview' ? '编辑' : '预览' }}</a>
      <a href="javascript:void(0)" @click="publish" class="publish-btn btn">发布</a>
    </header>
    <main class="md-editor-main">
      <div ref="editorRef" class="editor" v-show="view !== 'preview'" @drop="dropHandler"></div>
      <div class="preview vp-doc" ref="previewRef" v-html="preview" v-show="view !== 'editor'"></div>
    </main>
    <SettingsDialog ref="settingsDialog" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch, shallowRef, watchEffect } from 'vue'
import type * as monaco from 'monaco-editor'
import SettingsDialog from './components/SettingsDialog.vue'
import { createMarkdownRenderer } from '../../vendor/vitepress/dist/node/markdown'
import { useData } from 'vitepress'
import { useWindowSize } from './hooks/windowSize'
import { useGithub } from './hooks/github'
import { ASSETS_DIR, DEFAULT_EDITOR_VALUE, DRAFT_STORAGE_KEY, SRC_DIR } from './const'
import { useEditor } from './hooks/editor'
import { type Setting, useSettings } from './hooks/settings'
import { useResource } from './hooks/resource'

// 扩展 window 类型以支持 Monaco Editor
declare global {
  interface Window {
    monaco: typeof monaco
    require: any
  }
}

const editorContainer = useTemplateRef('editorRef')
const previewEl = useTemplateRef('previewRef')
const settingsDialog = useTemplateRef('settingsDialog')
const { width } = useWindowSize()
const view = ref<'default' | 'editor' | 'preview'>('default')

const { settings } = useSettings();

const getDraft = () => {
  const draft = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (draft) {
    return draft
  }
  return DEFAULT_EDITOR_VALUE
}

const value = ref(getDraft())
const preview = ref('')

const { addResource, allResourcesUrls, getResources } = useResource()

const scrollHandler = (event: monaco.IScrollEvent) => {
  if (!editorContainer.value || !previewEl.value) return;
  // 同步滚动，按比例对 preview 进行滚动
  const target = event.scrollTop / (event.scrollHeight - editorContainer.value.clientHeight) * (previewEl.value.scrollHeight - previewEl.value.clientHeight)
  previewEl.value.scrollTo({ left: 0, top: target, behavior: 'smooth' })
}

const { editor } = useEditor(editorContainer, { value, onScroll: scrollHandler })

let markdownRender = shallowRef<any>(null)

watchEffect(async () => {
  preview.value = await markdownRender.value?.renderAsync(value.value, {})
})

onMounted(async () => {
  markdownRender.value = await createMarkdownRenderer('src', { math: true })
})

const { isDark } = useData();

watch(isDark, (dark) => {
  editor.value?.updateOptions({ theme: dark ? 'vs-dark' : 'vs' })
})

watch(width, (newWidth) => {
  if (newWidth < 768 && view.value === 'default') {
    view.value = 'editor'
    return
  }
  view.value = 'default'
}, { immediate: true, flush: 'post' })

const togglePreview = () => {
  view.value = view.value === 'preview' ? width.value < 768 ? 'editor' : 'default' : 'preview'
}

const openSettingDialog = () => {
  settingsDialog.value?.open();
}

const { commitFiles } = useGithub();

interface RenderEnv {
  frontmatter?: Record<string, any>,
  title?: string,
  references?: Record<string, { title: string, href: string }>
}

const validate = (env: RenderEnv) => {
  const emptyKeys = Object.keys(settings.value).filter((key) => !settings.value[key as keyof Setting])
  if (emptyKeys.length > 0) {
    return [`未配置 ${emptyKeys.join('、')}`]
  }
  if (!env.title) {
    return ['获取标题失败']
  }
  if (!env.frontmatter?.created) {
    return ['请填写创建时间']
  }
  if (!(env.frontmatter.created instanceof Date)) {
    return ['创建时间格式错误']
  }
  return []
}

const publish = async () => {
  // 先做一些校验，比如说 frontmatter 中是否包含了正确格式的 created 字段
  let mdContent = value.value;
  const env: RenderEnv = {}
  markdownRender.value?.renderAsync(mdContent, env)
  console.log(env)
  const errors = validate(env)
  if (errors.length > 0) {
    window.alert(errors.join('\n'))
    return;
  }

  const allUrls = await allResourcesUrls();
  const urls = allUrls.filter(url => mdContent.includes(url))
  console.log('resourceUrls', urls)

  const resources = await getResources(urls)
  // update md file resource url
  const baseUrl = `/assets/${encodeURI(env.frontmatter?.title || env.title)}/`
  const namesMap = new Map<string, number>();
  const resourceFiles = resources.map(item => {
    // 判断文件原来的名字是否重复了，重复的话重新命名一下
    let name = item.file.name
    const count = (namesMap.get(name) || 0) + 1
    namesMap.set(name, count);
    if (count > 1) {
      name = name.replace(/(.+)(\.[a-zA-Z0-9]+)$/, `$1-${count}$2`)
    }
    const resourcePath = `${baseUrl}${encodeURI(name)}`
    mdContent = mdContent.replaceAll(item.url, resourcePath)
    return { path: `${ASSETS_DIR}/${env.frontmatter?.title || env.title}/${name}`, raw: item.file }
  })
  console.log(resources, mdContent)

  const confirmed = window.confirm(`确定要发布吗？本次发布共涉及资源 ${resources.length} 个资源文件,`)
  if (!confirmed) return;

  const files = [
    ...resourceFiles,
    { path: `${SRC_DIR}/${env.title}.md`, raw: new File([mdContent], `${env.title}.md`, { type: 'text/markdown' })
  }]
  const { owner, repo, auth } = settings.value

  console.log('publish', owner, repo, auth, mdContent, files)
  try {
    await commitFiles({
      owner, repo, files,
      auth,
      message: `docs: add doc ${env.title}.md`
    })
    window.alert('发布成功')
    value.value = ''
    preview.value = ''
    editor.value?.setValue('')
  } catch (err: any) {
    window.alert(`发布失败: ${err.message}`)
  }
}

const dropHandler = async (event: DragEvent) => {
  const files = Array.from(event.dataTransfer?.files || []).filter(item => item.type.startsWith('image/'))
  if (!files.length) return;
  event.preventDefault()

  const text = (await Promise.all(files.map(async item => {
    const url = await addResource(item)
    return {
      url,
      name: item.name,
    }
  }))).map(item => `![${item.name}](${item.url})`).join('\n')
  const position = editor.value?.getPosition()
  if (!position) return;
  editor.value?.executeEdits('insert-images', [
    {
      range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text
    }
  ])
}

</script>

<style lang="scss" scoped>
.md-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.md-editor-header {
  height: 64px;
  flex-shrink: 0;
  background-color: var(--vp-nav-bg-color);
  border-bottom: 1px solid var(--vp-c-gutter);
  display: flex;
  align-items: center;
  padding: 0 32px;
}

.md-editor-header .btn {
  font-size: 14px;
  margin-left: 16px;
}
.md-editor-header .setting-btn {
  margin-left: auto;
}
.md-editor-header .setting-btn svg {
  width: 20px;
  height: 20px;
}
.md-editor-header .publish-btn {
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  padding: 6px 16px;
  border: var(--vp-button-brand-border);
  border-radius: 4px;
}

.md-editor-main {
  width: 100vw;
  display: flex;
  height: calc(100% - 64px);
}

.editor {
  flex: 1;
  height: 100%;
}
.preview {
  flex: 1;
  padding: 16px;
  overflow: auto;
  height: 100%;
}
</style>

<style>
.VPLocalNav.empty.fixed {
  display: none;
}
</style>