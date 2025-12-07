// 把 ./vendor/vitepress 下的文件复制到 root/vendor/vitepress 下并替换原文件。

import fs from 'fs'
import path from 'path'

const copyMap = [
  {
    origin: './vendor/vitepress/rollup.config.ts',
    target: '../vendor/vitepress/rollup.config.ts'
  },
  {
    origin: './vendor/vitepress/highlight.ts',
    target: '../vendor/vitepress/src/node/markdown/plugins/highlight.ts'
  },
  {
    origin: './vendor/vitepress/markdown.ts',
    target: '../vendor/vitepress/src/node/markdown/markdown.ts'
  }
]

for (const { origin, target } of copyMap) {
  fs.copyFileSync(new URL(origin, import.meta.url), new URL(target, import.meta.url))
}