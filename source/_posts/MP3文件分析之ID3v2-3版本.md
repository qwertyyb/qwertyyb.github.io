---
title: MP3文件分析之ID3v2.3版本
date: 2017-03-18 16:36:01
tags: ID3, Audio
categories:
---

# MP3文件分析之ID3v2.3版本

关于读取MP3文件的ID3标签，网上众说纷芸，但很多都是错的，在这里总结一下。所有的分析都基于ID3[官方网站](http://www.07net01.com/tags-%E7%BD%91%E7%AB%99-0.html)www.id3.org

<!-- more -->
## 1. 标签头

  标签头有十个字节，在文件最开始的10个字节，它的数据结构如下：

```
char Header[3];//这个字符串一定为"ID3"

char version;//版本号，而针对在下要讲的版本，理应为3.即为ID3v2.3

char revision;//副版本号，好像一直都是0，没看到过它有变过

char flags;//一些特殊的消息标记，只会使用此字节的高3位，其它的五位并没有什么卵用

char size[4];//代表整个标签帧的大小，但是不包括这开始的10个字节，所以这里得到的size需要加上10才代表整个标签帧的大小
```

ID3v2 flags中的%abc00000，其中高三位表示如下：

```
a - Unsynchronisation
表示是否同步(自己乱翻译的)，这个搞不清是什么鬼，个人英语不是很行，大概是为了数据帧同步帧数据,校正数据用的
b - Extended header
表示是否有扩展头部，这个扩展头部是用来补充标签信息的，原文如下：
The extended header contains information that is not vital to the correct parsing of the tag information, hence the extended header is optional. 

c - Experimental indicator
表示是否为试验测试，这个东西是什么鬼也不知道，没见过MP3音乐文件这个位进行了设置
```

ID3v2 size中的4?%0xxxxxxx表示的是4个字节，后面的%0xxxxxxx就是一个字节8位了。

然后计算标签帧的大小，**ID3**规定这四个字节中每个字节的最高位恒为0不使用，格式如下：

```
var size = size4 & 0x7f | ((size3 & 0x7f) << 7) | ((size2 & 0x7f) << 14) | ((size1 & 0x7f) << 21);
```

**注意：这里的帧大小，并不包含帧头的10个字节，只表示帧内容的大小**

这里再说一个特殊消息标记的**Extended header**处理，当**Extended header**这个标记位设置为1时，在这最开始的10个字节后面会增加有**Extended header**的内容，这部分内容非常有意思，因为它所占用的大小不算在之前10个字节的size中，就相当这里会凭空多出一些字节。

然后这个**Extended header**信息内容格式如下：

```
Extended header size   $xx xx xx xx
Extended Flags         $xx xx
Size of padding        $xx xx xx xx
...
```

**Extended header size**有四个字节，表示接下来的数据占用多少个字节。

**Extended Flags** 这两个字节不知道干什么

接下来就都是扩展头部的数据了（我猜**Extended Flags**这两个字节好像没有，扩展头部本来就没有多大用，一般直接就滤掉了）

这里是JS代码实现标签头的识别：

```
getByteAt(iOffset);//得到iOffset位置的一个字节数据

isBitSetAt(iOffset, iBit);//判断iOffset位置的字节的iBit位是1还是0

readSynchsafeInteger32At(data, iOffset);//这是处理标签头的size

getLongAt(iOffset, bBigEndian);//得到iOffset位置的Long数据，bBigEndian表示是低端还是高端


/****************/

var offset = 0,
    major = data.getByteAt(offset + 3),
    revision = data.getByteAt(offset + 4),
    unsynch = data.isBitSetAt(offset + 5, 7),
    xheader = data.isBitSetAt(offset + 5, 6),
    xtest = data.isBitSetAt(offset + 5, 5),
    size = this.readSynchsafeInteger32At(data, offset + 6);

offset += 10;
if (xheader) {
    var xheadersize = data.getLongAt(offset, true);
    offset += xheadersize + 4;
}

var id3 = {
    "version": '2.' + major + '.' + revision,
    "major": major,
    "flags": {
        "unsynchronisation": unsynch,
        "extended_header": xheader,
        "experimental_indicator": xtest
    },
    "size": size
};
```

## 2. 标签帧内容

#### 帧头的定义

```
char ID[4];//用四个字符标识一个帧，表明这个帧的内容是什么

char size[4];//帧内容的大小，不包括帧头

char flags[2];//特殊的消息标记
```

- **帧标识**：The frame ID made out of the characters capital A-Z and 
  0-9.FrameID会是一串由A-Z和0-9的字符串组成，占用4个字节
- **帧大小**：The frame ID is followed by a size descriptor, making a total header size of ten bytes in every frame. The size is calculated as frame size excluding frame header
- 最后这个flags跟前面说的都一样为特殊标记

#### 常见有用的帧标识

1. **TIT2**：歌曲标题名字
2. **TPE1**：作者名字
3. **TALB**：作品专辑
4. **TYER**：作品产生年代
5. **COMM**：备注信息
6. **APIC**：专辑图片

#### 帧标记说明

只定义了6位，另外的10位为0，一般这些标记也不用，通常为0，格式如下：

```
flags %abc00000 ijk00000 

a -- 标签保护标志，设置时认为此帧作废

b -- 文件保护标志，设置时认为此帧作废

c -- 只读标志，设置时认为此帧不能修改(但我没有找到一个软件理会这个标志) 

i -- 压缩标志，设置时一个字节存放两个BCD 码表示数字 

j -- 加密标志(没有见过哪个MP3 文件的标签用了加密) 

k -- 组标志，设置时说明此帧和其他的某帧是一组
```

#### 帧标识

**帧标识这一块有太多，各种各样的，到官方网站去看，这里会主要区分三种主要的标识信息（其他的都拜拜吧，通过看官方网站的信息你就知道为什么拜拜了）。**

1. T*，即以T开头的帧标识，为文本标识。

   文本标识就会涉及到文字的编码，此标签内容分为三部分。

   第一部分为1个字节，这个字节一定是[0x00,0x01,0x02,0x03]中的一种，0x00代表这个标签帧后续的数据为**iso-8859-1**编码，0x01则是**utf-16**编码，0x02则是**utf-16be**编码，0x03则是**utf-8**编码

   第二部分根据编码确定是否存在 
   如果为0x00编码的话就不会存在，字节就是直接读取

   如果为0x01和0x02那么这里会占用2个字节，会出现两种可能的数据，一种为**FF FE**表示小端，即数据[存储](http://www.07net01.com/storage_networking/)是高数据在高位，一种为**FE FF**表示大端与小端相反

   如果为0x03编码则是会占用三个字节 **EF BB BF**

   第三部分就是数据

2. **APIC**，专辑图片，好像整个**MP3**的数据就只有这个标识有图片

   这里直接以官方说明来讲解比较好：

   ```
   <Header for 'Attached picture', ID: "APIC">
   Text encoding   $xx
   MIME type       <text string> $00
   Picture type    $xx
   Description     <text string according to encoding> $00 (00)
   Picture data    <binary data>
   ```

   第一个为数据编码，和以**T**开头的一样，分为四种0x00,0x01,0x02,0x03

   第二个为**MIME type**数据了，表示的是什么类型图片，有image/jpeg,image/png…等， 
   这里的字节数不确定，是用0x00作为字符串的结束标志，来停止读取的，也就是说MIME type数据需要一直读取，知道读取到了0x00也就是我们常见的字符串结束标志\0.

   第三个为**Picture type**，表示的是图片代表什么，是作者还是一些什么内容。

   第四个为**Description**，就是简单的图片描述了，这里和**MIME type**数据一样，是以\0为结束的，这里多说一句的是，这个属性好像也不经常用，它的值经常为”“

   第五部分就是图片数据了，记住这不是**base64**编码的数据。

   **Picture type**的值扩充说明(就是这些值表示这张图片的大概内容)

   ```
   $00     Other
   $01     32x32 pixels 'file icon' (PNG only)
   $02     Other file icon
   $03     Cover (front)
   $04     Cover (back)
   $05     Leaflet page
   $06     Media (e.g. lable side of CD)
   $07     Lead artist/lead performer/soloist
   $08     Artist/performer
   $09     Conductor
   $0A     Band/Orchestra
   $0B     Composer
   $0C     Lyricist/text writer
   $0D     Recording Location
   $0E     During recording
   $0F     During performance
   $10     Movie/video screen capture
   $11     A bright coloured fish
   $12     Illustration
   $13     Band/artist logotype
   $14     Publisher/Studio logotype
   ```

   ​

3. **COMM**，备注消息，这个玩意一直在飞，全程都是懵逼的，这个属性感觉并没有什么卵用

   这里还是官方说明来讲解比较好

   ```
   <Header for 'Comment', ID: "COMM">
   Text encoding           $xx
   Language                $xx xx xx
   Short content descrip.  <text string according to encoding> $00 (00)
   The actual text         <full text string according to encoding>
   ```

   第一个不想说了，跟前面的一模一样;

   第二个表示接下来是什么语言，就是说是中文还是英文还是其它语言，一般是英文就是eng

   然后就是短描叙了，这里的字节数也是不确定的，也就是说这里是以\0为结尾的数据，需要不断读取直到\0结束

   接下来就是最终的数据了

## 3. 编码数据扩充

1. **utf-16**，即为**UCS-2**，这种编码会出现两种形式，一个为2字节也就是一个字，一个为四字节也就是两个字， 
当第一个字节小于0xD8或者大于0xDF，则是第一种情况，否则就是第二种，其中0xDB-0xDF为代理区
当然在这个音乐文件中有小端和大端区分，所以我们经常会看到如下编码选项 **UCS-2 Big Endian**(大端),**UCS-2 Little Endian**(小端)

2. **utf-8**,这个编码可以说是最操蛋的，网上的解释也参差不齐，俺也懒得去看官网了，这里讲解的只是最常用的，[大众](http://www.qiche887.com/tags-%E5%A4%A7%E4%BC%97-0.html)的。 
这个编码分为三种，一个为1字节(这里很明显是用一个字节来表示英文字母)，然后就是2字节，接着就是3字节 
区分：

  - 第一字节小于0x80则为1个字节
  - 第一字节大于等于0xC2小于0xE0则是2字节
  - 第一字节大于等于0xE0小于0xF0则是3字节

3. 其他的编码就一股脑的读取一个字节就可以了

关于更多文字编码的知识可以看这里：[彻底搞懂字符编码](/2017/03/12/彻底搞懂字符编码/index.html);