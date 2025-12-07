<template>
  <div class="md-editor">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as monaco from 'monaco-editor'


const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const value = ref('')

onMounted(async () => {
  if (!editorContainer.value) return

  // 创建编辑器实例
  editor = monaco.editor.create(editorContainer.value, {
    value: '# VitePress Markdown 编辑器\n\n这是一个支持 VitePress 扩展语法的 Markdown 编辑器。\n\n## 基本语法\n\n### 文本格式\n\n这是 **粗体** 文本，这是 *斜体* 文本。\n\n### 列表\n\n- 无序列表项 1\n- 无序列表项 2\n\n1. 有序列表项 1\n2. 有序列表项 2\n\n### 任务列表\n\n- [x] 已完成任务\n- [ ] 未完成任务\n\n### VitePress 容器\n\n::: info 信息\n这是一个信息容器\n:::\n\n::: tip 提示\n这是一个提示容器\n:::\n\n::: warning 警告\n这是一个警告容器\n:::\n\n::: danger 危险\n这是一个危险容器\n:::\n\n### 代码块\n\n```javascript\nconsole.log(\'Hello, VitePress!\')\n```\n\n### 行内代码\n\n这是一个 \`行内代码\` 示例。\n\n### 链接\n\n[VitePress 官方文档](https://vitepress.dev/zh/guide/markdown)\n\n### 脚注\n\n这是一个脚注示例[^1]。\n\n[^1]: 这是脚注的内容。\n\n### Emoji\n\n这里有一些 emoji :tada: :fire: :rocket: :100:',
    language: 'markdown',
    theme: 'vs-dark',
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

  editor.onDidChangeModelContent((event) => {
    value.value = editor!.getValue()
  })

  // 配置自动完成
  monaco.languages.registerCompletionItemProvider('markdown', {
    provideCompletionItems: (model, position) => {
      const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
      const suggestions = [
        // VitePress 容器自动完成
        {
          label: 'VitePress Info Container',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '::: info\n${1:内容}\n:::',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入 VitePress 信息容器',
          range
        },
        {
          label: 'VitePress Tip Container',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '::: tip\n${1:内容}\n:::',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入 VitePress 提示容器',
          range
        },
        {
          label: 'VitePress Warning Container',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '::: warning\n${1:内容}\n:::',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入 VitePress 警告容器',
          range
        },
        {
          label: 'VitePress Danger Container',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '::: danger\n${1:内容}\n:::',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入 VitePress 危险容器',
          range,
        },
        // 代码块自动完成
        {
          label: 'Code Block',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '```${1:language}\n${2:代码}\n```',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入代码块',
          range,
        },
        // 链接自动完成
        {
          label: 'Link',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[${1:文本}](${2:链接})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入链接',
          range,
        },
        // 图片自动完成
        {
          label: 'Image',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '![${1:描述}](${2:图片链接})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '插入图片',
          range,
        }
      ]

      return { suggestions }
    }
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
.md-editor {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-container {
  flex: 1;
  width: 100%;
  min-height: 500px;
}
</style>