---
title: iptables 用法用量
date: 2024-01-12
tags:
  - linux
  - iptables
  - 防火墙
categories:
  - [linux, iptables]

created_from_issue: true
---

`iptables` 的相关用法，涉及到一些疑难杂症

<!-- more -->

## 背景

`iptables` 是 `Linux` 上用来配置防火墙的工具，虽然目前的 `Linux` 发行版似乎都不待见它，`centos 7` 默认使用 `firewalld ` 来替换 `iptables` , `ubuntu` 使用 `ufw` 和 `nftables` 来弃用 `iptables`，但是在开发领域，了解 `iptables` 仍然非常有必要。

## 一些基础知识

`iptables` 的基础概念有 `table`、`chain` 和 `rule`, 已经有已经详细的文章能解释这三个概念间的区别了，这里就不再多说了

## 一些易错的点

### 清空现有的规则

```bash
iptables -F # 只是清除 `filter` 表中所有 `Chain` 的规则，不会清空 `nat` 表中的 chain

iptables -t nat -F # 清空 `nat` 表中的所有 `Chain` 的规则
```


### 关于端口转发或者NAT

一张图说明所有

<img width="1506" alt="iptables nat规则" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/cdfbd12b-f8db-4ad0-bfa2-4c422bf3442b">




