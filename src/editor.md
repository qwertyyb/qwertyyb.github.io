---
title: Markdown 编辑器
layout: 'editor'
---

# VitePress Markdown 编辑器

这是一个基于 Monaco Editor 的 Markdown 编辑器，支持 VitePress 扩展语法。

<editor />

## 功能特性

### 基础功能 ✅
- ✨ 正常输入和编辑
- 🎨 Markdown 语法高亮
- 🔄 实时语法检查

### VitePress 扩展语法支持
- 📦 容器语法：`:::info`、`:::tip`、`:::warning`、`:::danger`
- 📑 目录支持：`[[toc]]`
- 💡 行内提示：`[!NOTE]`、`[!TIP]`、`[!WARNING]`、`[!IMPORTANT]`
- 🎯 Vue 组件语法高亮

### 编辑器特性
- 🚀 代码自动完成
- 🎭 语法高亮
- 📱 响应式设计
- 🌙 深色主题支持
- 💾 代码片段支持

## 使用说明

1. 在编辑器中输入 Markdown 内容
2. 使用 `Ctrl/Cmd + Space` 触发自动完成
3. 支持 VitePress 特有的语法高亮
4. 编辑器会自动提供语法提示和代码片段

## 支持的语法

### 标准 Markdown
```markdown
# 标题
## 二级标题

**粗体文本**
*斜体文本*

- 无序列表
- 第二项

1. 有序列表
2. 第二项

> 引用文本

`行内代码`

```
代码块
```

[链接](url)
![图片](url)
```

### VitePress 扩展语法
```markdown
:::info
信息容器
:::

:::tip
技巧容器
:::

:::warning
警告容器
:::

:::danger
危险容器
:::

[[toc]]

[!NOTE] 行内提示
[!TIP] 行内技巧
[!WARNING] 行内警告
[!IMPORTANT] 重要提示
```