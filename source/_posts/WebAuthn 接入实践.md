---
title: WebAuthn 接入实践
date: 2024-02-29
tags:
  - 前端
  - Javascript
  - WebAuthn
categories:
  - [前端, Javascript]

created_from_issue: true
---

项目接入 WebAuthn 实践

<!-- more -->

## 基本原理

WebAuthn 全称为 `Web Authentication API`，它可以彻底干掉非常容易泄漏的密码。WebAuthn 的基础是非对称加密，有公钥和私钥之分，其中公钥由客户端传给服务器保存在数据库中，私钥则存储在用户端的认证器中。它的注册的基本流程如下：

1. 浏览器调用 `navigator.credentials.create` 获取公钥
2. 认证器响应第一步的API调用，生成一对密钥（公钥和私钥），其中私钥就保存在认证器中，公钥返回给浏览器
3. 获取到公钥后，把公钥传给服务器，服务器保存以供后续验证

上述过程省略了很多细节，比如传给 `navigator.credentials.create` 的参数需要在服务器上生成，参数中包含了网站的域名和用户ID等信息，所以密钥对是平台用户维度的，这些信息也会存储在认证器中。另外把公钥传给服务器这一过程，传递的不仅仅是公钥，还有签名信息，服务器需要进行安全校验。

注册后，用户登录时的基本流程如下:

1. 浏览器调用 `navigator.credentials.get` 进行密钥认证
2. 认证器根据传入的参数进行密钥认证，并返回认证结果
3. 把结果回传给服务器，服务器根据传入参数和服务端之前存储的公钥进行验证，验证成功即为登录成功

上述的登录过程也省略了细节，比如说 `navigator.credentials.get` 需要的参数也是需要在服务器上生成的，参数中可以包含之前已注册过的保存在服务器上的公钥ID，由认证器进行检索，但是在一般的多用户网站中不会如此做，因为未登录的情况下，不知当前用户，也就无法获取到当前用户的所有公钥ID。如果在第一步的参数中未传入 `allowCredentials` 或传入了空数组，则在返回的认证结果中，会返回 `userHandle` 字段，即注册时的 `userId` 字段，在第三步就可以根据此字段，获取到当前是哪个用户登录了。如果在第一步的参数中传入了 `allowCredentials` ，则不会在认证结果中返回 `userHandle` ，真是奇怪的特性。

## 使用方式

WebAuthn 虽然只提供了 `navigator.credentials.create` 和 `navigator.credentials.get` 两个API，看上去似乎很方便调用，然而其中的参数生成和结果校验颇为复杂，所以自行开发的行为并不明智，推荐使用 `SimpleWebAuthn` 这个库来接入 WebAuthn 。

`SimpleWebAuthn` 分为三个包，分别是浏览器环境中使用的 `@simplewebauthn/browser`、`node server` 环境中使用的 `@simplewebauthn/server` 和 在使用 `typescript` 开发时的辅助包 `@simplewebauthn/types`。浏览器环境下，提供了 `startRegistration` 和 `startAuthentication` 这两个API，分别对浏览器提供的两个API进行了封装，这两个API接收的参数分别是来自服务端的包中的 `generateRegistrationOptions` 和 `generateAuthenticationOptions` 两个方法的返回值，而 `startRegistration` 和 `startAuthentication` 这两个方法的返回值，需要分别作为服务端包中的 `verifyRegisterationResponse` 和 `verifyAuthenticationResponse` 两个方法的参数传入以校验。它们的关系图如下:

![SimpleWebauthn的调用关系](https://github.com/qwertyyb/qwertyyb.github.io/assets/16240729/f2defc76-8a45-4df6-929f-e71faf25569e)

## SimpleWebAuthn 的坑

SimpleWebAuthn 已经很好用了，但是在实际调用过程中，发现在格式上有些问题，需要留意处理。

### base64url编/解码

首先是 `verifyRegisterationResponse` 返回的结果中，公钥和密钥ID需要存储到数据库中，但是这两个字段的类型的 `Uint8Array`, 需要进行 `base64url` 编码后再保存到数据库。其次是 `generateRegisterationOptions` 的参数字段 `excludeCredentials` 和 `generateAuthenticationOptions` 的参数字段 `allowCredentials` 的 `id` 需要是 `Uint8Array`, 所以就需要在从数据库中取出之后，进行 `base64url` 解码。最后是 `verifyAuthenticationResponse` 的参数中 `credentialID` 和 `credentialPublicKey` 也需要是 `Uint8Array` 类型，所以也需要注意 `base64url` 解码。

### userVerification 的问题

在 `generateRegisterationOptions` 和 `generateAuthenticationOptions` 方法的参数中，都有一个参数叫 `userVerification`，这个参数的似乎是用来设置认证器行为的，可以要求认证器是否进行用户认证，有三个值，分别如下：

1. `discouraged`：要求认证器不要进行用户认证，因为不需要用户执行认证流程，所以对用户没有打扰，但是我理解相对的，也就会有安全方面的风险。
2. `preferred`: 期望认证器进行用户认证，如果认证器不进行认证，也会成功，但是不会设置认证标志位。
3. `required`: 期望认证器进行用户认证，如果认证器无法进行认证，则操作会失败

推荐的设置是 `preferred`，这样就需要在调用 `verifyRegisterationResponse` 或 `verifyAuthenticationResponse` 时，传入参数 `requireUserVerification: false`, 不进行 `userVerfication` 的校验。