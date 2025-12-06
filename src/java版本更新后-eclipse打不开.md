---
title: java版本更新后,eclipse打不开
created: 2017-11-02 20:29:33
tags: java
categories: java
---

在安装 `jdk` 的时候，安装成功后会默认询问是否安装 `jre` ，很多人是一路默认，稀里糊涂就安装上了。今天就遇到了这个问题，`jre` 环境更新后，`eclipse` 打不开了，报找不到 `jre` 的环境了，经过研究，打到了解决办法，这里记录一下。

<!-- more -->

## 解决办法
在 `C:\Users\{你的用户名}\eclipse\java-oxygen\eclipse` 目录下，找到 `eclipse.ini` 文件，找到 `-vm` 行的下一行，把路径改为jdk下的 `jre/bin` 这样，以后 `jre` 再升级的时候也不会出错了

## 出错的原因
在安装jdk后，java目录会出现两个文件夹，jdk和jre, 具体的目录名字，还会包括版本号，当初始化eclipse的时候，会用jre的目录初始化，而当jre升级后，原来的版本更改，目录名也变了，自然就找不到原来的环境目录了

参考连接：
更详细的原理请参考这里： [安装JDK的时候为什么会有两个jre文件](http://www.cnblogs.com/PengLee/p/3970760.html)
