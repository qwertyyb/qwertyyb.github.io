---
title: 第三方输入法在Safari地址栏输入卡顿的原因分析和验证
date: 2023-04-26 13:47
categories:
  - [MacOS, 业火输入法]
  - [MacOS, InputMethodKit]
tags:
  - MacOS
  - InputMethodKit
  - 业火输入法
---

使用第三方输入法在Safari地址栏输入时，经常会遇到卡顿无响应的问题。在一个问题的排查分析中，发现了可能导致这个问题的原因，本文将并对此猜测进行验证，探索是否有解决方案

<!-- more -->

### 卡顿原因的猜测

具体是在排查 [`在Safari地址栏中从中文模式切换到英文模式时，原码未自动上屏的问题`](https://qwertyyb.github.io/2023/04/23/IMKInputController%20%E7%9A%84%E7%A2%8E%E7%A2%8E%E5%BF%B5/#activateServer-%E5%92%8C-deactivateServer-%E7%9A%84%E8%B0%83%E7%94%A8%E6%97%B6%E6%9C%BA%E5%92%8C%E9%A1%BA%E5%BA%8F) 发现在地址栏输入时，会同时创建很多个IMKInputController实例，猜测可能是因为在同一时间创建了多个IMKInputController实例，瞬间有一个比较高的资源占用峰值，因而导致了卡顿。

### 验证猜测

在没有办法改变系统行为，点击地址栏一定会出现创建多个实例的前提下，那么只能降低创建实例的成本，以降低资源的占用和性能消耗。目前看有两个调整点，一是activateServer 方法，二是实例属性的初始化。

具体的实施方案

### 解决方案
