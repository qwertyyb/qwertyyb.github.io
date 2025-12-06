---
title: 实现HazeOver的窗口高亮效果
created: 2023-10-17
tags:
  - Macos
categories:
  - [Macos]

created_from_issue: true
---

如何自己实现一个HazeOver，实现前置窗口的高亮效果。

<!-- more -->

## 背景

<img width="400" alt="HazeOver" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/fa37171c-3b39-478f-ade5-56799a9a475d">


[HazeOver](https://hazeover.com/) 是一款可以高亮当前最前方窗口的 MacOS 应用，遗憾的是它不免费，官网售价高达54元。我当真是不能理解为什么一个这么简单的东西竟然能要价这么高，所以我打算自已写一个类似的应用来满足我的需求。

## 基本思路

### 1. 窗口高亮

首先需要了解的是，不是最前面的窗口变亮了，而是后面的窗口被遮罩挡住了变黑了，就像下面图示这样。

<img width="464" alt="Snipaste_2023-10-18_12-52-37" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/3edd2be7-d0c8-4f08-8ef9-71966bf3c2d1">


所以要做的就是搞一个遮罩也就是半透明的窗口，让这个窗口始终处于最前面窗口的后面。半透明的窗口很好实现，不是问题，问题在于，如何让这个窗口处于最前面窗口的后面。

### 2. 监听最前方窗口变化

另一个问题在于最前方的窗口是会变更的，当最前方的窗口变更的时候，应用程序如何及时收到通知，把遮罩移动到新的最前方窗口下面。

## 难点

### 1. 让遮罩窗口位于最前方窗口后面

一番搜索查找，在 NSWindow 的官方文档上找到了答案，NSWindow 实例上有一个 [`order(_:relativeTo:)` 的方法](https://developer.apple.com/documentation/appkit/nswindow/1419672-order)，可以指定这个窗口实例放在某个弹窗的上面或下面。

但是这个方法也不太好调用，需要传入对应窗口的 number 字段，而对应的窗口一般是其他应用程序的窗口，所以如何获取到最前面应用的最前面窗口的 number 字段，感觉很是一个比较棘手的问题，官方文档也印证了这个想法，官方提供了 NSWindowList 来获取，但是这个方法早就被取消不可用了。

没办法，经过一番网络搜刮，找到了一个可用的方法 [CGWindowListCopyWindowInfo](https://developer.apple.com/documentation/coregraphics/1455137-cgwindowlistcopywindowinfo)，这个方法返回一个有序的窗口数组，顺序就是从屏幕最前面到最后面，数组中的元素为 Dict，可以通过 kCGWindowNumber 字段获取到窗口的 number 字段。

如此终于就能调用 `NSWindow.order(:relativeTo:)` 的方法了，如此，第一个问题也就有了技术方案。

### 2. 监听最前方窗口的变化

也是一番网络搜刮，最后找到了Accessibility API来监听最前窗口变化的方案。然而这个API是监听某个具体应用的最前方窗口变化，需要先监听最前方应用变化，然后才能使用这个Accessibility API。

具体代码可[参考这里](https://github.com/qwertyyb/hw/blob/main/hw/WindowHightlight.swift#L109)

### 3. 实现平滑的过渡

把 MaskWindow 直接放置在最前方的窗口后面，虽然能实现最前方窗口高亮的效果，但是当最前方窗口变化时，由于 MaskWindow 是直接出现在窗口后面的，所以原来高亮的窗口会由高亮突然变黑，变为最前方的窗口会由黑突然高亮，这两个变化没有过渡，会非常生硬，所以为了更好的用户体验，希望能有一个过渡效果。

如果把渐隐渐现的过渡效果直接应用在 MaskWindow 上，同样是上面的过程，MaskWindow 会经历从黑变亮，再从亮变黑的过程，虽然有了过渡效果，但是出现了新的闪屏问题。分析后发现，闪屏问题出现的原因，主要是因为 MaskWindow 是覆盖整个屏幕的，所以把过渡效果应用到整个窗口时，就会出现整个屏幕由黑变亮，再由亮变黑，最终导致了闪屏问题。经过考虑和实测后发现，当最前方窗口变化时，新的最前方窗口其实从黑变亮这一过程是不太需要过渡的，过渡反而会很奇怪。所以现在需求就更明确了一些，当最前方窗口变化时，期望旧的窗口的亮度能缓慢从亮变黑。

所以核心问题变成了，过渡的时候如何只过渡旧的窗口区域过渡，而保持屏幕的其他区域亮度不变？

经过思考，想到了一种方案，使用两个 MaskWindow 来交替执行淡入淡出效果，示意图如下:


<img width="795" alt="Snipaste_2023-10-18_13-02-42" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/47572d72-54a6-4b0d-86b3-e7e6ea5360ce">


MaskWindow1 淡出，透明度从半透明变为全透明，MaskWindow2 淡入，透明度从全透明变为半透明，两个 MaskWindow 同时开始过渡，均为线性过渡，这样就能保证在过渡过程中除了旧的窗口之外的其他区域，两个 MaskWindow 叠加后的效果是一致的。然后当新的最前方窗口变化时，就把 MaskWindow2 淡出，MaskWindow1 淡入。就像上面这样，两个 MaskWindow 轮流执行淡入淡出，最终达到期望的效果。

