
import type * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, Ref, ShallowRef, shallowRef, TemplateRef } from 'vue'
import { DRAFT_STORAGE_KEY } from '../const'
import { useData } from 'vitepress'

// 扩展 window 类型以支持 Monaco Editor
declare global {
  interface Window {
    monaco: typeof monaco
    require: any
  }
}

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

export const useEditor = (
  editorContainer: TemplateRef<HTMLElement>,
  options: {
    value: Ref<string>,
    onScroll: (event: monaco.IScrollEvent) => void
  }
): { editor: ShallowRef<monaco.editor.IStandaloneCodeEditor | null> } => {
  let editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const { isDark } = useData()

  onMounted(async () => {
    if (!editorContainer.value) return

    try {
      // 从 CDN 加载 Monaco Editor
      await loadMonacoCDN()
    } catch (err) {
      window.alert('编辑器加载失败')
      throw err;
    }

    if (!window.monaco) return;

    // 配置自动完成
    window.monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model, position) => {
        if (!window.monaco) return;
        const line = model.getLineContent(position.lineNumber)
        const range = new window.monaco.Range(position.lineNumber, 0, position.lineNumber, position.column)
        const suggestions = [
          // VitePress 容器自动完成
          {
            label: 'info',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '::: info ${2:}\n${1:内容}\n:::',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入信息容器',
            range
          },
          {
            label: 'tip',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '::: tip ${2:}\n${1:内容}\n:::',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入提示容器',
            range
          },
          {
            label: 'warning',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '::: warning ${2:}\n${1:内容}\n:::',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入警告容器',
            range
          },
          {
            label: 'danger',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '::: danger ${2:}\n${1:内容}\n:::',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入危险容器',
            range,
          },
          // 代码块自动完成
          {
            label: 'Code Block',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '```${1:language}\n${2:代码}\n```',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入代码块',
            range,
          },
          // 链接自动完成
          {
            label: 'link',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '[${1:文本}](${2:链接})',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入链接',
            range,
          },
          // 图片自动完成
          {
            label: 'image',
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: '![${1:描述}](${2:图片链接})',
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '插入图片',
            range,
          }
        ]

        if (line.trim().length) {
          return {
            suggestions: suggestions.filter(i => i.label.includes(line.trim()))
          }
        }

        return { suggestions }
      }
    })

    // 创建编辑器实例
    editor.value = window.monaco.editor.create(editorContainer.value, {
      value: options.value.value,
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

    editor.value.onDidChangeModelContent(async (event) => {
      const mdContent = editor.value!.getValue()
      localStorage.setItem(DRAFT_STORAGE_KEY, mdContent)
      options.value.value = mdContent
    })
    editor.value.onDidScrollChange(event => {
      if (!editorContainer.value) return;
      options.onScroll(event)
    })

  })

  onBeforeUnmount(() => {
    editor.value?.dispose();
  })

  return { editor }
}