---
title: IMKInputController 的碎碎念
created: 2023-04-23 13:55
tags:
  - MacOS
  - 业火输入法
  - InputMethodKit
categories:
  - [MacOS, 业火输入法]
  - [MacOS, InputMethodKit]
---

在开发业火输入法的过程中，发现 `IMKInputController` 有一些文档没提到，又容易搞错的点，记录一下

<!-- more -->

### `IMKInputController` 的创建和销毁
 
   系统会为每一个输入框实例化一个 `IMKInputController` 对象，虽然同一时间只有一个输入框能获焦，但是在当前的输入框获焦时，之前的实例并不会立刻销毁，所以同一时间系统中可能存在多个 `IMKInputController` 实例，而且随着使用实例会越来越多。
   
   关于实例的销毁时机，经过实验发现，当应用程序退出时，由该应用程序的输入框实例化的对象会销毁。所以，一个比较合理的猜测是 `IMKInputController` 对象的销毁是跟随输入框的生命周期的，当输入框被销毁或释放时，其持有的对象也会随之释放。
   
   ![IMKInputController的实例化](/assets/IMKInputController%20的碎碎念/233822142-008b6de6-e5ff-47fe-948f-d4115e8a4f9d.png)
   
### `activateServer` 和 `deactivateServer` 的调用时机和顺序
   
   当一个输入框获取到输入焦点时，如果当前的输入框是第一次获取焦点，那么会首先实例化一个对象，然后调用对象上的 `activateServer` 方法，之前的输入框持有的对象的 `deactivateServer` 方法被调用，这里两个方法的调用顺序并不固定，所以不要依赖调用顺序来做逻辑。
   
   ![activateServer和deactivateServer的调用时机和顺序](/assets/IMKInputController%20的碎碎念/233822138-953a1cc8-a85f-4546-b2dd-5950caddcbb4.png)
   
   在 `safari` 的地址栏输入时，有发现一个比较奇怪的问题，当从中文输入模式切换到英文模式下时，原本没有输完的原码应该要自动上屏后清空，但是却发现并没有上屏，而且再切回中文的时候，也会发现原码没有清空。这里我的实现是在 `activateServer` 时，把当前 `IMKInputController` 对象绑定给了全局的 `shift` 按键监听对象(至于原因，下面有说到)，然后在 `shift` 键按下时，调用对象绑定的 `IMKInputController` 对象的方法把原码上屏并清空。但是在 `safari` 的地址栏中，当出现问题时，接受原码输入的 `IMKInputController` 实例和绑定给全局 `shift`按键监听的 `IMKInputController` 实例并不是同一个。理论上来说虽然有多个 `IMKInputController` 实例，但是最后被系统调用 `activateServer` 方法的实例应该是要和接受原码输入的实例是同一个才对，但是至少目前来看，在 `Safari` 的地址栏中并不是这样(MacOS 版本 13.3.1, Safari版本待补充)，所以这里最好是在接收原码输入时，重新再绑定一下。
   
   ![Safari地址栏的奇葩行为](/assets/IMKInputController%20的碎碎念/233822136-6b7f7b85-e111-4c98-b7b9-29f387a057ed.png)
   
### `shift` 按键的监听
   
   `shift` 按键常被用来作为输入法中英文模式的切换按键。
   
   官方的给出做法是在 `recognizedEvents` 方法中返回包含 `flagschanged` ，如此以来就能监听到所有修饰键(比如 `command`, `shift`, `alt`, `fn` 等), 然后在事件对象中判断 `shift` 按键，这里要注意的是 `flagsChanged` 事件虽然是由按键引起的，但是并不会触发 `keydown` 和 `keyup` 事件，所以只监听 `keydown` 事件是不行的，必须要监听 `flagsChanged` 事件。
   
   关于 `flagsChanged` 事件的触发时机: `shift` 按键按下和抬起都会触发 `flagschanged` 事件，在按下的事件中可以在具体的事件对象中的字段来区分 `shift` 按键和其他的修饰键，但是我们不应该在键的按下中去做逻辑，这是因为 `shift` 键还被用来和英文键组合输出大写字母，所以如果在 `shift` 键被按下时来做中英文的切换，那就会和写字母的输出冲突。同样的道理，如果在按键抬起时做切换的逻辑也会有同样的问题，而且如果在 `shift` 键抬起中做切换的逻辑，除了前面的问题外，也无法根据抬起按键的事件对象区分 `shift` 和其它按键(因为事件 `flagsChanged` 的事件对象中的变化值为0，即从某个修饰键变为了0，但是某个修饰键并不在事件对象中)。
   除了上面的问题，在实际运行中发现还存在一些问题，在一些输入框中即使按了 `shift` 键，但是事件并有触发，也就是说监听代码没有被执行，`shift` 按钮从未被按下，目前发现的场景有，在保存文件时调起的系统保存输入框中和 `LaunchPad` 的搜索输入框中。
   现在感觉到复杂了吗？

#### 处理如何监听的问题

   因为 `shift` 按键可以和其它按键组合输出大写字母或标点符号，所以只单独监听 `shift` 按键的按下或抬起是不行的，需要监听单独 `shift` 按键的按下和抬起。也就是说需要监听按下和抬起两个动作，并且在按下和抬起的动作中不能有其它的按键操作，同时，需要对按下和抬起的时间间隔做要求，不能太长，太长的话，就不做切换，当然也不能太短
   
#### 处理某些场景下 `shift` 按键不触发的问题

  因为使用 `recognizedEvents` 的方法，在某些系统的输入框中监听不到 `shift` 按键，又不想对某些场景做特殊逻辑，所以需要找到一种更稳定的方法来监听 `shift` 按键。这里可以使用 `NSEvent.addGlobalMonitorForEvents` 方法来做监听，从实践来看，能够解决上面的问题。
  
  但是需要注意的是，`NSEvent.addGlobalMonitorForEvents` 只能监听到其它应用的按键事件，但是监听不到应用本身的事件，所以如果输入法应用内有输入文字的场景就会有问题，业火输入法的用户词库场景就遇到了这个问题。解决这个问题也比较简单，可以结合 `NSEvent.addGlobalMonitorForEvents` 和 `NSEvent.addLocalMonitorForEvents` 或 `NSEvent.addGlobalMonitorForEvents` 和 `recognizedEvents` 两种方法，业火输入法使用的是后者
  
  
### 小小的总结

  有两个点后续要注意

  1. 在开发过程中，有些点过于相当然了，比如说 `IMKInputController` 的创建和销毁，刚开始我以为是当前的聚焦时，之前的就会销毁，根据一些测试情况，就认为 `activateServer` 和 `deactivateServer` 有固定的执行顺序。但是官方文档上并没有任何地方提及到这一点，所以这里的一些实现有些相当然。

  2. MacOS系统或系统应用的特殊情况太多，比如说某些系统界面下 `shift` 不生效的问题，还有 `Safari` 地址栏的奇葩行为，这些没有官方说明，只能是在实践中发现这些坑，修修补补
   
   
   
   
   
   
   
   
   
   
   
   
   
