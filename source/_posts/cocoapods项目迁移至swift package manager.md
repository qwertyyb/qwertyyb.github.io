---
title: cocoapods项目迁移至swift package manager
date: 2023-09-15 16:00
tags:
  - Fire
  - Swift
  - MacOS开发
  - 业火输入法
categories:
  - [MacOS开发]

created_from_issue: true
---

把 业火输入法 的项目依赖从 cocoapods 迁移至 swift package manager 记录

<!-- more -->

### 1. cocoapods移除

- 首先执行命令 `pod deintegrate`，会自动移除 Pods 目录
- 然后删除 Podfile 和 Podfile.lock 文件
- 最后用 Xcode 打开 *.xcodeproj 文件，后续就不使用 *.xcodeworkspace 文件了

### 2. 通过SPM安装原来cocoapods的依赖

切到项目配置 Package Dependencies TAB 下，点击添加图标，右上角输入依赖地址，会自动加载依赖，此处需要注意版本匹配，安装的版本最好和原来cocoapods的依赖版本一致，防止库依赖升级后无法使用。

<img width="500" alt="Snipaste_2023-09-15_18-22-10" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/1a880a85-a7a7-48a4-94d1-32b92e966b2b">

另外需要注意的是，如果 SPM 依赖在墙外，最好是有梯子。

#### 2.1 卡 Preparing to validate... 的解决方案

问题:  添加 SPM 依赖时，界面一直卡在 Preparing to validate...，如下:

<img width="400" alt="preparing to validate..." src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/077a4980-0ce9-435a-b3bf-58bd1cea3f3e">

解决方案: 把 Build Location 从 Legacy 调整为 Xcode Default。调整方式: 菜单File --> Project Settings --> Advanced... --> 选中Xcode Default，然后重启 Xcode，再添加 SPM 依赖就可以成功了。

### 3. SQLCipher的迁移

项目中使用了 SQLCipher 来存储敏感数据，但是 SQLCipher 只有 cocoapods 依赖，没有 SPM 包（[相关issue](https://github.com/sqlcipher/sqlcipher/issues/371)），需要自行构建处理(待补充)

### 4. 总结

迁移总体而言还算比较简单，但是 SPM 这种方式的缺点也是有的，比如说如果依赖的包后续删库跑路了，那在新设备上依赖应该就会无法安装了，所以要慎重引入依赖并做好容灾管理。


