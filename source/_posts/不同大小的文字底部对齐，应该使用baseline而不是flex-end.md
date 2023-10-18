---
title: 不同大小的文字底部对齐，应该使用baseline而不是flex-end
date: 2023-10-18
tags:
  - css
  - fontSize
  - 文字底部对齐
categories:
  - [前端, css]

created_from_issue: true
---

flex容器下，不同大小的文字底部对齐，为什么应该使用 baseline 而不是 flex-end?

<!-- more -->

## 背景－从一个兼容性Bug说起

看一下最简单的例子:

```html
<div class="container" style="display: flex;align-items: flex-end">
    <div class="big-text" style="font-size: 26px">大字体</div>
    <div class="small-text" style="font-size: 14px">小字体</div>
</div>
```
运行的效果如下:

<img width="132" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/8e0e1fc8-e4af-49e5-9afa-8c2ddca5d068">

可以看到两个字体所在矩形虽然对齐了，但是两个文字的底部并没有对齐。
分析原因发现，是因为文字周围有一圈空白的边距，这个边距在字体大小不同的情况下是不一致的，所以矩形区域虽然对齐了，但是文字底部没有对齐。而这个边距其实和 `line-height` 有关，所以首先来看看如何从 `line-height` 的角度出发解决问题。

## 从 `line-height` 的角度解决

### 为什么你不应该使用 `line-height: 1`

首先想到的就是把文字周围的边距给彻底去掉，也即设置 `line-height: 1`，那么为什么说不应该使用这种方式呢？有以下几个原因: 

1. 在 `line-height: 1` 的情况下，文字如果长度不定，出现了换行，就会出现两行文字紧贴在一起的情况，如下。因为 `line-height` 被用来去掉边距了，所以无法再调整换行后文字的行距了。

<img width="136" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/adbaba47-e897-439f-b5c2-271a88194cec">

2. `line-height: 1` 和 `overflow: hidden` 会出现字体上下部分被剪切的问题，如下。这里有点反直觉，`line-height: 1` 直觉上应该和字体的高度是一致的，但是在实际运行过程中发现，并不是这样的，主要和设备的字体有关，这里后面再详细探讨具体原因。

<img width="152" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/226dd6ce-4de2-4f6c-953c-ce13c3b59e97">


### 使用 `line-height` 的正确方法

在完全去掉周围边距这种方法不可用的情况下，只能通过把不同字体大小的透明边距宽度设置为一致就可以了。基本原理是 矩形区域高度 = (line-height) ≈ (fontSize + 透明边距)。

修改代码如下: 

```html
<div class="container" style="display: flex;align-items: flex-end">
    <div class="big-text" style="font-size: 26px;font-size: 30px">大字体</div>
    <div class="small-text" style="font-size: 14px;font-size: 18px">小字体</div>
</div>
```

运行效果如下:

<img width="230" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/724d58b4-ce2a-4fba-85ed-dcf286eb7bc4">

这样就把透明边距都控制为2px，让文字近似做到了底部对齐的效果。

## 终极解决方案－align-items: baseline

可能更多人使用的是 align-items 的 `flex-start`、`center`、`flex-end` 这几个特性，很少使用 `baseline`、`first baseline`、`last baseline`，但是在文字对齐上，后面的这三个特性更有用。

经过实测，`align-items: baseline` 可以完美的做到文字的底部对齐，修改代码:

```html
<div class="container" style="display: flex;align-items: baseline">
    <div class="big-text" style="font-size: 26px">大字体</div>
    <div class="small-text" style="font-size: 14px;">小字体</div>
</div>
```

运行效果:

<img width="147" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/cf51803a-5b36-4816-86b3-024f50af20ac">



个人理解，前面比较经常用的一些属性值主要是用于盒子的对齐，而 `baseline` 相关的三个属性值，是让盒子内文字的 `baseline` 对齐。而 `first baseline` 和 `last baseline` 应该是在多行文本情况下有多个 `baseline` 的情况时，要对齐第一个 `baseline` 还是最后一个 `baseline`，实测如下:

1. first baseline

<img width="221" alt="align-items: first baseline " src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/a57e902a-8571-47b6-a0a5-4ad20adfc02d">

2. last baseline

<img width="230" alt="align-items: last baseline" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/baa371d3-c7fc-4581-a406-becdcb057ffa">










