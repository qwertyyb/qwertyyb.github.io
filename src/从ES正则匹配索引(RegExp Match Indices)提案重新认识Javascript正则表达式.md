---
title: 从ES正则匹配索引(RegExp Match Indices)提案重新认识Javascript正则表达式
created: 2023-05-06 19:54
tags:
  - 前端
  - 正则表达式
  - Javascript
categories:
  - [前端, 正则表达式]

created_from_issue: true
---

今天在整理最近两年(2022-2023)新完成ES提案(stage 4)的时候，从RegExp Match Indices提案发现了一些之前没有注意到的正则表达式的用法，记录一下。

<!-- more -->

## 修饰符并不是只有 `g` 和 `i`

修饰符除了 `g` 全局匹配和 `i` 忽略大小写外，还有 `m`、`u`、`y`、`s`、`d` 这五种不常用的。它们的作用分别是:

### 1. `i` (ignore case) 忽略大小写

没啥可说的

### 2. `g` (global) 全局匹配

找到所有的匹配，示例如下:

```javascript
reg = /abc/

reg.exec('abcdabcdabcd') // ['abc', index: 0, input: 'abcdabcdabcd', groups: undefined]
reg.exec('abcdabcdabcd') // ['abc', index: 0, input: 'abcdabcdabcd', groups: undefined]
reg.exec('abcdabcdabcd') // ['abc', index: 0, input: 'abcdabcdabcd', groups: undefined]

// g exec执行时带状态，连续匹配
reg = /abc/g

reg.exec('abcdabcdabcd') // ['abc', index: 0, input: 'abcdabcdabcd', groups: undefined]
reg.exec('abcdabcdabcd') // ['abc', index: 4, input: 'abcdabcdabcd', groups: undefined]
reg.exec('abcdabcdabcd') // ['abc', index: 8, input: 'abcdabcdabcd', groups: undefined]
reg.exec('abcdabcdabcd') // null
// match 匹配出全部的字符串
'abcdabcdabcd'.match(reg) // ['abc', 'abc', 'abc'] 
```

### 3. `m` (multiline) 多行匹配

当使用开始(`^`)或结束匹配(`$`)时，如果不加 `m`，那会把原始字符串整个拿来进行匹配，加上 `m` 修饰符后，会把原始输入按行来进行匹配。示例如下:

```javascript
/^abc$/.exec('abc\nabc')
// -> null

/^abc$/m.exec('abc\nabc')
// -> ['abc', index: 0, input: 'abc\nabc', groups: undefined]
```

### 4. `s` (dotAll) 点号匹配所有字符

默认情况下，`.` 匹配除了换行之外的任意字符，使用 `s` 修饰符可以匹配所有字符，包括换行符。示例如下:

```javascript
/^a.c$/.exec('a\nc')
// null

/^a.c$/s.exec('a\nc')
// ['a\nc', index: 0, input: 'a\nc', groups: undefined]
```

### 5. `y` (sticky) 粘性匹配

`y` 修饰符和 `g` 都是有状态的连续匹配，但是 `y` 与 `g` 不同的点在于，`y` 的连续匹配是
> 仅从正则表达式的 [lastIndex](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex) 属性表示的索引处为目标字符串匹配（并且不会尝试从后续索引匹配）。

示例如下:

```javascript
const reg = /abc/y

reg.exec('abcdabcdabcd')
// ['abc', index: 0, input: 'abcdabcdabcd', groups: undefined]
reg.lastIndex
// 3
// 下一次匹配将从输入字符串的第3个索引开始匹配

reg.exec('abcdabcdabcd')
// null
reg.lastIndex
// 0
// 这里是 y 和 g 不一致的地方
// 第二次匹配时 y 修饰符等价于 /^abc/.test('dabcdabcd'), 要求开头匹配
// g 修饰符等价于 /abc/.test('dabcdabcd')，后续匹配即可
```

### 6. `u` (unicode) unicode模式

这个就涉及到编码了，先看下例子，CSDN上有一篇文章说得比较明白[^1]，此处引用一下

>
>前两天室友正在看 js 关于正则表达式的博客，发现 js 正则表达式中有个 u，可以用于开启 unicode 模式，并且被博客举的两个例子搞懵了，例子如下：
> ```javascript
> /^\uD83D/.test('\uD83D\uDC2A') // true
> /^\uD83D/u.test('\uD83D\uDC2A') // false
> ```
>为什么会这样？我们看见这个例子的时候也是这样想的。其实 js 有个大前提，JavaScript 内部，字符以 UTF-16 的格式储存，每个字符固定为 2 个字节。对于那些需要 4 个字节储存的字符（Unicode 码点大于0xFFFF 的字符），JavaScript 会认为它们是两个字符。
>
>例子中的第一个就能够解释，用 \uD83D 匹配两个字符，其中包含 \uD83D，匹配当然成功，但为什么开启 unicode 模式之后就匹配失败？因为在 UTF-16 中还有自己的规则，UTF-16 会用两个字节表示基础字符，面对扩展字符使用四个字节表示，也就是说有些情况下四个字节的 UTF-16 才能表示一个字符，很不幸，上面的例子就是这个情况。因为在 UTF-16 中 0xd800 - 0xdbff 表示高位代理，0xdc00 - 0xdfff 表示低位代理，其实两个代理就是在告诉计算机，它们属于扩展字符，需要使用四个字节表示一个字符。
>
>于是，例子中的第二条在开启 Unicode 模式之后，\uD83D\uDC2A 被识别为一个字符，\uD83D 作为一个字符中的一部分匹配整个字符肯定是以失败告终，如果对 Js 的这个神奇现象想进行更加深入的了解，可以阅读 Unicode-aware regular expressions in ES2015 一文。
> ————————————————
> 版权声明：本文为CSDN博主「CloneableX」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
> 原文链接：https://blog.csdn.net/u011476390/article/details/101596962

启用unicode模式之后，除了 `\u{...}`进行精确匹配外，还可以[使用 `\p{...}` 按分类进行匹配](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)。

### 7. `d` indices 匹配索引

新提案，2022年进入stage 4，chrome已支持，在执行 `RegExp.prototype.exec` 和 `String.prototype.match` 时，返回匹配字符串的开始和结束索引，示例如下

```javascript
const re1 = /a+(?<Z>z)?/d;

const s1 = "xaaaz";
re1.exec(s1)
/*
输出: 
[
    0: "aaaz", // 第一个匹配的子字符串
    1: "z", // 第二个匹配的子字符串
    groups: { Z: 'z' }, // 命名捕获组对象，捕获组名字为key, 对应的匹配字符串为value
    index: 1, // 配置字符串的开始位置
    indices: Array(2) // 加了 d 修饰符后，会返回此数组字段
      - 0: (2)[1, 5] // 第一个配置的子字符串的开始和结束位置
      - 1: (2)[4, 5] // 第二个配置的子字符串的开始和结束位置
      - groups: // 命名捕获组的开始和结束位置，捕获组名字为key, 对应的开始和结束位置为value
        - Z: (2)[4, 5] // 命名为Z的捕获组对应的子字符串的开始和结束位置
    input: 'xaaaz' // 输入的原始字符
]
*/
```

### 8. 不同修饰符下 `RegExp.prototype.exec` 和 `String.prototype.match` 的区别

- 这两个方法在某些修饰符下是返回的结果是一致的，但是某些情况下又是不一致的，而且修饰符不同的组合也会有不同的效果。
- 总体来说 `RegExp.prototype.exec` 方法只返回一个匹配结果，而 `RegExp.prototype.match` 方法倾向于返回所有的匹配结果。
- 所以最好是在使用前实际运行验证一番。

## 一些注意点

1. 使用 `new RegExp` 实例化正则表达式时，元字符需要转义

比如说应该是 `new RegExp("\\w") 而不是 `new RegExp("\w")`

正则表达式的 `source` 属性和 `new RegExp` 的第一个参数一致，该属性只读

```javascript
/abc/gi.source === 'abc' // true
```

