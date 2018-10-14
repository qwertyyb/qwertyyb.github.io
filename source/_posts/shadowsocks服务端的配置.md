---
title: shadowsocks服务端的配置
date: 2017-05-28 20:54:06
tags: Linux, shadowsocks
categories: Linux
---

## 基于centOS7

### 安装组件
```
$ yum install m2crypto python-setuptools
$ easy_install pip
$ pip install shadowsocks
```
<!-- more -->
### 安装完成后配置服务器参数
```
$ vi /etc/shadowsocks.json
```
写入如下配置：
```
{
	"server": "0.0.0.0",
	"server_port": 443,
	"local_address": "127.0.0.1",
	"local_port": 1080,
	"password": "mypassword",
	"timeout" 300,
	"method": "aes-256-cfb",
	"fast_open": false,
	"workers": 1
}
```
将上面的mypassword替换成你的密码， server_port也是可以修改的， 例如443是Shadowsocks客户端默认的端口号
如果需要修改端口，需要在防火墙里打开相应的端口，用firewalld操作就简单了
```
$ vi /usr/lib/firewalld/services/ss.xml
```
把下面的代码粘贴到里面
```
<?xml version="1.0" encoding="utf-8"?>
<service>
  <short>SS</short>
  <description>Shadowsocks port
  </description>
  <port protocol="tcp" port="443"/>
</service>
```
port可自定义，但是需要跟上面的server_port对应起来，保存退出，然后重启firewalld服务
```
$ firewall-cmd --permanent --add-service=ss
$ firewall-cmd --reload
```
### 运行命令，启动Shadowsocks服务
```
$ ssserver -c /etc/shadowsocks.json
```
至此shadowsocks搭建完成，shadowsocks已经可以使用，如果你没有过高的要求，下面的步骤可以省略，下面是后台运行Shadowsocks的步骤。

### 安装supervisor实现后台运行
运行以下命令下载supervisor
```
$ easy_install supervisor
```
然后创建配置文件
```
$ echo_supervisord_conf > /etc/supervisord.conf
```
然后修改配置文件
```
$ vi /etc/supervisord.conf
```
在文件末尾添加
```
[program:ssserver]
command = ssserver -c /etc/shadowsocks.json
autostart = true
autorestart = true
startsec = 3
```
设置 supervisord 开机启动
```
$ vi /etc/rc.local
```
在末尾另起一行添加
```
$ supervisord
```
保存退出（和上文类似）。另 CentOS7 还需要为 rc.local 添加执行权限
```
$ chmod +x /etc/rc.local
```
至此运用 supervisord 控制 Shadowsocks 开机自启和后台运行设置完成。重启服务器即可
P.S. 如果当你在运行 supervisord 命令时出现以下的错误提示
```
'Supervisord is running as root and it is searching '
Error: Another program is already listening on a port that one of our HTTP Servers is configured to use. Shut this program down before starting supervisord.
For help, use /usr/bin/supervisord -h
```
那是因为 supervisord 已经启动了，重复启动就会出现上面的错误提示
