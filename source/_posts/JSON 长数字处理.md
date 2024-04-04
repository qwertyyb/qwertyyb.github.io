---
title: JSON 长数字处理
date: 2024-04-04
tags:
  - 前端
  - Javascript
categories:
  - [前端, Javascript]

created_from_issue: true
---

JS的最大安全数字是 `Number.MAX_SAFE_INTEGER` 是 16 位数字，如果JSON中数字长度为17位及之上就会溢出，这里介绍两种方式来规避数字溢出的问题

<!-- more -->


## 背景

JSON.parse 长数字导致精度丢失。当JSON中包含的对象含有超长的数字（17位或18位）时，直接使用 JSON.parse 会导致数字精度丢失，如下图：

![JSON.parse 后精度丢失](https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/51ad4469-5813-414b-8008-09c6a4900100)

这里是因为数字已经超出了 `Number.MAX_SAFE_INTEGER` 的值，所以导致了序列化后的值和序列化前的值不一致。


## 现有方案

市场上现有的方案推荐的是第三方实现的npm包 `json-bigint` , `lossless-json` 等，它们的原理的自行实现了 `JSON.stringify` 和 `JSON.parse` 这两个方法，然后自定义了超长数字的序列化和反序列化方案。它们的方案是类似的，都是把超长的数字用一个自行实现的类实现，所以反序列化后它们已经不是 `Javascript` 的 `Number` 对象了。

另外，这里因为是自行实现了 `JSON.stringify` 和 `JSON.parse` ，所以性能上损耗会比较大，对于追求高性能的场景，往往不是很好的方案。


## 面向未来的方案

除了上面的方式外，还有另外一个面向未来的方案 `JSON.parse source text access` ，这个是ES的提案，目前已进入Stage3，它增强了 `JSON.parse` 的能力。

先来看一看原来的 `JSON.parse` 有什么问题吧，原来的 `JSON.parse` 第二个参数 `receiver` ，可以自定义反序列化的逻辑，听上去似乎已经很好了，然而并不是。`receiver` 接受两个参数，分别是字段的名字 `key` 和 `value` ，但是 `value` 是已经解析后的值，而不是输入的原字符串。也就是说，如果用这个方法来处理超长数字，那在 `receiver` 中获取到的数字则是已经丢失了精度了，这就是问题所在了。而 `JSON.parse source text access` 就是为了解决这个问题的。

![JSON.parse 的原函数签名](https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/5ced6a9c-51f7-477a-907c-f772c8f7393e)

`JSON.parse source text access` 提案的具体内容是在 `receiver` 中追加了第三个参数，第三个参数是一个对象，对象中有一个字段 `source` 指向了 JSON 字符串的原始值。

![JSON.parse 第三个参数](https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/13e88bf0-eda9-4414-a7d3-4b79cc93da15)

遗憾的是，这个提案虽然已经进入了 Stage3，但是主流的浏览器和 Node.js 都还没有实现。去到官方的提案仓库发现，有开发者已经实现了一个 `polyfill` 可以使用: [text](https://github.com/ton-js/json-parser) 。需要注意的是，这个 polyfill 仓库中是有说明的，它的解析速度比原生的更慢，官方的说法是解析 1M 的内容耗时约为 40ms，比原生库慢了25倍，所以目前建议仅在必要情况下使用这个库。

除了上面的方案，Node.js 20 版本已经实验性的支持了这个提案，需要在命令行中添加 `--harmony-json-parse-with-source` 即可使用。在 `chrome` 123 版本中，此API目前也是可用的。检测可用性的方法为 `typeof JSON.rawJSON === 'function'` ，`JSON.rawJSON` 是 `JSON.parse source text access` 提案的另一部分内容。


## 提案中的 `JSON.stringify` 

`JSON.parse source text access` 提案不仅仅对 `JSON.parse` 做了扩展，而且也增强了 `JSON.stringify` 的能力。

`JSON.stringify` 虽然也有第二个参数 `replacer` 可以自定义对象序列化后的内容，但是和 `JSON.parse` 一样，也是缺胳膊少腿的，`replacer` 的参数和 `JSON.parse` 的 `receiver` 一样，同样是 `key` 和 `value` ，函数返回值会<span style="color:#ff4500">经过JS引擎再序列化后</span>写入最终的序列化结果中，也就是如果返回的是数字类型的1234，则序列化后的内容是 `1234` ，如果返回的是字符串类型的是1234，则序列化后的内容是 `"1234"` 。按照这个的调用如果我们想要把一个18位的数字写入序列化结果中是办不到的，因为如果按数字类型返回，则会因为数字太长，精度会丢失，如果按字符串类型返回，则写入序列化结果中的是字符串形式，所以即使写入一个纯18位数字到序列化结果中，使用 `JSON.stringify` 是难以达到这个结果的。

而提案内容除了扩展 `JSON.parse` 外，也没忘记对对称方法 `JSON.stringify` 的扩展。对 `JSON.stringify` 的扩展就是添加了 `JSON.rawJSON` 这个方法，这个方法接受字符串作为参数，这个方法的返回值可以作为 `JSON.stringify` 第二个参数的返回值，可以直接把原字符串值写入序列化结果中，而无须再添加两边的双绰号。


## 示例

下面是一个使用了 ES 提案的示例，主要作用是把18位的长数字反序列化为字符串，序列化为纯数字。

```JavaScript
/**
 * 主要针对18位数字进行处理
 * 由于18位数字已超过前端的最大安全数字（Number.MAX_SAFE_NUMBER），所以在前端JS环境，需要以字符串的形式处理
 * 而由于历史原因（魔方物品ID为数字），后端需要以数字的形式处理
 * 所以此处针对这种情况进行处理
 * stringify时，格式化为数字存入数据，parse时格式化为string，解决精度丢失的问题
 */
const check = () => {
  if (!JSON.rawJSON) {
    throw new Error('不支持的操作，请升级node.js版本');
  }
};

const isEighteenNum = str => typeof str === 'string' && /^[1-9]\d{17}$/.test(str);

const eighteenNumToString = (key, value, { source }) => {
  if (isEighteenNum(source)) {
    return source;
  }
  return value;
};

const stringToEighteenNum = (key, value) => {
  if (isEighteenNum(value)) {
    return JSON.rawJSON(value);
  }
  return value;
};

const parse = (json) => {
  check();
  return JSON.parse(json, eighteenNumToString);
};

const stringify = (data) => {
  check();
  return JSON.stringify(data, stringToEighteenNum);
};

const safeJSON = { parse, stringify };

module.exports = safeJSON;

```


