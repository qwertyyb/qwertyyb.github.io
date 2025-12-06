---
title: cocoapods项目迁移至swift package manager
created: 2023-09-15 16:00
tags:
  - Fire
  - Swift
  - MacOS开发
  - 业火输入法
categories:
  - [MacOS开发]

created_from_issue: true
---

把 [业火输入法](https://github.com/qwertyyb/Fire) 的项目依赖从 `cocoapods` 迁移至 `swift package manager` 记录

<!-- more -->

### 1. `cocoapods` 移除

- 首先执行命令 `pod deintegrate`，会自动移除 `Pods` 目录
- 然后删除 `Podfile` 和 `Podfile.lock` 文件
- 最后用 Xcode 打开 `*.xcodeproj 文件` ，后续就不使用 `*.xcodeworkspace` 文件了

### 2. 通过 `SPM` 安装原来 `cocoapods` 的依赖

切到项目配置 `Package Dependencies` TAB 下，点击添加图标，右上角输入依赖地址，会自动加载依赖，此处需要注意版本匹配，安装的版本最好和原来 `cocoapods` 的依赖版本一致，防止库依赖升级后无法使用。

<img width="500" alt="Snipaste_2023-09-15_18-22-10" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/1a880a85-a7a7-48a4-94d1-32b92e966b2b">

另外需要注意的是，如果 `SPM` 依赖在墙外，最好是有梯子。

#### 2.1 卡 Preparing to validate... 的解决方案

问题:  添加 SPM 依赖时，界面一直卡在 Preparing to validate...，如下:

<img width="600" alt="preparing to validate..." src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/077a4980-0ce9-435a-b3bf-58bd1cea3f3e">

解决方案: 把 `Build Location 从 Legacy` 调整为 `Xcode Default`。调整方式: 菜单File --> Project Settings --> Advanced... --> 选中Xcode Default，然后重启 Xcode，再添加 `SPM` 依赖就可以成功了。

#### 2.2 No Such Module "xxx" 的解决方案

安装了对应依赖的 `SPM` 版本后，理论上，应该能够成功执行构建了，网络上的迁移文章也都是如此顺利，没有多余的其他步骤了。但是在 业火输入法 的迁移中，却出现了意外的错误 `No Such Module "xxx"` ，我几乎搜刮了网络上所有关于此错误的案例，但是都不适用于我的场景，真是让人十分头大。

万般无奈之下，我只能重新创建了一个同名的项目，然后把旧项目的 `Fire.xcodeprj` 用新项目的 `Fire.xcodeprj` 文件替换掉，因为新创建的项目使用 `SPM` 依赖是完全没有问题的。需要注意的是替换之后，要把原项目的所有文件都重新导入到项目中，一直最后一步之前，我所有的迁移都是能正常成功构建和运行的。

在完全迁移的最后一步，终于再次出现了意外的情况，而我也终于定位到了之前出现 `No Such Module` 的原因。由于我迁移的项目是输入法，所以为了能够在开发时进行调试，不同于一般的应用，直接运行就能Debug，我需要把构建的项目放在 `/Library InputMethods` 目录下，为此我在 `Build Settings` 中使用了 `CONFIGURATION_BUILD_DIR` 来改变构建目录。然后我就发现项目构建失败了，出现了和上面 `No Such Module "xxx"` 的同样错误，由此我也就最终找到了上面出现的报错的原因。

猜测之所以报错是因为，SPM 的依赖还在原来的构建目录下，在新的构建目录下，没有 SPM 的依赖，所以出现了上面的问题，之所以有此猜测，是因为网上有些解决方案是通过把原来构建目录下的 SPM 包挪到新构建的目录下修复的，可以参考这个文档: https://stackoverflow.com/questions/57165778/getting-no-such-module-error-when-importing-a-swift-package-manager-dependency。然而这个文档里面的 `fix SPM` 脚本能运行的前提是，需要先 `build Release`才行。

所以需要寻找更完美的方案来解决，我遍历了 Fire Target 下的 所有 `Build Setting` 配置，发现里面有一个 Deployment 的配置，这里面的 `Deployment Location` 、 `Installation Build Products Location`、`Installation Directory` 感觉似乎可以解决这里的问题。于是简单调整了一下这里的配置，如下: 

<img width="588" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/bdfc309c-7169-4c04-89bb-6ee5f22c476d">

再重新运行项目，通过在终端运行 `ps -ef | grep Fire.app` 发现运行目录已经变成了在 `/Library/Input Methods` 目录下，符合预期，这里需要注意两个问题:

1. 最终部署app的目录是 Installation Build Products Location + Installation Directory。
2. 另外就是可能会发现修改了这里的配置后，通过 `Archive` 构建出来的归档的 `Type` 为 `generic Xcode archive` ，同时 Validate Content 的按钮是置灰的，所以这里的配置最好 `Debug` 和 `Release` 分开来会比较好，可以参考 Apple 的[官方文档](https://developer.apple.com/documentation/technotes/tn3110-resolving-generic-xcode-archive-issue)


### 3. SQLCipher的迁移

项目中使用了 `SQLCipher` 来存储敏感数据，但是 `SQLCipher` 只有 `cocoapods` 依赖，目前还没有 `SPM` 包，需要自行构建处理。

SQLCipher的构建步骤比较简单，[参考官方文档](https://www.zetetic.net/sqlcipher/ios-tutorial/)即可，简而言之，就是首先 clone SQLCipher 项目，构建出 sqlite3.c 和 sqlite3.h，然后把这两个文件拷贝到项目目录下，再在Xcode中添加这两个文件，接着修改 `Build Settings` 中的 `other c flags` 中就可以。

不过我在这个迁移过程中也不太顺利，遇到了一些问题。我是把 `sqlite3.c` 和 `sqlite3.h` 放在了 `SQLCipher` 目录下，然后把这个目录放在了 Target 对应的目录下，在Xcode导入的过程中，我勾选的是 `Create folder references`, 就出现了编译过程中报`Undefined Symbol: _sqlite3_open` 的问题，而之所以出现这个问题是因为没有编译 `sqlite3.c` 文件，所以找不到相关函数的定义。而解决方案呢，就是在导入的时候，选择 `Create groups`，就会自动编译 `sqlite3.c` 文件了。

<img width="876" alt="图片" src="https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/90387f35-b584-4e6a-b5c4-c250d92abbbc">

### 4. 总结

迁移总体而言还算比较简单，但是 `SPM` 这种方式的缺点也是有的，比如说如果依赖的包后续删库跑路了，那在新设备上依赖应该就会无法安装了，所以要慎重引入依赖并做好容灾管理。


