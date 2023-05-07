---
title: Hexo + Github Pages + Github Actions + Github Issues 工作流
date: 时间
tags:
  - Hexo
  - Github Pages
  - Github Actions
categories:
  - [前端, Hexo]
  - [项目管理, Github, Github Pages]
  - [项目管理, Github, Github Actions]

created_from_issue: true
---

使用 `Github Issue` 写文章，同步到 `Hexo` 静态站点，利用 `Github Actions` 构建 `Hexo` 静态站点并发布到 `Github Pages` ，构建易用的工作流。

<!-- more -->

## 背景

目标当然是为了能够方便快捷地写作，同时低成本，最好是能白嫖。

先看看起始的写作流程是什么
1. 把项目 Clone 到本地
2. `npm install` 安装依赖
3. 执行 `hexo new xxx` 在 `source/_posts/` 目录创建一个 Markdown 文件
4. 使用 Markdown 编辑器打开新创建的文件进行写作
5. 执行 `hexo build && hexo deploy` 发布到 `gh-pages` 上

遇到的问题: 
如果在一个新的设备上，当开始写作时，要做很多前置工作才能准备好环境，很多时候，当everything is ready，已经没有写作的兴致了。

## `Github Actions` 自动构建

自从 `Github` 被微软收购后，开始财大气粗地推出了很多需要烧钱的功能，[`Github Actions`](https://github.com/features/actions) 就是一项强大的功能，可以用 `Github Actions` 来做CI/CD 自动化流程。借助 `Github Actions` 和 `Github` 在线编辑 Markdown 的功能可以不用把项目 Clone 下来了。

我可以在 `Github` 在线仓库中，在对应的 `source/_posts/` 目录直接 `Create New File`, 新增一个 Markdown 文件，然后直接在线编辑即可，编辑完直接在线 `commit` 到仓库中。

`Github Actions` 在检测到 `master` 分支上有新的 `commit` —— 即 `push` 事件，自动执行拉 `master` 分支，安装依赖，执行构建，发布到 `gh-pages` 分支这一系列操作。

遇到的问题:

1. 在线创建的 Markdown 文件是空的，需要我手动填充 Front Matter 内容和格式，一是容易遗漏，二也容易出错。
2. Github 仓库的在线 Markdown 编辑器不能支持图片的上传，导致每次写作时，需要引用图片的时候，我还需要想办法把图片上传到图床获得图片地址才行，太不优雅了。

## 图片放在哪里?

关于图片放在哪里的问题，首先我不喜欢把图片放在仓库中，虽然不会丢失，但是会导致仓库变大，不太好看。而所有的国内的所谓图床，大企业的如微信、微博都有防盗链，无法使用在我的个人站点，而小企业的图床都是朝不保夕，说不定哪天就没了，很不稳定。所以可供选择的图床仅有国外的类似 `imgur` 等相对而言还比较可靠。

我发现在 Github 的 issue 中上传的图片可在无鉴权的情况下访问，也没有限制第三方网站的直接引用，所以相对于 `imgur` ，我更倾向于把图片上传到 Github 中，毕竟我的整个站点都是放在 Github 仓库中，那我希望我的图片也能放在 Github 上。

## 用 `Github Issues` 写作

自从发现在 Github Issues 中可以上传图片后，我就发现 Github Issues 的编辑器很好用，支持 Markdown 还能直接拖拽上传图片。除此之外，还有模板的能力，可以在模板中写入 Front Matter，能完美解决上面遇到的两个问题。那么如果我用 `Github Issues` 写作，然后使用 `Github Actions` 把 issues 中的文章同步到仓库，就能发布到个人站点了。

为此，写了一个 `nodejs` 脚本，去读取仓库下的 `issues` 内容同步到 `sources/_posts/` 文件夹，可[在这里找到具体实现](https://github.com/qwertyyb/qwertyyb.github.io/tree/master/packages/create_from_issues)。

具体步骤如下: 

1. 在项目仓库中创建一个 Issue Label 命名为 `posts`，脚本将拉取包含此 label 的 issues 并生成 Markdown 文件。在生成 Markdown 文件时，在 Front Matter 中插入一个特殊的字段 `create_from_issue: true` 以标记是的 issue 自动生成的。
2. 创建一个 Issue 模板(Issue Template), 命名为 posts，labels 选中 posts label, 然后填充 posts 的模板内容填充。**这里需要注意的是 posts 使用 Front Matter 来定义创建时间、标题、分类、标签等元数据，但是 issue template 也使用 Front Matter 来定义模块的标题、描述、内容等数据，所以如果在模块的默认内容中也使用 Front Matter来填充，会冲突，所以内容区域的Front Matter不要写全，可以只写上面部分或下面部分**。如下图:

    2.a. 使用 Front Matter 作为模板内容填充，从模块创建时，内容是空的。

    ![使用 Front Matter 作为模板内容填充](https://user-images.githubusercontent.com/16240729/236664337-4b8115ae-43d0-47ef-a594-79b9e7559db2.png)
     ![从模板创建时，内容是空的](https://user-images.githubusercontent.com/16240729/236664364-6d4d3487-d12a-4bc9-88f3-ce900624cbb3.png)

    2.b. 不用完整的 Front Matter 填充，仅填写上面的分隔符，从模板创建时内容正常。

      ![不用完整的 Front Matter 填充，仅填写上面的分隔符](https://user-images.githubusercontent.com/16240729/236664422-25c1279b-319f-41cf-b21a-8ed9415af00f.png)
       ![从模板创建时内容正常](https://user-images.githubusercontent.com/16240729/236664452-7c0018ed-886e-4627-aade-6d290b265b3e.png)

经过上面一番操作，终于可以愉快的写作了，不再需要clone项目等前置操作，流程完全自动化了，不再有任何的技术门槛了。

![工作流程](https://user-images.githubusercontent.com/16240729/236663063-cb90e3a1-e109-42cd-b6cb-6c63f0e84af7.png)

## 国内访问

GIthub Pages 在国内的访问一直都很不流畅，处于半墙不墙的状态，如果有条件的话当然是可以在 `Gitee` 码云部署一个 `Gitee Pages` 作为镜像站点，但是码云从2022年起，所有的代码都会被人工审核，`Gitee Pages` 更是要求实名认证 ＋ 手举身份证的照片，如果不介意，Gitee Pages应该是最好的方案。如果介意，可以使用 `GitLab Pages` 或 `netlify.app` 这两个虽然在国内没有服务器，但是目前还没有被墙，也可以作为替代方案。

![github pages在国内的测速情况](https://user-images.githubusercontent.com/16240729/236665323-ca1c79b1-49e1-48d7-a91c-3a3c6d4bfd14.png)

![gitlab pages在国内的测速情况](https://user-images.githubusercontent.com/16240729/236665335-01f38978-6780-4aab-900d-8b8afacdef1a.png)

![netlify app在国内的测速情况](https://user-images.githubusercontent.com/16240729/236665376-a1f34ce2-26fc-4e1c-9890-1bb6e77e48d8.png)
