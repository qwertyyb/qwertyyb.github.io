---
title: 在github上把master分支的内容作为Github Pages站点
date: 2017-03-11 13:31:21
tags: 
  - github
  - Github Pages
categories:
  - [项目管理, Github, Github Pages]
---

在github上把master分支的内容作为Github Pages站点，有两种方法

<!-- more -->
## 方法一
把整个master分支或master分支的`/docs`目录作为GitHub Pages
#### 第一步
把代码传到github远程仓库
#### 第二步
如果把整个master分支作为Github Pages站点，在settings下Github Pages的source中选择master branch

如果把master分支的`/docs`目录作为Github Pages站点，则在setting下Github Pages的source中选择master branch /docs folder

> 参考链接：[Simpler Github Pages publishing](https://github.com/blog/2228-simpler-github-pages-publishing)

## 方法二
如果你的确想用master分支的其他目录作为Github Pages站点（比如说`/dist`）

#### 第一步

`/dist` 目录需要被 git 记录，于是后面我们才可以用它作为子树（subtree），因此 `/dist` 不能被 `.gitignore `规则排除,并且上传到远端仓库。

第二步

`git subtree push --prefix dist origin gh-pages`

搞定。其中：

`dist` 代表子树所在的目录名
`origin` 是 remote name
`gh-pages` 是目标分支名称

<!-- more -->
