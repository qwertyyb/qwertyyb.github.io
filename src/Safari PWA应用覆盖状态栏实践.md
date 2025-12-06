---
title: Safari PWA应用覆盖状态栏实践
created: 2023-06-15 12:30
tags:
  - 前端
  - Safari
  - PWA
categories:
  - [前端, Safari, PWA]

created_from_issue: true
---

PWA应用在IOS Safari上默认无法覆盖到状态栏，此文章给出解决方案

<!-- more -->

## 背景

PWA 应用规范中的 `manifest.json` 规范有一个字段 `display` 可以控制显示方式，有以下几个值 `fullscreen`、`standalone`、`minimal-ui`、`browser`，然而 safari 不支持 `fullscreen` 和 `minimal-ui`，所以我即使用 `fullscreen` 也会在 IOS 上被降级为 `standalone`。

但是 `standalone` 并不能覆盖到状态栏，所以在IOS上会显示一个黑底白字的状态栏，如下图所示，此文教你如何把页面覆盖到状态栏。

![standalone](/assets/Safari%20PWA应用覆盖状态栏实践/ee398701-2966-4530-a6ef-4ae0aecffb70.png)


我使用的IOS系统版本为 16.5。

## 解决方案

safari 提供了 meta 标签的方式可以把 PWA 应用覆盖到状态栏，官方的具体文档如下: [Safari Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)

文档中需要关注两个 meta 标签。
1. apple-mobile-web-app-capable

```
<meta name="apple-mobile-web-app-capable" content="yes">
```

这个感觉和 `manifest.json` 中的 `display: standalone` 的表现是一致的，两个选择一个就好，推荐使用 `manifest.json`，毕竟是 PWA 规范而不是 safari 的私有特性

2. apple-mobile-web-app-status-bar-style

```
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

设置状态栏样式，有三个值
default: 白底黑字，页面无法覆盖到状态栏

![default](/assets/Safari%20PWA应用覆盖状态栏实践/3531bc73-2378-43b1-a388-b6b518c3adca.png)

black: 黑底白字，页面无法覆盖到状态栏

![black](/assets/Safari%20PWA应用覆盖状态栏实践/26397fd8-dc69-47d4-9f98-4b0c31b8010b.png)

black-translucent: 透明底，白色字体，页面覆盖到状态栏

![black-translucent](/assets/Safari%20PWA应用覆盖状态栏实践/6267f3d6-903b-4bca-b0fa-a0474a124e19.png)

所以如果只是简单自定义一下状态栏黑白色，可以通过设置此 meta 为 default 或 black即可。那如果要设置颜色为黑色或白色之外的颜色就没有办法了吗？当然不是。

3. theme color

theme color 可以使用Meta 标签 theme-color，也可以作为 `manifest.json` 中 theme_color 的字段。作为 manifest.json 的规范，兼容度比较高，所以无论是从规范上还是从兼容性上来说，manifest.theme_color都是比较推荐的方案。

```
<meta name="theme-color" content="#f00">
```

```
// manifest.json
...
   "theme_color": "#f00"
...
```

需要注意的是 theme-color 在safari上不仅仅在PWA应用下生效，在浏览器中也会生效，状态栏文字颜色会自动根据背景颜色自动调整为黑色或白色。

![theme color](/assets/Safari%20PWA应用覆盖状态栏实践/2d9132a4-433d-4f96-84b7-651cbfa1b966.png)

## black-translucent的坑

1. 状态栏文字颜色固定为白色。

如果不甘于只是简单的自定义状态栏的背景颜色，那就需要使用 `black-translucent` 让页面覆盖到状态栏，然后在页面中自定义状态栏的背景，唯一遗憾的是，状态栏的文字颜色是写死的白色，所以为了让状态栏上的文字能比较清晰的显示，背景需要为深色。

2. 100%高度占不全

这个坑就有些离谱了，在html定义高度为 100% 时，预期是页面能占满手机屏幕，然而并不是，下面还有一部分没有覆盖到，如下图所示。

![html height 100%](/assets/Safari%20PWA应用覆盖状态栏实践/dee154fd-adc5-43ce-a9d5-9643d1be2a8a.png)

![未全覆盖](/assets/Safari%20PWA应用覆盖状态栏实践/376a6cda-12dc-419b-8b93-d806f3eae4a3.png)

实在是非常离谱，经过几番测试，发现了最终的解决方案在 html 上应用样式 height: 100vh 就可以了





