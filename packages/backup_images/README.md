# 备份图片

站点中的图片都在另外的图片上，不在仓库中。此脚本有以下功能

1. 遍历 `source` 目录下的所有 Markdown 文件，并下载 Markdown 文件中涉及到的图片到 `source/images/backup` 目录下

2. 更新 Markdown 文件中的图片的引用地址为下载到本地的图片的地址

使用方式

```
npm run start
```

之所以有此脚本，主要是考虑到图床的不稳定性，后续当某个图床不可用时，可以一键把原来放在图床上的图片下载到本地

而之所以把图片放另外的图床上而不是放在仓库中，一是因为之前 Github 仓库有大小限制，好像是 300M，所以为了避免图片占用大部分仓库空间，所以把图片放在了另外的图床上。二是也是考虑到维持尽可能小的仓库，方便 clone 和下载

目前 Githu 的仓库大小看官方文档是理想在 1G 以内，推荐在 5G 以内，可见上限已经很高了，可以考虑是否要把图片下载到仓库中


