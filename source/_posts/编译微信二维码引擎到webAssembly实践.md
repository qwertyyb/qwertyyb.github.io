---
title: 编译微信二维码引擎到webAssembly实践
date: 2021-06-19 18:55:20
tags: webAssembly, opencv
categories: webAssembly, opencv
---

微信开源了二维码引擎，如何在web环境下使用此引擎，本篇文章就由此而始。

<!-- more -->

## 背景

我这边有一个基于Electron跨平台框架开发的工具类项目，需要做一个在PC端识别并解析二维码的插件。

刚开始用的是zxing的webAssembly版本，在使用过程中，发现在一些边缘情况下(二维码很小或很大、图片倾斜等情况)，识别能力很差，耗时也比较久，而且还不支持一图多码。而从日常使用来看来看，微信对二维码的识别和解码能力可谓是登峰造极，识别率高，速度快，而且对一图多码的情况也有很好的支持，如果能把微信的这个能力迁移到PC上那是最完美的了。

而微信的大数据也确实可怕，瞬间洞察我心，把微信的二维码识别解码能力开源了。微信团队开源了二维码引擎到opencv contrib项目中，此引擎基于zxing并做了大量的优化，加入了深度学习，卷积网络等各种优化，提高了二维码的识别和解码能力。而这篇文章就是记录一下在编译此引擎到webAssembly过程中遇到的一些问题和解决方案

## opencv项目简介

opencv在业内大名鼎鼎，而微信就是把二维码引擎作为一个模块开源到了opencv contrib仓库，所以为了编译此模块，需要对opencv项目有一个大概的了解。

opencv总体来说分为分为opencv主库和opencv contrib可选模块库。

其中opencv主库下面主要关注两个目录——modules和platforms。

modules目录下是主库的模块代码，比如core核心功能模块、dnn模型模块、imgproc图片处理模块、objdetect图像识别模块等等，也包含生成对应语言下的功能模块，比如说java、object-c、python、js等等，而这次编译主要处理逻辑也就集中在js目录下。

platforms目录下是生成各个平台下可使用的库的入口，按平台命名，比如说android, ios, linux等等，这次我们的目光主要放在js目录下，这个目录是生成opencv的webAssembly版本的入口文件和配置所在。

再来看下opencv的contrib库，这个库是在单独另外一个git仓库，在构建opencv时是可选的。这个仓库的结构比较简单，模块都在modules下，打开modules目录，就可以看到微信的二维码模块wechat_qrcode了。

我这次就是要把opencv contrib仓库下的wechat_qrcode编译为webAssembly，使之可以运行在web浏览器中。

## 编译过程

opencv提供了默认配置的webAssembly已构建版本，可以在opencv库的release页面下载。当然默认的构建版本是不包括微信二维码模块。所以我需要按照自己的需要自行构建webAssembly版本。

### 编译方式选择

opencv官方也提供了[webAssembly的构建指南](https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html)。我这边使用的是Docker的方式来构建，也推荐使用Docker进行构建，原因如下: 
1. 无须再安装编译所需的运行环境，如Emscripten。
2. 无须担心因为编译环境不同步导致的各种异常问题，防止被各种各样的环境问题坏了兴致。

我这边的编译环境是
1. Linux centos发行版
2. Docker version 19.03.1, build 74b1e89
3. opencv 4.5.2
4. opencv_contrib commit 10d1020952f7924e94f5bab1659c328c599f1c61

### 尝试编译opencv项目

把opencv, opencv_contrib仓库拉下来到本地目录ocv, 如下:
```bash
- ocv
   + opencv/
   + opencv_contrib/
```

首先当然是尝试直接按照官方文档指引，先啥也不改，就用默认配置直接构建，验证能否成功。避免直接上来就按一番魔改，改完之后编译不了，误以为是改动问题，调了半天之后才发现不是这种情况。

根据官方文档，Emscripten 2.0.10版本是opencv官方验证通过的版本。所以这里也不使用最新版本，追求稳定就使用2.0.10版本来进行构建。构建命令如下:

```bash
cd ocv

sudo docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk:2.0.10 emcmake python3 ./opencv/platforms/js/build_js.py build_wasm --build_wasm --build_test
```

注意加了 `--build_wasm` 和 `--build_test` 参数用以构建webAssembly版本，并自动构建测试用例，方便在构建完成后直接进行测试

在控制台一番疯狂的输出后，构建成功了，输出如下:

```bash
=====
===== Build finished
=====
OpenCV.js location: /src/build_wasm/bin/opencv.js
OpenCV.js tests location: /src/build_wasm/bin/tests.html
```

此时目录结构如下:

```bash
- ocv
   + opencv/
   + opencv_contrib/
   - build_wasm/
      ...
      - bin/
         - tests.html
         - opencv.js
      ...
```

build_wasm目录是构建生成的目录，tests.html是使用 `--build_test` 参数后会自动生成的文件，不可直接打开，需要通过http服务器用浏览器打开。我这边使用npm的http-server模块，安装命令如下
```bash
npm install -g http-server
```
然后在ocv目录下执行 `hs -p 5000` 命令，会以ocv目录为服务器根目录启动一个端口为5000的http-server服务，可以在浏览器中打开 `http://127.0.0.1:5000/build_wasm/bin/tests.html` 测试用例会自动运行，输出结果。

由于这次编译并没有任何改动，所以预期测试用例全部通过，而结果也正如预期。

### 尝试编译opencv_contrib模块

wechat_qrcode模块是在opencv_contrib仓库中，opencv官方也提供了编译contrib库的命令，需要在上一步的命令中添加一个参数 `--cmake_option="-DOPENCV_EXTRA_MODULES_PATH=/src/opencv_contrib/modules"`，完整命令如下:
```bash
cd ocv

sudo docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk:2.0.10 emcmake python3 ./opencv/platforms/js/build_js.py build_wasm --build_wasm --build_test --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=/src/opencv_contrib/modules"
```
上面的命令仅会引入 `opencv_contrib` 库却不会编译到webAssembly文件中，因为暴露出没有调用入口，在构建的时候直接就优化没了，所以需要添加额外的配置，使wechat_qrcode模块的接口在编译后的webAssembly中暴露出来。这个配置文件在 `opencv/platforms/js/opencv_js.config.py` 文件中，这个文件定义了各个模块在编译后暴露出的API，这些API可以在JS中调用。

为了添加wechat_qrcode模块，添加如下配置
```python

# ...

wechat_qrcode = {
  'wechat_qrcode_WeChatQRCode': ['WeChatQRCode', 'detectAndDecode']
}

white_list = makeWhiteList([core, imgproc, objdetect, video, dnn, features2d, photo, aruco, calib3d, wechat_qrcode])
```
然后再执行上面的命令进行编译，如果顺利的话，编译通过就可以进行测试验证了。but everything has a but，但是编译过程中报错了。报错情况如下:

![编译wechat_qrcode模块报错](https://tva1.sinaimg.cn/large/008i3skNgy1gros8m5xf3j31a404mn00.jpg)

## 失败踩坑

愿望是美好的，现实是残酷的，编译wechat_qrcode模块失败了，为了能在web中用上这个模块，需要一一定位并解决这些问题。

### 1. 编译失败报错 no memeber named 'vectorstd' in namespace 'std'
这里的报错信息非常清晰，可以看到是在生成的 `build_wasm/modules/js_bindings_generator/gen/bindings.cpp` 文件中的wechat_qrcode模块的detectAndDecode函数的返回类型不正常

对比 `opencv_contrib/modules/wechat_qrcode/include/opencv2/wechat_qrcode.hpp` 中此函数的声明，发现原函数声明的返回类型为 `std::vector<std::string>`, 但是生成的函数的返回类型为 `std::vectorstd::string`，一对比就发现是在生成的过程中 `bindings.cpp` 时，把原返回类型中的两个 `<>` 符合吞掉了。

知道了原因，需要定位生成这个函数声明的逻辑代码，显然是生成过程中出现了错误。

追根溯源发现生成 `bindings.cpp` 文件的逻辑在 `opencv/modules/js/generator/embindgen.py` 文件中，所以我们可以直接简单粗暴的替换掉这个错误的返回类型，如下: 

![替换掉错误的返回值](https://tva1.sinaimg.cn/large/008i3skNgy1grousq5puzj322q0legtr.jpg)

替换的位置是在 `JSWrapperGenerator` 类下的 `gen_function_binding_with_wrapper` 方法中。

替换完成后，再次执行编译，发现这个错误已经没有了。但是出现了另一个错误

### 2. 编译失败报错 unknown type name 'string'; did you mean 'String'

错误截图如下所示:

![错误截图](https://tva1.sinaimg.cn/large/008i3skNgy1grovmbosxpj31900d0gvw.jpg)

同样的文件，不同的问题，是因为生成的文件里面不包含命名空间 `std::` 前缀，所以我们也可以在对应的生成位置，简单粗暴的把这个错误的字符串替换掉，如下图:

![替换掉错误的参数值](https://tva1.sinaimg.cn/large/008i3skNgy1grovpzmd45j321k0m2dno.jpg)

如此我们再进行编译，终于没再有错误出现，编译成功了。

编译成功不意味着就能在web浏览器中正常运行了，我们需要在浏览器中能正常识别并解码二维码才算是大功告成。为此我们需要准备一段测试用的JS代码

```javascript

var img = document.createElement('img')
// 准备一张二维码图片放在ocv目录下，命名为qrcode.png
img.src = '/qrcode.png'
img.onload = () => {
  // 读取图片数据
  var imgdata = cv.imread(img)

  var detector = new cv.wechat_qrcode_WeChatQRCode(
    "wechat_qrcode/detect.prototxt",
    "wechat_qrcode/detect.caffemodel",
    "wechat_qrcode/sr.prototxt",
    "wechat_qrcode/sr.caffemodel"
  )

  var results = detector.detectAndDecode(imgdata)

  // 输出识别到的第一个二维码结果
  console.log(results.get(0))
}
```

在准备这段代码的过程中，其实就会发现问题，实例化二维码引擎时，需要传入4个模型文件，但是这4个模型文件在C++中是从文件系统中读取的，但是编译为webAssembly后，怎么读这4个文件？

### 3. 模型文件加载问题

google发现webAssembly模拟了文件系统，可以把文件打包然后像读取文件系统一样，对文件进行读取操作。

具体可以参考: https://www.cntofu.com/book/150/zh/ch3-runtime/ch3-03-fs.md

参考这篇文章，我这里使用了外挂文件包的方式把wechat_qrcode需要的4个模型文件打包成 `wechat_qrcode_files.js`，打包步骤如下: 

```bash

cd ocv

# 把emscripten仓库拉到本地
git clone https://github.com/emscripten-core/emscripten.git

# 是的，这4个模型文件都在build_wasm/downloads/wechat_qrcode目录下了，无须再去下载了
cp -r build_wasm/downloads/wechat_qrcode ./

# 打包文件
sudo docker run --rm -v /data/home/marchyang/mine/ocv:/src -u $(id -u):$(id -g) emscripten/emsdk python3 emscripten/tools/file_packager.py build_wasm/bin/wechat_qrcode_files.data --preload wechat_qrcode/ --js-output=build_wasm/bin/wechat_qrcode_files.js
```

打包完成后在 `build_wasm/bin/` 目录下会生成两个新的文件 `wechat_qrcode_files.data` 和 `wechat_qrcode_files.js`，这两个文件分别对应文件系统中的文件和模拟文件系统的js代码，接下来在 `tests.html` 文件中使用 `script` 引入 `wechat_qrcode_files.js` 即可，如图所示

![修改tests.html](https://tva1.sinaimg.cn/large/008i3skNgy1groyb8saxej312v0u0jxx.jpg)

需要注意，一定要在 Module 声明之后再引入，就像图上那样。否则会出问题，因为 `wechat_qrcode_files.js` 文件中会在 `Module.preRun` 中插入一段代码来创建文件系统，如果在图中的 Module 声明之前引入，后面的Module中的preRun就会把前面的preRun覆盖，导致无法创建文件系统，从而就会导致读取文件时出现错误（血泪之谈啊）。

然后刷新页面，打开JS运行控制台，再运行上面的测试代码，看效果如下图

![运行效果](https://tva1.sinaimg.cn/large/008i3skNgy1grwoffk01sj30sm11ejyw.jpg)

排查发现这次的报错是在初始化类时报的错

### 4. 运行报错: 初始化类时 `wechat_qrcode_WeChatQRCode` 类时，报错处理

在控制台看到这个错误，再看错误的堆栈信息，一阵头大，这个报错中什么都没有，自然没有办法获取到有用的信息，也无从猜测到底是源代码的哪一部分报错了。

到这里为止，几乎要放弃了，觉得没有办法了。可是心中仍有一份希望，料想chrome如此强大，应该有调试webAssembly的办法吧，于是一番google, 果然不出我所料，chrome确实提供了调试方式，具体可以查看 [这篇文章](https://developer.chrome.com/blog/wasm-debugging-2020/)

具体做法:
1. 编译时加上 `-g` 参数
2. chrome 开发者工具打开 webAssembly 调试
3. 在Docker上编译时，需要映射路径
4. 打断点，调试

根据文章，先加上编译参数，编译脚本在 `opencv/modules/js/CMakeLists.txt` 中，修改如下: 

![修改编译脚本](https://tva1.sinaimg.cn/large/008i3skNgy1grwpqe9vmej321k0f4tez.jpg)

然后重新编译，编译完成后再次执行测试脚本，报错信息如下: 

![报错信息](https://tva1.sinaimg.cn/large/008i3skNgy1grwpsnrtmzj31800fm41s.jpg)

可以看到错误堆栈中已经有了源代码信息。可是由于我这边是在远程开发机上使用Docker编译，然后把远程开发机端口映射到本地测试的，所以源代码无法显示出来，实为不美。

根据错误堆栈，可以发现是因为在 `wechat_qrcode_WeChatQRCode`的初始化函数中，调用了 `cv::utils::fs::exists` ，而后面的函数报错了导致。

明明文件系统已经加载映射了，为什么 `cv::utils::fs::exists` 会报错失败呢？真是百思不得其解，在这里卡了好久。

忽然灵光一现，想到有没有可能是 `cv::utils::fs::exists` 这个方法在编译为webAssembly时不兼容导致的呢？随即一想，感觉又不太可能，因为从这个方法的命名就可知晓，这个方法是 opencv 工具类库中的方法，应该会比较稳定，不应该出现这种问题才对。

然而，虽然觉得不太可能，但是由于实在找不到头绪，只能先按这个思路排查。

分析 `wechat_qrcode_WeChatQRCode` 的构造函数可知，在构造函数中，会先去调用 `cv::utils::fs::exits` 方法判断传入的文件路径对应的文件是否存在，然后会调用 `cv::dnn::readNetFromCaffe` 传入文件路径初始化 detector 模型。

所以如果我们跳过检测文件，直接去调用 `cv::dnn::readNetFromCaffe` , 如果成功，不就可以证明 `cv::utils::fs::exists` 确实有问题了吗？而刚好，在编译配置中，`cv::dnn::readNetFromCaffe` 方法也导出了，所以可以在console中直接调用此方法来验证即可，如下图: 

![readNetFromCaffe](https://tva1.sinaimg.cn/large/008i3skNgy1grwqgj648rj310404gaaz.jpg)

卧槽，我看到什么，直接调用竟然成功了。虽然不愿意相信，但是事实摆在眼前，`cv::utils::fs::exists` 确实是有问题。

知道了问题所在，就比较容易解决了。可以把 `opencv_contrib/modules/wechat_qrcode/src/wechat_qrcode.cpp` 文件中对 `cv::utils::fs::exists｀ 的调用注释掉即可，如下图：

![删除cv::utils::fs::exists的调用](https://tva1.sinaimg.cn/large/008i3skNgy1grwqm0in8yj31n70u0ws5.jpg)

然后重新编译，运行测试代码验证。运行效果如下图

![运行效果](https://tva1.sinaimg.cn/large/008i3skNgy1groyy7b8iij31ea0sc10r.jpg)

可以发现，`wechat_qrcode_WeChatQRCode` 已经初始化成功了，图中的报错是在调用实例的 `detectAndDecode` 方法时报的异常。

P.S.
    在分析构造函数时发现，如果传入4个空的字符串，就不会再判断文件存在也不会读取模型文件了，所以 `var wr = new cv.wechat_qrcode_WeChartQRCode('', '', '', '')` 也是可以成功实例化并调用 `wr.detectAndDecode` 的。当然检测并解析二维码的时候也就不能用训练出的模型了，识别解码效果可能会打折扣。

### 4. 运行报错： detectAndDecode报错，UnboundTypeError

分析错误信息发现，此函数原返回类型为 `std::vector<std::string>` 而报错的Unbound类型和这个类型颇为相似，所以猜测此异常可能是 `std::vector<std::string>` 类型未在编译为webAssembly时导出导致的。

原以为这个问题可能不太好解决，但是研究发现在 `core_bindings.cpp` 中有一个 `register_vector` 的函数,如下图: 

![register_vector](https://tva1.sinaimg.cn/large/008i3skNgy1grozb8qc20j317c0u0gt1.jpg)

看上去像是一个注册 `vector` 类型为对应JS类的方法，所以可以试试注册一个 `vector<std::string>` 的类型看是否OK。最终改动此文件如下: 

![注册StringVector类型](https://tva1.sinaimg.cn/large/008i3skNgy1grozgh2y1fj31zo0je48c.jpg)

然后再重新执行编译命令进行编译，无报错。刷新页面，重新在控制台执行测试代码，结果如下: 

![执行结果](https://tva1.sinaimg.cn/large/008i3skNgy1groznnndx8j30sy0ligq0.jpg)

可以发现已经输出了二维码的内容，也没有报错，跟我们的期望结果一致。至此，微信二维码识别模块终于在web页面上跑起来了。

## 减少文件大小

至此，已经成功编译并在Web环境中运行了微信的二维码引擎，但是从network可以发现，编译生成的opencv.js文件很大，有11.5M, 实在是过大了。在生产环境中使用时，需要减小包的大小

分为两步: 

1. 打包时去掉 `-g` 参数，这个参数是在调试webAssembly时加上的，使chrome的开发者工具可以显示并调试webAssembly，加上此参数，会大大增加opencv.js文件的大小，如果在生产环境中使用，去掉此参数，可大大减小包文件的大小，实测如果把 `-g` 参数去掉后，文件大小由11.5M减小到了8.9M, 减小了2.6M, 22%的大小

2. 修改 `opencv/platforms/js/opencv_config.js.py` 文件，whitelist 只保留 wechat_qrcode, 如下图:

![opencv_config.js.py](https://tva1.sinaimg.cn/large/008i3skNgy1grp1tj65wej31w00iun44.jpg)

这步的修改，可以把8.9M的文件，再次精简至4.6M, 又减小了4.3M, 在上一步的基础了，减小了近50％的文件大小。可以说很惊人了

## Demo页面

编译成功之后，把编译产物拿出来做了一个demo页面，地址是:  https://qwertyyb.github.io/wechat_qrcode_webassembly/demo.html 

此页面也输出了图片中二维码的位置信息，具体的使用方法可以参考源码

## 下一步

到目前为止，成功的把微信二维码引擎编译成了webAssembly，可以在web中运行并成功的解码二维码内容。

之所以构建编译此版本，是因为我需要在一个基于electron的项目中使用，所以接下来，会在此工具中引入，看是否有坑。

另外，在编译过程中，遇到的这些问题也可以再深入研究一下，看下能否向opencv提个mr。
