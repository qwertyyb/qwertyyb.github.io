// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DocsList from './DocsList.vue'
import './style.css'
import DocBefore from './DocBefore.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(DocBefore)
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
    app.component('list', DocsList)
  }
} satisfies Theme
