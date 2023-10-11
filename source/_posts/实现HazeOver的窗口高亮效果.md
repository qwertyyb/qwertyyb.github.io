---
title: 实现HazeOver的窗口高亮效果
date: [DATETIME]
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

所以要做的就是搞一个遮罩也就是半透明的窗口，让这个窗口始终处于最前面窗口的后面。半透明的窗口很好实现，不是问题，问题在于，如何让这个窗口处于最前面窗口的后面。

### 2. 监听最前方窗口变化

另一个问题在于最前方的窗口是会变更的，当最前方的窗口变更的时候，应用程序如何及时收到通知，把遮罩移动到新的最前方窗口下面。

## 调研技术方案

### 1. 让遮罩窗口位于最前方窗口后面

一番搜索查找，在 NSWindow 的官方文档上找到了答案，NSWindow 实例上有一个 [`order(_:relativeTo:)` 的方法](https://developer.apple.com/documentation/appkit/nswindow/1419672-order)，可以指定这个窗口实例放在某个弹窗的上面或下面。

但是这个方法也不太好调用，需要传入对应窗口的 number 字段，而对应的窗口一般是其他应用程序的窗口，所以如何获取到最前面应用的最前面窗口的 number 字段，感觉很是一个比较棘手的问题，官方文档也印证了这个想法，官方提供了 NSWindowList 来获取，但是这个方法早就被取消不可用了。

没办法，经过一番网络搜刮，找到了一个可用的方法 [CGWindowListCopyWindowInfo](https://developer.apple.com/documentation/coregraphics/1455137-cgwindowlistcopywindowinfo)，这个方法返回一个有序的窗口数组，顺序就是从屏幕最前面到最后面，数组中的元素为 Dict，可以通过 kCGWindowNumber 字段获取到窗口的 number 字段。

如此终于就能调用 `NSWindow.order(:relativeTo:)` 的方法了，如此，第一个问题也就有了技术方案。

### 2. 监听最前方窗口的变化

## 丐版实现

## 如何实现平滑的过渡


