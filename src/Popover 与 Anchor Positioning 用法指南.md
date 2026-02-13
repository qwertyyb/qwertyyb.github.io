---
title: Popover 与 Anchor Positioning 用法指南
created: 2025-12-22
---

[[toc]]

# Popover 与 Anchor Positioning 用法指南

## 介绍

popover 不同于 dialog, dialog 是 HTMLElement, 是一个元素节点。而 popover 是 HTMLElement 的 attribute, HTMLElement 设置了 popover 属性之后，它就变成了 popover。

popover 与 dialog 最大的不同在于，dialog 可以是模态框，而 popover 不能是模态的。

popover 可以与 CSS 的 Anchor Positioning API 结合使用，即让 popover 相对于某一个元素进行定位。

## 需要注意的点

### Anchor Positioning 定位

`Anchor Positioning` 是相对于 BFC 的。如果父元素的样式中有 `transform`、`will-change` 等会产生  BFC 的样式时， 由于 `Anchor Positioning` 计算的位置是相对于 BFC 的位置，而非视口位置，所以 popover 的位置不能随便放置，需要与 anchor 元素位于同一个 BFC，才不会导致位置错乱。

### position-try-fallbacks 导致过渡效果丢失

popover 可以设置显示或隐藏时的过渡效果，但是当同时使用 height: calc-size(fit-content, size) + position-try-fallbacks + transition 时， popover 在显示时的高度过渡效果会失效，至少在目前的 Chrome 143 版本上不行，猜测原因可能如下。

根本原因：布局计算时机冲突
```css
popover {
  height: calc-size(auto, size);  /* 动态计算高度 */
  transition: height 0.3s ease;
  position-try-fallbacks: [top] [bottom];
}
```

问题流程：
1. Popover 显示时，浏览器需要同时计算：
   - calc-size()的动态高度
   - position-try-fallbacks的最佳定位位置
2. 这两者是并行计算的，浏览器可能在定位回退尝试过程中多次计算高度
3. 过渡动画在第一次布局计算时就已经开始，但后续的定位尝试会导致高度重新计算
4. 结果：过渡的起始值变得不确定，动画被中断或直接跳到最终值

为什么固定高度不会失效？
```css
/* 正常工作 */
popover {
  height: 300px;  /* 固定值，不依赖布局计算 */
  transition: height 0.3s ease;
  position-try-fallbacks: [top] [bottom];
}
```
- 固定高度不需要计算，是已知常量
- 过渡动画有明确的起始和结束值
- 定位回退不影响高度值

