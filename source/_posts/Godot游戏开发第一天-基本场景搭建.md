---
title: Godot游戏开发第一天-基本场景搭建
date: 2023-03-15 17:24
tags: 游戏, godot
categories: 游戏, godot
---

使用Godot游戏引擎开发一款2D游戏，第一天，基本场景搭建

<!-- more -->

> Godot是一款开源的游戏开发引擎，支持2D和3D游戏的开发，脚本可以使用类似python语法的gdscript或微软的C#，从文档上来看，Godot相比Unity要轻量许多

本次开发使用的 Godot 的 3.5.x 版本。虽然刚好 4.0 版本已经正式发布了，但是 4.0 版本的发布明显仓促，官方 4.0 版本的英文文档尚不完全，中文文档仍然是在 3.5 的版本，而且 4.0 作为新版本必定带着新的 Bug，最后官方也承诺3.x版本作为 LTS 会继续进行维护。所以这次就使用 3.5.2 版本进行开发，暂不去尝鲜 4.0 版本。

这次只是 Godot 的初使用，所以先模仿做一个简单的游戏来学习一下。[Alto's Adventure](http://altosadventure.com/) 是一个不错的选择。

[Alto's Adventure](http://altosadventure.com/) 是一个 2D 的滑雪游戏，可以[点击链接](http://altosadventure.com/)查看。
![预览图](https://i.328888.xyz/2023/03/20/P8tO8.png)

现在开始吧

## 环境

- Godot 3.5.2
- MacOS 13.2.1

## 基本思路

先做一个简单的滑道(地面)和人物，使用 Godot 的物理引擎，开始时给人物一个初始速度，让人物在重力场景下沿着滑道进行滑动。

这里有几个概念: 物理引擎、地面和人物

## Godot 2D 中的物理学

Godot 2D 涉及到物理体的主要有`Area2D`、`StaticBody2D`、`RigidBody2D`、`KimentBody2D`。

- Area2D: 可以用来检测另一个物理体对当前 Area2D 实例的碰撞，也可用于覆盖物理属性, 例如一定区域内的重力或阻尼。
- StaticBody2D: 物理引擎不移动的主体. 它参与碰撞检测, 但不会响应碰撞而移动. 它们通常用于属于环境的对象或不需要任何动态行为的对象，比如地面
- RigidBody2D: 有质量，受重力和阻力等物理影响的物体，类比现实中的物体。你不能直接改变它的状态，而是在其中施加力，由物理引擎来计算速度
- KinematicBody2D: 没有质量，不受物理引擎的约束，但是可以检测和其它物理体的碰撞，它的移动和碰撞响应必须通过代码控制

基本上认识以上四种物理物体就足够使用了

在此游戏中，滑道是不移动的，人物在其上进行滑动。所以地面是一个 `StaticBody2D`, 而人物是一个 `RigidBody2D`。

## 创建滑道(地面)

### 添加物理地面
首先往场景中添加一个 `StaticBody2D`，命名为 `Ground`，如下图。

![PhBnp.png](https://i.328888.xyz/2023/03/20/PhBnp.png)

有一个配置警告，提示需要添加一个 `CollisionShape2D` 或 `CollisionPolygon2D` 为其子节点，而且添加了 `StaticBody2D` 后，预览场景也并没有任何变化，这是怎么回事？

### 给地面以形状
`StaticBody2D` 有摩擦力等物理属性，但是目前并没有一个确切的形状来描述 `Ground`，那人物怎么知道应该停留在哪个位置是地面呢？而所谓的 `CollisionShape2D` 和 `CollisonPolygon2D` 也就是碰撞体形状和碰撞体多边形，就是用来给 `Ground` 分配形状的，只有有了形状，物理引擎才能按物品的形状来检测碰撞。

那 `CollisionShape2D` 和 `CollisionPolygon2D` 应该使用哪个呢？
- `CollisionShape2D` 预定义了椭圆、圆、凹多边形、凸多边形、矩形、线形、线段这几个形状，如果物品的形状是这几种，或者这几种形状可以叠加出来的形状，那可以使用一个或多个`CollisionShape2D` 作为子节点
- `CollisionPolygon2D` 是把一些点连起来，作为碰撞形状的，所以相对于`CollisionShape2D`来说更加自由方便，需要提供一个顶点的列表作为 `polygon` 属性，然后 `CollisionPolygon2D` 将按顺序，第一个点连第二个点，第二个点连第三个点，以此类推，直到最后的最后最后一个点连第一个点，形式一个闭合的形状

那作为此游戏中的滑道(地面)，正如下图所示，主要复杂在，它有一条曲线，而这条曲线确定了最好使用 `CollisionPolygon2D`。添加一个 `CollisionPolygon2D` 节点到 `Ground` 中，命名为`GroundShape`。

在 `GroundShape` 右边有一个警告提示，提示 `polygon` 属性为空，不起作用，而 `polygon` 属性就是这个多边形的顶点，那么这个形状的点如何确定呢？手工填写吗？未免太低效，后续也不方便调试，这里可以使用 `Path2D` 节点

![Phcxk.png](https://i.328888.xyz/2023/03/20/Phcxk.png)

### 给形状传递点集

`Path2D` 节点可以生成曲线，先在 `GroundShape` 中添加 `Path2D` 子节点，命名为 `GroundShapePath`。然后随便画个曲线如下(可以不用闭合，`GroundShape` 会自动帮助我们闭合)。下一步要做的就是把 `GroundShapePath` 中的点集取出来传递给 `GroundShapePath`。

![PhmLL.png](https://i.328888.xyz/2023/03/20/PhmLL.png)

查看 `Path2D` 的文档，发现曲线信息存储在 `curve` 属性上，而 `curve` 属性是一个 `Curve2D` 实例，`Curve2D` 上有 `get_baked_points` 会返回曲线上的点，所以我们通过 `GroundShapePath.curve.get_baked_points()` 就能得到曲线上的点，下一步，把曲线上的点传给 `GroundShape` 的 `polygon` 属性，为此，需要写一点脚本。

右键单击 `GroundShape` 节点 -> 添加脚本，在 `GroundShape.gd` 中填入以下代码

```gdscript
tool
extends CollisionPolygon2D

func _ready():
	polygon = get_node("GroundShapePath").curve.get_baked_points()
```

代码很简单，节点ready的时候，获取子节点 `GroundShapePath` 的曲线点集，赋值给 `GroundShape` 的 `polygon` 属性。这里需要注意的是，子节点的 `_ready` 调用在父节点之前。在 `gdscript.gd` 的第一行添加 `tool` 是为了方便在编辑器中也能预览效果。现在保存脚本内容，保存场景为 `Game.tscn`，然后关闭场景，重新打开此场景，现在应该就能看到 `GroundShape` 的提示消失了，并且能够看到它的形状。如下图所示，彩色部分就是 `GroundShape` 的开关了，点击可以看到开关的点

[![PG1eA.png](https://i.328888.xyz/2023/03/20/PG1eA.png)](https://imgloc.com/i/PG1eA)

### 位置偏移的处理

正常情况下，`GroundShape` 的边会刚好和 `GroundShapePath` 的边完全重合，预览区域会向上面一样只显示一条曲线。但是如果在上述步骤或后面的步骤中，移动了 `GroundShapePath` 或 `GroundShape` 的位置，那就会像下面这样出现两条曲线。这时因为 `GroundShapePath` 和 `GroundShape` 的位置出现了偏移。

![PdGDd.png](https://i.328888.xyz/2023/03/20/PdGDd.png)

而出现偏移的原因是因为 `Godot` 中的每个节点都有一个 `transform` 属性，记录了节点的偏移、缩放和旋转信息，也称之为变换，如果对 `GroundShapePath` 进行了变换，那曲线上的点就都会在渲染时，应用对应的变换，注意这里只是渲染时应用了变换，通过 `GroundShapePath` 拿到的点的信息，仍然是没有变换的位置，最终在赋值给其父节点 `GroundShape` 时，就会有一个偏移。这里可以通过在编辑器中查看 `GroundShapePath` 的 `transform` 属性进行确认。这里的解决方式也很简单，只要保持 `GroundShapePath` 没有进行任何变换就可以了，可以点击输入框左边的图标恢复默认值。

![Pd6KV.png](https://i.328888.xyz/2023/03/20/Pd6KV.png)

### 给地面上色

现在点击左上角运行场景，发现场景中什么都没有，不像编辑器中有一个彩色的图标标注地面。这是因为 `GroundShape` 只有形状没有颜色，而在编辑器中之所以能看到了，是为了方便调试预览，在实际的场景中是看不到的。为了能够在实际运行时看到和编辑器中一样的效果，可以在调试菜单中勾选  “显示碰撞区域” 的选项，然后再运行，就会发现运行效果中显示出了和编辑器一样的彩色。如果只勾选 “显示导航”，就会看到 `GroundShapePath` 了。

虽然可以使用上面两个调试菜单项，但是这两个菜单毕竟只是为了方便调试，只是节目效果，并非地面真的有了颜色。所以还需要往 `Ground` 上填充真正的颜色，可以打开 `gdscript.gd` 脚本中添加如下函数。

```gdscript
func _draw():
  draw_polygon(polygon, [Color(1, 1, 1)])
```

这里使用顶点数据，向顶点闭合的图形中填充了白色，如此去掉调试的两个勾选项之后，再运行场景，就发现地面有了白色，在编辑器中关闭场景后重新启动，预览区域 `GroundShape` 也有了白色填充。

![PhARC.png](https://i.328888.xyz/2023/03/20/PhARC.png)

![PhDSP.png](https://i.328888.xyz/2023/03/20/PhDSP.png)
