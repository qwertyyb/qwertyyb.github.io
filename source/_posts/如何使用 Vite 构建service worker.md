---
title: 如何使用 Vite 构建service worker
date: 2024-12-30
tags:
  - 前端
  - pwa
  - service worker
categories:
  - [前端, pwa]

created_from_issue: true
---

近期使用 Vite + Vue 开发了一个 PWA 应用，如何在 Vite 中引入和构建 service worker 就成了一个问题，经过一番卓绝的工作，最终解决了这个问题，记录以供参考。

<!-- more -->

## service worker 为何特殊？

service worker 是一个 JS 文件，与业务 JS 的区别在于，业务的 JS 是直接或间接被入口文件依赖的，所以它们会被打包至业务的 JS Bundle 中，而 service worker 不同，service worker 是一个单独的 JS 文件，不能打包在业务的 JS Bundle 中，在业务中引入的方式也不是通过模块系统引入的，而是通过静态的文件地址引入。service worker 的特殊，注定它需要被特殊对待，不能像其它模块一样引入。

想要达到的效果是，service worker 能够编译构建，比如说我在项目源码中，使用 typescript 来写 service worker 的逻辑，在构建时转换为 JS。所以直接在 Vite 项目的 public 目录下写 service worker 因为不会被编译，是不行的。

## vite 的方案和问题

先说明一下 Vite 的版本：6.0.5

Vite 是有提供 [worker 的导入](https://cn.vite.dev/guide/assets#importing-script-as-a-worker) 的，使用这种方式，就可以在打包构建时，把 worker 和业务模块分开打包构建，具体代码如下：

```typescript
import swUrl from './sw.ts?worker&url'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(swUrl)
}
```

## 修改 service worker 的构建路径

Vite 通过这种方式解决了 worker 单独打包构建的问题，然而对于 service worker 来说，这还不够。这就涉及到 service worker 的 scope 属性了，service worker 的 scope 具体是什么此处就不再展开了。注册 service worker 时，默认的 scope 是 service worker 所在的目录，需要注意，这里是指 service worker 所在的目录，而不是项目的 index.html 所在的目录。所以如果 index.html 部署后的路径是 /project/index.html，而 service worker 部署后的路径是 /project/assets/sw.js，那 service worker 默认的 scope 就是 /project/assets/ 而不是 /project/，而这就是问题所在。

上面的问题不管是在开发过程中，还是构建后，都会有问题。在开发过程中，如果把 service worker 的源文件放在项目的 `src` 目录下，那在开发过程中，service worker 的 scope 就会是 `/src` 而不符合预期。 至于构建后，`sw-[hash].js` 是放在 `dist/assets/` 目录下的，这同样不符合，不能生效。

开发过程中的这个问题相对好处理，直接把 `sw.ts` 移动到项目根目录下即可。对于构建后的路径，则需要调整构建配置了，在 `vite.config.ts` 添加如下配置：

```typescript
//...
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
  worker: {
    rollupOptions: {
      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === 'sw') {
            // 需要把 sw 放在根目录，否则无法生效
            return '[name].js'
          }
          return '[name]-[hash][extname]'
        },
      }
    }
  }
})
```

如上面这样调整，就能解决路径导致的 scope 问题。

## 其它问题

在开发过程中，注册 service worker 可能会失败，会提示 `Cannot use import statement outside a module`。这是因为在 service worker 中使用了模块，而默认情况下，service worker 是不支持模块的，修复此问题，只需要调整注册 service 的逻辑如下：

```typescript
- navigator.serviceWorker.register(swUrl)
+ navigator.serviceWorker.register(swUrl, { type: 'module' })
```

这样 service worker 就能支持模块系统了。

