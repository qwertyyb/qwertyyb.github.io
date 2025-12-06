---
title: 基于webRTC的网络直播与点播系统-2
created: 2019-04-04 11:08:25
tags:
  - 前端
  - WebRTC
  - 信令服务器
  - NAT穿透
  - Cotun
categories:
  - [前端, WebRTC]
---
WebRTC是在两个浏览器之间建立点对点实时通信的技术，在双方进行通信时不需要中心服务器的参与。然而在通信开始前，双方需要交换一些会话信息，所以需要知道彼此双方的IP地址和端口。

而目前的网络环境下，通信的两台主机往往位于局域网中，并不会分配到公网IP地址，仅有私网IP地址，两台主机是没有办法进行通信的，为此需要NAT穿透服务，把私网IP映射到公网IP上，以此来实现双方的通信。NAT穿透的原理请参考

本节主要说明NAT穿透服务coturn的搭建
<!-- more -->
## 简介
`coturn` 是一个免费的开源的 `TURN/STUN` 服务器。coturn 服务器完整的实现了 `STUN/TURN/ICE` 协议，支持 P2P 穿透防火墙。

STUN 服务器用于获取设备的外部网络地址
TURN 服务器是在点对点失败后用于通信中继。
`WebRTC` 建立连接的步骤大概是这样的：

客户端（浏览器）直接尝试直连；
如果如果直连则通过 STUN 服务器进行穿透；
如果无法穿透则通过 TURN 服务器进行中转。

## 安装过程
安装方式，apt-get二进制文件安装
### 1. 下载
```
sudo apt-get install coturn
```

### 2.配置
```
sudo vim /etc/turnserver.conf
```
配置项有很多，都以#开头，表示注释，也说明默认配置或配置示例
配置如下：(没有列出的配置不用修改，列出的配置去掉前面的#取消注释并修改如下)
```
listening-ip=<内网IP>
reply-ip=<内网IP>
external-ip=<外网IP>
fingerprint
lt-cred-mech
realm=kurento.org
user=<username>:<password>
```
这在段配置可以参考 [`kurento` 文档中的配置](https://doc-kurento.readthedocs.io/en/6.9.0/user/faq.html)

**配置说明**

内网IP: 云服务器一般也处于服务商的内网中，一般以10开头，可通过运行命令 `ifconfig` 查看

外网IP: 云服务器一般会有一个外网IP地址，可在服务商平台查看

username: turn转发服务的用户名

password: turn转发服务的密码，这里采用最简单的静态密码，所以密码不能以0x开头，否则会被以为是一个密钥，具体的配置说明可查看 [coturn的配置文档](https://github.com/coturn/coturn/wiki/turnserver)

然后执行命令
```
sudo vim /etc/default/coturn
```
在 `TURNSERVER_ENABLED=1` 前面加#注释掉这一行，然后即可随系统自动启动

### 3. 运行
在控制台执行命令
```
sudo systemctl start coturn
```
**注意**

coturn穿透服务需要随机使用UDP端口，所以需要放开服务器的49152到65535(coturn的默认使用的端口范围)的UDP服务的端口，或许需要在服务器或服务商的安全组中进行调整

### 4. 测试运行
测试coturn服务是正常运行的方法，只需要向服务器发起ICE请求，若返回了请求主机的IP地址就证明coturn服务已正常运行，可在
[Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) 进行测试
在URI处填入turn:<服务器外网IP>:3478,再填入用户名和密码，添加后Gather candidates, 看是否显示出了当前的主机IP地址

### 5. 配置kurento服务的穿透服务
在上一步，已经使用 `docker` 的方式安装了 `kurento` 媒体服务器，现在只需要修改 `docker-compose.yml` 文件如下:

```yml
version: "3"

services:
  kms:
    container_name: kms
    image: kurento/kurento-media-server:xenial-latest
    ports:
       - "8888:8888"
    volumes:
       - ./WebRtcEndpoint.conf.ini:/etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini
```
然后在 `docker-compose.yml` 的同级目录下新增文件 `WebRtcEndpoint.conf.ini` 文件，内容如下:
```yml
turnURL=<username>:<password>@<serverIP>:<serverPort>
```
**说明**

- username: turn服务的用户名，在上面配置的
- password: turn服务用户名对应的密码，上面已经配置
- serverIp: turn服务运行的服务器的公网IP
- serverPort: turn服务运行的端口，如果没有修改过coturn的默认配置，则默认端口为3478

执行命令
```
docker-compose restart kms
```
重启kurento media server使配置生效，至此，本章完成



