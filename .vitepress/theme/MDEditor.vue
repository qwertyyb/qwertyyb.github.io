<template>
  <div class="md-editor">
    <header class="md-editor-header">
      <a href="javascript:void(0)" @click="togglePreview" class="preview-btn btn">{{ view === 'preview' ? '编辑' : '预览' }}</a>
      <a href="javascript:void(0)" @click="openSettingDialog" class="btn setting-btn">设置</a>
      <a href="javascript:void(0)" @click="publish" class="publish-btn btn">发布</a>
    </header>
    <main class="md-editor-main">
      <div ref="editorRef" class="editor" v-show="view !== 'preview'"></div>
      <div class="preview vp-doc" ref="previewRef" v-html="preview" v-show="view !== 'editor'"></div>
    </main>
    <dialog class="setting-dialog" ref="settingDialog">
      <h3 class="dialog-title">设置</h3>
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
import { onMounted, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import type * as monaco from 'monaco-editor'
import { createMarkdownRenderer } from '../../vendor/vitepress/dist/node/markdown'
import { useData } from 'vitepress'
import { useWindowSize } from './hooks/windowSize'
import { useGithub } from './hooks/github'

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
    const obj = JSON.parse(localStorage.getItem('vitepress-publish-setting') || '{}') as Setting
    return { owner: obj.owner || '', repo: obj.repo || '', auth: obj.auth || '' }
  } catch {
    return { owner: '', repo: '', auth: '' }
  }
}
const saveSetting = () => {
  localStorage.setItem('vitepress-publish-setting', JSON.stringify(settings.value))
}

const settings = ref<Setting>(getDefaultSetting())

let editor: monaco.editor.IStandaloneCodeEditor | null = null
let markdownRender: any
let monacoInstance: typeof monaco | null = null

const value = ref('# VitePress Markdown 编辑器\n\n这是一个支持 VitePress 扩展语法的 Markdown 编辑器。\n\n## 基本语法\n\n### 文本格式\n\n这是 **粗体** 文本，这是 *斜体* 文本。\n\n### 列表\n\n- 无序列表项 1\n- 无序列表项 2\n\n1. 有序列表项 1\n2. 有序列表项 2\n\n### 任务列表\n\n- [x] 已完成任务\n- [ ] 未完成任务\n\n### VitePress 容器\n\n::: info 信息\n这是一个信息容器\n:::\n\n::: tip 提示\n这是一个提示容器\n:::\n\n::: warning 警告\n这是一个警告容器\n:::\n\n::: danger 危险\n这是一个危险容器\n:::\n\n### 代码块\n\n```javascript\nconsole.log(\'Hello, VitePress!\')\n```\n\n### 行内代码\n\n这是一个 \`行内代码\` 示例。\n\n### 链接\n\n[VitePress 官方文档](https://vitepress.dev/zh/guide/markdown)\n\n### 脚注\n\n这是一个脚注示例[^1]。\n\n[^1]: 这是脚注的内容。\n\n### Emoji\n\n这里有一些 emoji :tada: :fire: :rocket: :100:')
const preview = ref('')

const { isDark } = useData();

watch(isDark, (dark) => {
  monacoInstance?.editor.setTheme(dark ? 'vs-dark' : 'vs')
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
  settingDialog.value?.showModal()
}

const { commitFiles } = useGithub();

const validate = () => {
  const emptyKeys = Object.keys(settings.value).filter((key) => !settings.value[key as keyof Setting])
  if (emptyKeys.length > 0) {
    return [`未配置 ${emptyKeys.join('、')}`]
  }
  return []
}

const publish = async () => {
  // 先做一些校验，比如说 frontmatter 中是否包含了 title 字段和正确格式的 createdAt 字段
  const errors = validate()
  if (errors.length > 0) {
    console.error(errors)
    return;
  }
  const confirmed = window.confirm('确定要发布吗？')
  if (!confirmed) return;

  const mdFiles = [{ path: 'src/test.md', raw: new File([value.value], 'test.md', { type: 'text/markdown' }) }]
  const { owner, repo, auth } = settings.value
  try {
    await commitFiles({
      owner, repo, files: mdFiles,
      auth,
      message: 'feat: new post'
    })
    window.alert('发布成功')
    value.value = ''
    preview.value = ''
    editor?.setValue('')
  } catch (err: any) {
    window.alert(`发布失败: ${err.message}`)
  }
}

// 加载 Monaco Editor CDN
async function loadMonacoCDN(): Promise<typeof monaco> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if ((window as any).monaco) {
      resolve((window as any).monaco)
      return
    }

    // 创建 script 标签加载 Monaco Editor
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js'
    script.async = true
    
    script.onload = () => {
      // 配置 Monaco Editor
      const require = (window as any).require
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs' } })
      require(['vs/editor/editor.main'], () => {
        resolve((window as any).monaco)
      })
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Monaco Editor from CDN'))
    }
    
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!editorContainer.value) return

  try {
    // 从 CDN 加载 Monaco Editor
    monacoInstance = await loadMonacoCDN()

    if (!monacoInstance) return;

    // 创建编辑器实例
    editor = monacoInstance.editor.create(editorContainer.value, {
      value: value.value,
      language: 'markdown',
      theme: isDark.value ? 'vs-dark' : 'vs',
      automaticLayout: true,
      wordWrap: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineHeight: 1.6,
      fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      suggest: {
        showKeywords: true,
        showSnippets: true
      }
    })

    editor.onDidChangeModelContent(async (event) => {
      const mdContent = editor!.getValue()
      localStorage.setItem('vitepress-draft-md', mdContent)
      value.value = mdContent
      preview.value = await markdownRender.renderAsync(value.value, {})
    })
    editor.onDidScrollChange(event => {
      if (!previewEl.value || !editorContainer.value) return;
      // 同步滚动，按比例对 preview 进行滚动
      const target = event.scrollTop / (event.scrollHeight - editorContainer.value.clientHeight) * (previewEl.value.scrollHeight - previewEl.value.clientHeight)
      previewEl.value.scrollTo({ left: 0, top: target, behavior: 'smooth' })
    })

    // 配置自动完成
    monacoInstance.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model, position) => {
        if (!monacoInstance) return;
        const range = new monacoInstance.Range(position.lineNumber, position.column, position.lineNumber, position.column)
        const suggestions = [
          // VitePress 容器自动完成
          {
            label: 'VitePress Info Container',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '::: info\n${1:内容}\n:::',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入 VitePress 信息容器',
            range
          },
          {
            label: 'VitePress Tip Container',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '::: tip\n${1:内容}\n:::',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入 VitePress 提示容器',
            range
          },
          {
            label: 'VitePress Warning Container',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '::: warning\n${1:内容}\n:::',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入 VitePress 警告容器',
            range
          },
          {
            label: 'VitePress Danger Container',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '::: danger\n${1:内容}\n:::',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入 VitePress 危险容器',
            range,
          },
          // 代码块自动完成
          {
            label: 'Code Block',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '```${1:language}\n${2:代码}\n```',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入代码块',
            range,
          },
          // 链接自动完成
          {
            label: 'Link',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '[${1:文本}](${2:链接})',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入链接',
            range,
          },
          // 图片自动完成
          {
            label: 'Image',
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: '![${1:描述}](${2:图片链接})',
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入图片',
            range,
          }
        ]

        return { suggestions }
      }
    })
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error)
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

onMounted(async () => {
  markdownRender = await createMarkdownRenderer('src')
  preview.value = await markdownRender.renderAsync(value.value, {})
})
</script>

<style scoped>
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
.md-editor-header .preview-btn {
  margin-left: auto;
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
.setting-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
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