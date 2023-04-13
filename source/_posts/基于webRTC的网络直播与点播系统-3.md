---
title: 基于webRTC的网络直播与点播系统-3（业务功能实现)
date: 2019-04-06 09:32:52
tags:
  - 前端
  - WebRTC
categories:
  - [前端, WebRTC]
---
首先，明确两个概念，直播者(`presentor`)和观众(`viewer`)
1. 在第一步中，会建立一个基本的直播端页面，这个页面中包含一个视频元素，直播者可以观察到摄像头的录制画面。

   **需要注意的是这里并不会直接显示摄像头获取到的本地画面，而是通过一个回环的方式，显示通过网络获取到的画画，这样直播者可以通过观察画面质量知道网络状况，做出调整和优化。所以实际上，直播者(presentor)也是一个观众(viewer)，观看自己的画画**

2. 在第二步中，会建立一个基本的观众端页面，
这个页面和直播端页面类似，唯一的不同是，这个视频源是来自直播者的摄像头而不是来自当前的设备。
3. 第三步，完成这一部分的后端逻辑
4. 扩展直播和点播的逻辑，完成通话功能

demo地址: https://webrtc.qwertyyb.cn/front/
<!-- more -->

### 开始之前
在开始之前，简单说一下这个项目的架构。
`kurento` 是一个基于 `CS`架构的 `webrtc` 框架, 在第一步中，已经通过 `docker` 的方式搭建了服务器。`kurento` 提供了不同语言的客户端实现(`Java`, `Javascript nodejs`, `Javascript browser`)。出于安全和业务方面的，采用 `nodejs` 的客户端实现，前端直接和 `nodejs` 的服务通信，`nodejs` 再和媒体服务器通信。这样可以把媒体服务器完全隐匿起来，更安全

### 搭建前端页面
前端页面使用 `vue + vuex + vue-router + elementui` 实现的具体步骤不再叙述，最终实现出来的两个页面如下

- 直播端
![直播端](https://i.loli.net/2019/04/29/5cc652167cbe4.png)

- 观众端
![观看端](https://i.loli.net/2019/04/29/5cc653c413eb4.png)


### 前端的部分逻辑
#### 1. 准备工作

使用 `kurento` 针对浏览器端提供的工具函数，可以大大简化直接使用原生原生构建 `webrtc` 连接的流程。安装引入，使用文档参考(https://doc-kurento.readthedocs.io/en/6.9.0/features/kurento_utils_js.html)
```
npm install kurento-utils --save
```

由于 `webrtc` 是一个比较新的标准，各个浏览器的实现api还有些许不同，所以引入 `webrtc-adapter` 以屏蔽不同浏览器之间的差异，引入方式如下
```js
npm install webrtc-adapter --save

// 然后在入口文件 src/main.js 中引入即可
import 'webrtc-adapter'
```

出于实时性的需要，本项目使用 `WebSocket` 以进行前后端通信，通过 `socket.io` 建立连接，安装 `socket.io` 的客户端
```
npm install socket.io-client --save
```

#### 2. 直播端
直播端的逻辑，首先发起 `webrtc` 请求，生成 `sdpOffer`，通过 `socket.io-client` 建立的 `WebSocket` 连接把 `sdpOffer` 传到服务端，服务端通过 `kurento` 的客户端连接到 `kurento` 的媒体服务器，服务端生成一个`webrtc`的 `endpoint`， 然后通过 `WebRtcEndPoint` 和 `sdpOffer` 生成 `sdpAnswer`，服务端把 `sdpAnswer` 传给客户端，客户端建立起浏览器和媒体服务器的连接，把通过摄像头获取的信息发送给媒体服务器

上面的流程屏蔽了一些细节，比如 NAT穿透服务的使用、iceCandidate的通信等等，具体的实现细节可以看下面的代码。

在这个过程中，服务端的作用仅仅是作为一个中间层，传递 **浏览器端和媒体服务器** 的信息， 当连接建立起来之后，就可以越过服务端直接进行通信了。这也就是点对点的概念了。

上面仅仅是建立连接，在这个应用中，当一个观众进入或离开的时候，还会在当前的直播端显示出来，这个功能也会通过websocket实现，具体代码如下

```js
// Presentor.js
import { iceServers } from '@/config/webrtc'
import kurentoUtils from 'kurento-utils'
import { getNewSocket } from '@/socket'

class Presentor {
  socket = null
  localVideo = null
  webRtcPeer = null
  events = {
    start: [],
    stop: [],
    error: [],
    message: []
  }
  constructor (localVideo) {
    this.socket = getNewSocket()
    console.log(this.socket)
    this.socket.on('error', error => {
      this.emit('error', error)
    })
    this.socket.on('connect_error', error => {
      this.emit('error', error)
    })
    this.socket.on('callaccepted', message => {
      this.emit('callaccepted', message)
    })
    this.socket.on('callrejected', message => {
      this.emit('callrejected', message)
    })
    this.socket.on('callerror', error => {
      this.emit('callerror', error)
    })
    this.localVideo = localVideo
    localVideo.addEventListener('canplay', this._onVideoCanplay)
  }
  _onVideoCanplay = _ => {
    console.log('onvideocanplay')
    this.emit('start')
  }
  bindEvent = () => {
    const { socket, webRtcPeer } = this
    socket.on('startResponse', ({ sdpAnswer }) => {
      console.log('SDP answer received from server. Processing ...')
      webRtcPeer.processAnswer(sdpAnswer)
    })
    socket.on('iceCandidate', ({ candidate }) => {
      webRtcPeer.addIceCandidate(candidate)
    })
  }
  start = (nickname = null) => {
    const options = {
      // localVideo: this.localVideo,
      remoteVideo: this.localVideo,
      mediaConstraints: {
        video: {
          width: 640,
          height: 480
        },
        audio: true
      },
      onicecandidate: this.onIceCandidate,
      configuration: {
        iceServers
      }
    }
    return new Promise((resolve, reject) => {
      this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, error => {
        if (error) return reject(error)
        resolve()
      })
    }).then(_ => {
      this.bindEvent()
      return new Promise((resolve, reject) => this.webRtcPeer.generateOffer((error, sdp) => {
        if (error) return reject(error)
        resolve(sdp)
      }))
    }).then(sdp => {
      console.info('Invoking SDP offer callback function ' + location.host)
      this.socket.emit('createPresentor', {
        sdpOffer: sdp,
        // 邀请某人对话
        invite: nickname
      })
    })
  }

  stop = () => {
    console.log('Stopping video call ...')
    if (this.webRtcPeer) {
      this.webRtcPeer.dispose()
      this.webRtcPeer = null
    }
    this.localVideo.removeEventListener('canplay', this._onVideoCanplay)
    this.socket.emit('stop')
    this.socket.close()
    this.emit('stop')
  }

  onIceCandidate = candidate => {
    console.log('Local candidate' + JSON.stringify(candidate))

    this.socket.emit('onIceCandidate', { candidate })
  }

  emit (name, ...args) {
    console.log(name, this.events)
    if (!Object.keys(this.events).includes(name)) return
    const cbs = this.events[name]
    return cbs.map(func => func(...args))
  }
  on (name, cb) {
    if (!Object.keys(this.events).includes(name)) return
    const cbs = this.events[name]
    if (cbs.includes(cb)) return
    cbs.push(cb)
    return this
  }
}

export default Presentor

// 在presentor.vue中的使用
...
export default {
  ...

  methods: {
    start () {
      this.status = 'starting'
      presentor = new Presentor(this.$refs.video)
      console.log(presentor)
      presentor.on('start', () => {
        this.status = 'living'
      })
      presentor.on('error', error => {
        console.log(error)
        this.stop()
      })
      presentor.on('message', message => {
        console.log('received message:', message)
        this.messages.push(message)
      })
      presentor.start()
    }
  }

  ...
}
...
```

代码中的iceServer，即为在第二步中搭建的 TURN 服务器的地址，整个 NAT穿透的过程对用户和开发者而言都是透明的，只需要正确设置服务器地址即可

#### 2. 观众端
观众端逻辑，观众端发起 `webrtc` 请求，生成 `SDP offer`，发送给服务端，服务端通过和媒体服务器通信生成一个 `WebRtcEndPoint` ,然后让直播端的 `WebRtcEndPoint` 和新生成的连接，然后生成对应 `SDP offer` 的应答 `SDP Answer`，传给浏览器，浏览器收到之后，建立起和媒体服务器之间的连接，获取到直播端的画面

需要说明的是，上面建立起的并不是直播端浏览器和观众端浏览器的直接连接。首先由直播端建立起和媒体服务器点对点的连接，然后媒体服务器再和观众端建立起点对点连接。这么做主要是为了减轻直播端的压力，如果是浏览器之间的直接连接，当一个直播有很多人观看时，因为是点对点的连接，直播端会把视频源传给每一个观众端，那么直播端就会有非常高的网络负载而导致无法正常直播。有了中心媒体服务器，媒体服务器会把视频源分发到观众端，大大减轻了直播端的压力。

观众端的具体代码和使用如下
```js
// Viewer.js
import { iceServers } from '@/config/webrtc'
import kurentoUtils from 'kurento-utils'
import io from 'socket.io-client'
import store from '../../store'

class Viewer {
  socket = null
  videoDom = null
  webRtcPeer = null
  events = {
    start: [],
    stop: [],
    presentorgone: []
  }
  constructor (videoDom, presentorId) {
    console.log(videoDom)
    this.socket = io({
      path: '/socket.io/webrtc',
      query: {
        token: store.state.token,
        presentorId
      },
      reconnection: false
    })
    this.socket.on('error', error => {
      this.emit('error', error)
    })
    this.socket.on('connect_error', error => {
      console.log('error')
      this.emit('error', error)
    })
    this.videoDom = videoDom
    videoDom.addEventListener('canplay', this._onVideoCanplay)
  }
  _onVideoCanplay = _ => {
    this.emit('start')
  }
  bindEvent = () => {
    const { socket, webRtcPeer } = this
    socket.on('startResponse', ({ sdpAnswer }) => {
      console.log('SDP answer received from server. Processing ...')
      webRtcPeer.processAnswer(sdpAnswer)
    })
    socket.on('iceCandidate', ({ candidate }) => {
      console.log('iceCandidate', candidate)
      webRtcPeer.addIceCandidate(candidate)
    })
    socket.on('presentorgone', _ => {
      this.videoDom.pause()
      this.videoDom.srcObject = null
      this.videoDom.load()
      this.emit('presentorgone')
      this.socket.close()
      this.emit('stop')
    })
    console.log(webRtcPeer)
  }
  start = () => {
    const options = {
      remoteVideo: this.videoDom,
      onicecandidate: this.onIceCandidate,
      configuration: {
        iceServers
      }
    }
    return new Promise((resolve, reject) => {
      this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, error => {
        if (error) return reject(error)
        resolve()
      })
    }).then(_ => {
      this.bindEvent()
      return new Promise((resolve, reject) => this.webRtcPeer.generateOffer((error, sdp) => {
        if (error) return reject(error)
        resolve(sdp)
      }))
    }).then(sdp => {
      console.info('Invoking SDP offer callback function ' + location.host)
      this.socket.emit('createViewer', {
        sdpOffer: sdp
      })
    })
  }

  stop = () => {
    console.log('Stopping viewer ...')
    if (this.webRtcPeer) {
      this.webRtcPeer.dispose()
      console.log('dispose')
      this.webRtcPeer = null
    }
    this.socket.emit('stop')
  }

  onIceCandidate = candidate => {
    console.log('Local candidate' + JSON.stringify(candidate))

    this.socket.emit('onIceCandidate', { candidate })
  }

  emit (name, ...args) {
    if (!Object.keys(this.events).includes(name)) return
    const cbs = this.events[name]
    return cbs.map(func => func(...args))
  }
  on (name, cb) {
    if (!Object.keys(this.events).includes(name)) return
    const cbs = this.events[name]
    if (cbs.includes(cb)) return
    cbs.push(cb)
  }
}

export default Viewer

// Viewer.vue
export default {
  ...
  methods: {
    start () {
      this.status = 'starting'
      viewer = new Viewer(this.$refs.video, this.$route.params.liveId)
      console.log(viewer)
      viewer.on('start', () => {
        this.status = 'living'
      })
      viewer.start()
    },
    ...
  }
  ...
}
```

### 服务端的逻辑
服务端使用 `nodejs + express + socket.io + kurento-utils-js + mysql + sequlize + redis` 来构建。其中 `mysql`、`sequelize` 和 `redis` 用来存储数据和管理用户登录状态，不再细叙这部分的逻辑，根据直播端和观众端的逻辑。相关的部分代码具体如下：
```js
const KurentoClient = require('kurento-client')
const http = require('http')
const socketIO = require('socket.io')
const util = require('util')
const { kurentoClient: client, presentors, userSocketMap, viewers } = require('../global')
const Video = require('../models').Video
const config = require('../config')()
const { getUserByToken, checkUserOnline, formatTime } = require('../utils')
const moment = require('moment')
const candidatesQueue = {}

/*
 * Management of WebSocket messages
 */
const bindEvent = io => {
  io.on('connection', async function (socket) {
    var sessionId = socket.id
    var request = socket.request
    const self = await getUserByToken(socket.handshake.query.token).catch(err => {
      socket.emit('autherror')
      socket.disconnect(true)
      throw err
    })
    const presentorId = socket.handshake.query.presentorId

    const ip = request.headers['x-real-ip'] || request.socket.remoteAddress
    console.log('request ip:', ip)
    const getLocationPromise = new Promise(resolve => http.get(`http://ip-api.com/json/${ip}?lang=zh-CN`, resolve)).then(res => {
      return new Promise(resolve => {
        let data = ''
        res.on('data', chunk => {
          data += chunk
          return data
        })
        res.on('end', () => {
          resolve(data)
        })
      })
    }).then(data => {
      const { status, country, regionName, city } = JSON.parse(data)
      if (status !== 'success') throw new Error(data)
      console.log(regionName + country + city)
      return `${regionName}${country}${city}`
    }).catch(_ => {
      // console.log('get location error', err)
      return 'unknown'
    })
    console.log(`socket ${sessionId} connected`)

    socket.on('error', _ => {
      console.log('Connection ' + sessionId + ' error', _)
      !presentorId && stopPresentor(sessionId)
      presentorId && stopViewer()
    })

    socket.on('close', function () {
      console.log('Connection ' + sessionId + ' closed')
      !presentorId && stopPresentor(sessionId)
      presentorId && stopViewer()
    })
    socket.on('createPresentor', ({ sdpOffer, invite }) => {
      createPresentor(socket, sdpOffer, getLocationPromise).then(sdpAnswer => {
        socket.emit('startResponse', { sdpAnswer })
        invite && inviteViewer(self, invite, socket.id)
      }).catch(error => {
        return socket.emit('error', { message: error.message })
      })
    })

    socket.on('createViewer', message => {
      sessionId = socket.id
      createViewer(presentorId, sessionId, socket, message.sdpOffer).then(viewer => {
        // console.log(viewer)
        const roomid = viewer.presentor.socket.id
        viewer.socket.join(roomid, () => {
          socket.to(roomid).emit('message', {
            type: 'viewer-entry',
            time: moment(new Date()).format('HH:mm:ss'),
            from: {
              nickname: self.nickname,
              avatar: self.avatar
            }
          })
        })
      }).catch(err => {
        console.log(`create viewer for ${presentorId} error`, err)
      })
    })

    socket.on('online', _ => {
      console.log(`${self.nickname} online`)
      userSocketMap[self.nickname] = socket
    })
    socket.on('offline', _ => {
      console.log(`${self.nickname} offline`)
      userSocketMap[self.nickname] = null
    })
    // 接听对话, from：接听来自from的对话
    socket.on('acceptcall', ({ from }) => {
      const { nickname } = from
      console.log('acceptcall socket id', socket.id)
      const friendSocket = userSocketMap[nickname]
      friendSocket.emit('callaccepted', { to: self, linkId: socket.id })
    })
    // 拒绝接听
    socket.on('rejectcall', ({ from }) => {
      const friendSocket = userSocketMap[from.nickname]
      friendSocket.emit('callrejected', { to: self })
    })

    socket.on('stopPresentor', message => {
      stopPresentor(sessionId, getLocationPromise)
    })

    socket.on('stopViewer', _ => {
      stopViewer(socket, self)
    })

    socket.on('onIceCandidate', message => {
      onIceCandidate(sessionId, message.candidate, presentorId)
    })

    socket.on('inviteViewer', ({ nickname }) => {
      userSocketMap[nickname].emit('call', { from: self })
    })
  })
}

/*
 * Definition of functions
 */

function createPresentor (socket, sdpOffer, getLocationPromise) {
  const sessionId = socket.id
  if (!sessionId) {
    return Promise.reject(new Error('Cannot use undefined sessionId'))
  }
  console.log(`create presentor ${sessionId}`)
  return Promise.all([
    util.promisify(client.create)('MediaPipeline'),
    getLocationPromise
  ]).then(([ pipeline, location ]) => {
    const { mediaProfile, path } = config.recordOptions
    const fileName = `${formatTime(new Date())}.mp4`
    const uri = `${path}/${fileName}`
    const recordOptions = {
      mediaProfile,
      uri
    }

    return Promise.all([
      util.promisify(pipeline.create)('WebRtcEndpoint'),
      util.promisify(pipeline.create)('RecorderEndpoint', recordOptions)
    ]).then(([ webRtcEndpoint, recorderEndpoint ]) => {
      webRtcEndpoint.on('OnIceCandidate', function (event) {
        const candidate = KurentoClient.getComplexType('IceCandidate')(event.candidate)
        socket.emit('iceCandidate', { candidate })
      })
      recorderEndpoint.on('Recording', function (error) {
        console.log('recording', error)
        presentors[sessionId].startTime = Math.round(Date.now() / 1000)
        presentors[sessionId].recorderPath = recordOptions.uri
      })
      recorderEndpoint.on('Stopped', err => {
        console.log('record stoped', err)
        const endTime = Math.round(Date.now() / 1000)
        const { startTime } = presentors[sessionId]
        if (!startTime || endTime - startTime < 1) {
          console.log('record time to short')
          return
        }

        // 数据存储到数据库中
        getLocationPromise.then(async location => {
          Video.create({
            location,
            uri: await recorderEndpoint.getUri(),
            comments: '',
            duration: endTime - startTime
          }).then(tableRow => {
            console.log('video save to database success', tableRow)
            return tableRow.id
          })
        })
      })
      if (candidatesQueue[sessionId]) {
        while (candidatesQueue[sessionId].length) {
          const candidate = candidatesQueue[sessionId].shift()
          webRtcEndpoint.addIceCandidate(candidate)
        }
      }
      return Promise.all([
        webRtcEndpoint.connect(recorderEndpoint),
        // 本地使用远程获取的视频流，可以实时观察到视频质量
        webRtcEndpoint.connect(webRtcEndpoint)
      ]).then(_ => {
        recorderEndpoint.record(function (error) {
          console.log('record start', error)
        })
        return webRtcEndpoint.processOffer(sdpOffer)
      }).then(async sdpAnswer => {
        webRtcEndpoint.gatherCandidates(function (error) {
          if (error) {
            return Promise.reject(error)
          }
        })
        presentors[sessionId] = {
          pipeline: pipeline,
          webRtcEndpoint: webRtcEndpoint,
          recorderEndpoint: recorderEndpoint,
          socket: socket,
          viewers: {}
        }
        return sdpAnswer
      })
    })
  })
}

function inviteViewer (inviter, nickname, linkId) {
  console.log('invite', nickname)

  return checkUserOnline(nickname).then(_ => {
    userSocketMap[nickname].emit('call', { from: inviter, linkId })
  }).catch(error => {
    console.log('invite error', error.message)
    userSocketMap[inviter.nickname].emit('callerror', { message: error.message })
  })
}

function createViewer (presentorId, sessionId, socket, sdpOffer) {
  // clearCandidatesQueue(sessionId)
  console.log(`create viewer for presentor ${presentorId} start`)
  if (!presentors[presentorId]) return Promise.reject(new Error('no presentor'))
  const { pipeline, webRtcEndpoint: presentor, viewers: presentorViewers } = presentors[presentorId]
  if (!pipeline) return Promise.reject(new Error('no presentor'))
  return util.promisify(pipeline.create)('WebRtcEndpoint').then(webRtcEndpoint => {
    if (candidatesQueue[sessionId]) {
      while (candidatesQueue[sessionId].length) {
        var candidate = candidatesQueue[sessionId].shift()
        webRtcEndpoint.addIceCandidate(candidate)
      }
    }
    webRtcEndpoint.on('OnIceCandidate', function (event) {
      var candidate = KurentoClient.getComplexType('IceCandidate')(event.candidate)
      socket.emit('iceCandidate', { candidate })
    })
    viewers[sessionId] = presentorViewers[sessionId] = {
      webRtcEndpoint: webRtcEndpoint,
      socket: socket,
      presentor: presentors[presentorId]
    }
    return webRtcEndpoint
  }).then(webRtcEndpoint => {
    return presentor.connect(webRtcEndpoint).then(_ => {
      return webRtcEndpoint.processOffer(sdpOffer)
    }).then(sdpAnswer => {
      socket.emit('startResponse', { sdpAnswer })
      return webRtcEndpoint.gatherCandidates()
    }).then(_ => {
      return viewers[sessionId]
    })
  })
}
async function stopPresentor (sessionId, getLocationPromise) {
  if (presentors[sessionId]) {
    const { recorderEndpoint, pipeline, viewers, startTime, recorderPath } = presentors[sessionId]
    recorderEndpoint.stop(function (error) {
      console.log('stop record', error)
      const endTime = Math.round(Date.now() / 1000)
      if (!startTime || endTime - startTime < 1) {
        console.log('record time to short')
        return
      }

      // 数据存储到数据库中
      getLocationPromise.then(async location => {
        Video.create({
          location,
          uri: recorderPath,
          comments: '',
          duration: endTime - startTime
        }).then(tableRow => {
          console.log('video save to database success', tableRow.id)
          return tableRow.id
        })
      })
    })
    console.info('Releasing pipeline')
    pipeline.release()
    Object.values(viewers).forEach(viewer => {
      viewer.socket.emit('presentorgone')
    })
    delete presentors[sessionId]
    delete candidatesQueue[sessionId]
  }
}

function stopViewer (socket, self) {
  const sessionId = socket.id
  if (!viewers[sessionId]) return
  const roomid = viewers[sessionId].presentor.socket.id
  socket.to(roomid).emit('message', {
    type: 'viewer-leave',
    time: moment(new Date()).format('HH:mm:ss'),
    from: { nickname: self.nickname, avatar: self.avatar }
  })
  socket.leave(roomid)
  socket.disconnect()
  delete viewers[sessionId].presentor.viewers[sessionId]
  delete viewers[sessionId]
}

function onIceCandidate (sessionId, _candidate, presentorId) {
  var candidate = KurentoClient.getComplexType('IceCandidate')(_candidate)
  // console.log(presentorId && presentors[presentorId] && presentors[presentorId].viewers[sessionId])
  if (presentorId && presentors[presentorId] && presentors[presentorId].viewers[sessionId]) {
    console.log('sending viewer candidate')
    const webRtcEndpoint = presentors[presentorId].viewers[sessionId].webRtcEndpoint
    webRtcEndpoint.addIceCandidate(candidate)
  } else if (presentors[sessionId]) {
    console.info('Sending presentor candidate')
    var webRtcEndpoint = presentors[sessionId].webRtcEndpoint
    webRtcEndpoint.addIceCandidate(candidate)
  } else {
    console.info('Queueing candidate')
    if (!candidatesQueue[sessionId]) {
      candidatesQueue[sessionId] = []
    }
    candidatesQueue[sessionId].push(candidate)
  }
}

module.exports = function (server) {
  const io = socketIO(server, {
    path: '/socket.io/webrtc'
  })
  bindEvent(io)
}

```

### 扩展实现通话功能
关于视频通话功能，根据上面的逻辑，所谓的视频通话，对通话的每一方来说，都有两个视频源，一个来自自己的直播端，也就是上面直播功能的实现，一个是对方的画面，也就是上面观众端功能的实现。

所以视频通话功能，我们不需要再扩展任何webrtc相关的功能，只需要在用户登录的时候，维护一个 `WebSocket` 长连接，当被呼叫时，把呼叫信息实时的反馈到被呼叫端，被呼叫端作出的应答信息再反馈到呼叫端。这一部分的已经和webrtc不再相关了，不再细叙，相关的逻辑在上面的后端代码已经包含。

### 关于点播功能
`kurento` 提供了 `RecorderEndPoint` 来实现录制功能，只需要在webrtc开始直播的时候，把 `WebRtcEndPoint` 连接到 `RecorderEndPoint` 即可，然后在直播结束的时候，把时长，位置信息存入数据库即可，然后搭建一个前端页面，查询数据库，播放视频，这都是很简单的逻辑功能，不再详细描述。

### 源码相关
关于本篇的全部源码，可直接查看 `github` 获取

前端代码: https://github.com/qwertyyb/webrtc-front

后端代码: https://github.com/qwertyyb/webrtc-server (由于后端涉及到密码，密钥等安全相关的配置信息，后端代码权限目前为私密，后期脱密处理后会公开源码)

部署配置仓库

为了方便配置，我写了一份 `docker-compose.yml` 文件来一键配置这些相关服务，源码如下:
https://github.com/qwertyyb/webrtc-configuration (由于涉及到数据库密码，密钥文件等安全相关信息，目前权限为私密，后期脱密处理后会公开源码)

### 参考文档
1. [kurento-client-js](https://doc-kurento.readthedocs.io/en/6.9.0/_static/client-jsdoc/index.html)
2. [kurento-utils-js](https://doc-kurento.readthedocs.io/en/6.9.0/features/kurento_utils_js.html)
3. [socket.io](https://socket.io/docs/)

