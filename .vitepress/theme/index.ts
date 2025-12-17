// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DocsList from './DocsList.vue'
import './style.css'
import './custom.scss'
import DocBefore from './DocBefore.vue'
import DocAfter from './DocAfter.vue'
import MDEditor from './MDEditor.vue'

import { data as docs } from './docs.data.ts'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(DocBefore),
      'doc-after': () => h(DocAfter)
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('list', DocsList)
    app.component('editor', MDEditor)
    app.provide('docs', docs)
  }
} satisfies Theme
