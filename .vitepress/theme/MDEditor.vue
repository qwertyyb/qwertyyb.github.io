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
    <dialog class="setting-dialog" ref="settingDialog">
      <div class="dialog-header">
        <h3 class="dialog-title">设置</h3>
        <div class="dialog-close-btn" @click="closeSettingDialog"><svg t="1765256030401" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1822" width="256" height="256"><path d="M821.24 935.991c31.687 31.688 83.063 31.688 114.751 0 31.688-31.688 31.688-83.064 0-114.752L202.518 87.766c-31.688-31.688-83.064-31.688-114.752 0-31.688 31.688-31.688 83.064 0 114.752L821.239 935.99z" fill="#4A4A4A" p-id="1823"></path><path d="M202.518 935.991c-31.688 31.688-83.064 31.688-114.752 0-31.688-31.688-31.688-83.064 0-114.752L821.239 87.766c31.688-31.688 83.064-31.688 114.752 0 31.688 31.688 31.688 83.064 0 114.752L202.518 935.99z" fill="#4A4A4A" p-id="1824"></path></svg></div>
      </div>
      <form class="setting-content" @submit.prevent="saveSetting">
        <div class="form-item">
          <label for="owner" class="form-label">Owner: </label>
          <input type="text" name="owner" class="form-input" v-model.trim="settings.owner">
        </div>
        <div class="form-item">
          <label for="repo" class="form-label">Repo: </label>
          <input type="text" name="repo" class="form-input" v-model.trim="settings.repo">
        </div>
        <div class="form-item">
          <label for="auth" class="form-label">Auth: </label>
          <input type="text" name="auth" class="form-input" v-model.trim="settings.auth">
        </div>
        <div class="form-actions">
          <input type="submit" value="Submit" class="submit-btn"></input>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch, shallowRef, watchEffect } from 'vue'
import type * as monaco from 'monaco-editor'
import { createMarkdownRenderer } from '../../vendor/vitepress/dist/node/markdown'
import { useData } from 'vitepress'
import { useWindowSize } from './hooks/windowSize'
import { useGithub } from './hooks/github'
import { PUBLISH_SETTING_STORAGE_KEY } from './const'
import { useEditor } from './hooks/editor'

// 扩展 window 类型以支持 Monaco Editor
declare global {
  interface Window {
    monaco: typeof monaco
    require: any
  }
}

const editorContainer = useTemplateRef('editorRef')
const previewEl = useTemplateRef('previewRef')
const settingDialog = useTemplateRef('settingDialog')
const { width } = useWindowSize()
const view = ref<'default' | 'editor' | 'preview'>('default')

interface Setting {
  owner: string
  repo: string
  auth: string
}

const getDefaultSetting = (): Setting => {
  try {
    const obj = JSON.parse(localStorage.getItem(PUBLISH_SETTING_STORAGE_KEY) || '{}') as Setting
    return { owner: obj.owner || '', repo: obj.repo || '', auth: obj.auth || '' }
  } catch {
    return { owner: '', repo: '', auth: '' }
  }
}

const settings = ref<Setting>(getDefaultSetting())

const value = ref('---\ntitle: markdown 标题\ncreated: 2025-12-09\n----\n# VitePress Markdown 编辑器\n\n这是一个支持 VitePress 扩展语法的 Markdown 编辑器。\n\n## 基本语法\n\n### 文本格式\n\n这是 **粗体** 文本，这是 *斜体* 文本。\n\n### 列表\n\n- 无序列表项 1\n- 无序列表项 2\n\n1. 有序列表项 1\n2. 有序列表项 2\n\n### 任务列表\n\n- [x] 已完成任务\n- [ ] 未完成任务\n\n### VitePress 容器\n\n::: info 信息\n这是一个信息容器\n:::\n\n::: tip 提示\n这是一个提示容器\n:::\n\n::: warning 警告\n这是一个警告容器\n:::\n\n::: danger 危险\n这是一个危险容器\n:::\n\n### 代码块\n\n```javascript\nconsole.log(\'Hello, VitePress!\')\n```\n\n### 行内代码\n\n这是一个 \`行内代码\` 示例。\n\n### 链接\n\n[VitePress 官方文档](https://vitepress.dev/zh/guide/markdown)\n\n### 脚注\n\n这是一个脚注示例[^1]。\n\n[^1]: 这是脚注的内容。\n\n### Emoji\n\n这里有一些 emoji :tada: :fire: :rocket: :100:')
const preview = ref('')

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
  markdownRender.value = await createMarkdownRenderer('src')
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
  settingDialog.value?.showModal();
}

const closeSettingDialog = () => {
  settingDialog.value?.close()
}

const saveSetting = () => {
  localStorage.setItem(PUBLISH_SETTING_STORAGE_KEY, JSON.stringify(settings.value))
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
  const env: RenderEnv = {}
  markdownRender.value?.renderAsync(value.value, env)
  console.log(env)
  const errors = validate(env)
  if (errors.length > 0) {
    window.alert(errors.join('\n'))
    return;
  }
  const confirmed = window.confirm('确定要发布吗？')
  if (!confirmed) return;

  const mdFiles = [{ path: `src/${env.title}.md`, raw: new File([value.value], `${env.title}.md`, { type: 'text/markdown' }) }]
  const { owner, repo, auth } = settings.value
  try {
    await commitFiles({
      owner, repo, files: mdFiles,
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

  const text = files.map(item => {
    return `![${item.name}](${URL.createObjectURL(item)})`
  }).join('\n')
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

.setting-dialog {
  border: 1px solid var(--vp-c-gutter);
}
dialog.setting-dialog {
  transition: all .3s allow-discrete;
  translate: 0 -30vh;
  opacity: 0;
  &[open] {
    translate: 0 0;
    opacity: 1;
  }
}

@starting-style {
  dialog.setting-dialog[open] {
    translate: 0 -30vh;
    opacity: 0;
  }
  dialog.setting-dialog::backdrop {
    background-color: 0;
  }
}
dialog.setting-dialog[open]::backdrop {
  transition: all .3s allow-discrete;
  background-color: rgba(0, 0, 0, 0.5);

}
.setting-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.setting-dialog .dialog-header .dialog-close-btn {
  cursor: pointer;
}
.setting-dialog .dialog-header .dialog-close-btn svg {
  width: 28px;
  height: 28px;
  padding: 4px;
}
.setting-dialog .dialog-title {
  font-weight: bold;
}
.form-item {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  margin-top: 12px;
  width: 300px;
}
.form-item label {
  font-size: 14px;
  font-weight: 500;
}
.form-item input {
  border-bottom: 1px solid var(--vp-c-gutter);
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.form-actions .submit-btn {
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  padding: 6px 16px;
  border: var(--vp-button-brand-border);
  border-radius: 4px;
  font-weight: 500;
}
</style>

<style>
.VPLocalNav.empty.fixed {
  display: none;
}
</style>