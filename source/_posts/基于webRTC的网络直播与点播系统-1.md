---
title: 基于webRTC的网络直播与点播系统(1)
date: 2019-04-03 17:02:07
tags: 
  - 前端
  - WebRTC
categories:
  - [前端, WebRTC]
---
## 简介
本项目基于webRTC技术，实现点对点直播，采用的框架和技术：
```
1. kurento——媒体服务器
2. 基于nodejs的服务器，实现信令传递，浏览器和媒体服务器交互和用户常规逻辑的后端
3. 前端vuejs，搭建用户界面
```
本节是关于kurento媒体服务器的搭建
<!-- more -->
## 媒体服务器的搭建
### 环境
  `ubuntu 16.04` 云服务器
### 搭建方式
  `docker`
### 搭建过程:
#### 1. 安装docker
1. 更新系统包索引
```
$ sudo apt-get update
```
2. 安装依赖
安装下面的依赖可以让apt通过https仓库来进行docker包的安装
```
$ sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
```
3. 添加docker官方的GPG密钥
```
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```
4. 添加docker的官方稳定版仓库
```
$ sudo apt-get install docker-ce docker-ce-cli containerd.io
```
5. 验证安装
通过运行`hello-world`镜像以验证docker已正确安装
```
$ sudo docker run hello-world
```
上面这条命令将下载一个测试镜像并在容器中运行，如果docker已正确安装，容器将输出一条信息并且退出



更多安装方式参考 [docker官方文档](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
#### 2. 安装kurento媒体服务器
`docker-compose` 是docker官方推出的管理docker容器和配置的软件，在Linux环境下安装docker时会自动安装 `docker-compose` 。在这里会把 `kurento` 容器运行的配置写入 `docker-compose.yml` 文件中(docker-compose用以管理docker的配置文件)。通过 `docker-compose` 来运行并管理 `kurento` 服务，
1. 配置服务
```yml
version: "3"

services:
  kms:
    container_name: kms
    image: kurento/kurento-media-server:xenial-latest
    ports:
       - "8888:8888"
```
简单解释一下这份配置的作用，这份配置起了一个名为kms并且以kurento官方提供的镜像为媒体服务器的容器，然后把镜像的8888端口映射到了主机的8888端口，这样通过访问主机的8888端口即可访问到kurento的媒体服务器，至于为什么是映射到容器的8888端口而不是其它商品是因为kurento服务器的默认端口为8888

想要了解更多的docker-compose相关，可以参考配置文档 [`docker-compose` 的官方文档](https://docs.docker.com/compose/compose-file/)

2. 运行服务
```
$ docker-compose up -d
```
上面这条命令即会运行刚刚配置的kurento服务器
3. 验证运行
```
$ docker-compose ps
```
上面这条命令若输出
```
Name      Command          State               Ports         
-------------------------------------------------------------
kms    /entrypoint.sh   Up (healthy)   0.0.0.0:8888->8888/tcp
```
即证明服务已正常运行