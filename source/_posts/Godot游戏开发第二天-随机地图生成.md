---
title: Godot游戏开发第二天-随机地图生成
date: 2023-03-16 17:24
tags:
  - 游戏开发
categories:
  - [游戏, godot]
---

使用Godot游戏引擎开发一款2D游戏，第二天，在前一天，搭建了基本场景，包含有一个很短滑道和游戏人物，并且让人物在物理引擎的作用下沿滑道滑动，今天来研究并生成一个随机且无限长的滑道。

<!-- more -->

## 滑道的研究

游戏中主要使用物理引擎，所以就要尊重物理现实。在不额外施加外部力的情况下，人物的移动是完全依赖重力达成。那滑道就必须要呈现为向下，又由于人是向右运动的，所以滑道的方向整体是向右下方进行延伸，就像下面这样，滑道只有遵循这个原则才能在重力的作用下不断运动。
![滑道的方向](https://user-images.githubusercontent.com/16240729/226924229-158e5e25-e08f-4870-8fa8-acfd3d73c31d.png)

但是如果是直直的一条线，那未免太无趣了，所以我们可以再加上转折，就像下面这样。

![带转折的滑道](https://user-images.githubusercontent.com/16240729/226926806-4683e4fe-7c2f-46fe-88fe-a014f4c20b59.png)

然而这样的转折太生硬，如果在转折的地方能使用平滑的曲线进行链接，那应该就更完美了，所以最终的效果会类似这样。

![最终效果](https://user-images.githubusercontent.com/16240729/226929025-0785cdc1-534a-4ab8-a25a-9c9f9c760a77.png)

所以今天要解决的具体问题就变成了，如何生成一条整体向右下方平滑曲线的问题。

## 实现思路

因为这个滑道是一个整体向右下的曲线，那就暂且先不考虑向上运动的这种情况。如果用折线来描述，那滑道就是这样的。

![移除向上运动后的滑道拆线描述](https://user-images.githubusercontent.com/16240729/226939093-f08c57ff-0d0b-41c5-912d-d1d7b7aa8f14.png)

假设我们现在给到了一段初始的指向右下角直线，在这个直线上进行续接，生成随机但是整体向右下角的曲线，该如何实现呢？

说到曲线，第一个想到的就是圆。那能否利用圆的片断也就弧线相互拼接来生成这一条曲线呢。

### 使用圆弧实现

根据初中数学，我们知道弧线的无缝拼接的要点在于两段弧线拼接点的切线要在同一条直线上，就像下面这样。

![圆弧的拼接](https://user-images.githubusercontent.com/16240729/226943121-a3b398d0-e43c-4d33-a244-daa7e8750af8.png)

圆弧 PQ 在 Q 点的切线在是 AB，圆弧 QR 在 Q 点的切线也是AB，所以曲线 PQR 是很平滑的曲线。我们接下来在 PQ 弧线上随机选一点 J 做切线，再在 QR 弧线上随机选一点 K 做切线，如下图所示。

![前后做切线](https://user-images.githubusercontent.com/16240729/226946592-b6a03905-2d08-4937-9451-fa646cc6025e.png)

这样曲线 MJQKN 就可以看做滑道中的转折部分了，目前两个圆的切点重合在了 Q 点，如果我们把两个切点在直线 AB 上错开，就可以看到两个转折分别是曲线 PJY 和 WKN。

![分开切点](https://user-images.githubusercontent.com/16240729/226950681-6af1015d-15e8-40e8-8b36-dff13edf91db.png)

再回到最开始的问题，给了一段初始的向右下的线段 MN，如何续接一条随机的曲线？这个过程其实就是上面的一个逆过程。

1. 以 MN 为某个圆的切线，在 N 点作垂直于 MN 的直线 PQ, 根据平面几何原理，直线 PQ 必过以 MN 为切线，N为切点的圆的圆心
2. 在直线 PQ 上取任意区别于 N 点的点 O 作为圆 O 的圆心
3. 接下来以 O 为圆心，ON 为半径作圆，则 MN 线段就平滑地续接上了一段曲线。
4. 最后，可以圆弧上合适的一点，作切线
5. 可以延长切线，作为曲线中的直线部分
6. 在第5步的切线上随机寻一点作垂线，重复1-6步，就能生成无限长，随机并且平滑的曲线。

![基于圆弧的随机曲线生成](https://user-images.githubusercontent.com/16240729/227111692-d180becf-6986-4539-b46f-4ffaaafc4f7d.png)

这就是利用圆弧实现的思路，思路有了具体代码实现也就有了依照，这里就先不列出了。

说到曲线，除了圆之外，在具体实践中，还有一条曲线也非常有名，其名为贝塞尔曲线，此题其实更适合使用贝塞尔曲线求解。

### 使用贝塞尔曲线实现

先来看一下二次贝塞尔曲线的定义和计算方式

二次方贝兹曲线的路径由给定点 $P_0$、$P_1$、$P_2$ 的函数 $B(t)$ 追踪：

$$B(t) = (1-t)^2P_0 + 2t(1-t)P_1 + t^P_2, t \in [0, 1] $$

用动画表示是这样的:

![二次贝塞尔曲线的演示](https://user-images.githubusercontent.com/16240729/227114640-99bd08de-cc2a-4ca5-a749-21496590a484.gif)

观察二次贝塞尔曲线，可以发现，曲线在 $P_0$ 处的切线为 $P_0P_1$，在 $P_2$ 处的切线为 $P_1P_2$，如果分别沿着 $P_1P_0$、$P_1P_2$ 延伸，再旋转一下，哇哦，那可不就是我们想要的曲线上的一段吗?

![曲线的转折片断](https://user-images.githubusercontent.com/16240729/227127320-d37ac796-c244-4078-bcc8-d0e4659e508e.png)

那再回到原始的问题，给了一段初始的向右下的线段 MN，如何续接一条随机的曲线？

1. 类比一下，这里的点 N 其实就是 $P_0$，那需要求解的就是 $P_1$ 和 $P_2$ 的位置。
2. 根据上面的推理，$P_1$ 的位置比较好找，就是线段 $MN$ 延长线上的一点，那可以在 $MN$ 的延长线上随机选择一点作为 $P_1$，这样就只剩余最后一个点 $P_2$ 的问题需要确定了
3. 首先 $P_1P_2$ 的方向决定了下一段曲线或直线的方向，那在不考虑向上的情况下，点 $P_2$ 的坐标只可能位于 以点 $P_1$ 为原点，向上为 Y 轴正方向，向右为 X 轴正方向的直角坐标系 的第四象限内，在第四象限内随机选取一点作为 $P_2$。
4. 有了 $P_0$、$P_1$、$P_2$ 三个点，一条平滑的曲线就生成了。
5. 接下来，可以在 $P_1P_2$ 的延长线上随机选取一点作为下一断弧线的 $P_1$, 重复1-5步，就能生成无限长，随机并且平滑的曲线。

![基于二次贝塞尔曲线的随机曲线生成](https://user-images.githubusercontent.com/16240729/227133457-3a420cf3-e366-49b7-b866-92a9e2b9b8b3.png)

这种方式，相对于上面的方式来说更加简单，而且在具体的代码实现上，也会更简洁，下面就来看如何用代码实现。

## 代码实现

**注意**: 这一部分要求有基本的向量方面的知识，可以简单阅读 [Godot 向量数字部分的文档](https://docs.godotengine.org/zh_CN/stable/tutorials/math/vector_math.html "Godot 向量数字部分的文档") 学习。

首先需要对现有的场景进行改造，调整 `GroundShapePath`, 只保留三个点即可，调整成如下的样式。

![调整后的曲线样式](https://user-images.githubusercontent.com/16240729/227190996-dd5ccd80-08e4-4104-a26c-b87bf321625e.png)

然后在 `GroundShapePath` 中添加 `gdscript` 脚本，添加 `addPoints` 方法，因为添加曲线，实际就是循环往曲线上添加 $P_0$、$P_1$、$P_2$ 这三个点。

### 获取 $P_1$ 点的位置

经过上面分析可知，$P_1$ 点在当前曲线最后一个点的切线上，那要先获取最后一段曲线的切线。

可以用这段曲线最后两个点连成的直线作为曲线的切线。然后在这段切线的延长线上随机获取一点，代码如下:

```python
func addPoints():
	var points = curve.tessellate()
	var P0 = points[points.size() - 1] # 曲线的最后一个点
	var lastSecPoint = points[points.size() - 2]  # 曲线的倒数第二个点
	var tangent = (P0 - points[points.size() - 2]).normalized() # 计算第一个切线的方向向量: 用最后两个点连成的向量当作曲线的切线向量
	var P1
	for i in range(4):
		P1 = P0 + tangent * rand_range(60,80) # 在切线的方向向量延伸 60-80 单位区间，随机一个数值，作为点 P1 的位置
		
		# 1. 先定义一个与 X 轴正方向相同的单位向量
		# 2. 为了避免出现完全水平或完全竖直的情况，随机旋转 15-75度 范围内的任意一个值，这样就保证了点 P2 落在对应的象限内
		var P2Direction = Vector2(1, 0).rotated(rand_range(PI / 12, 5 * PI / 12))

		# P2 的方向向量乘以随机长度，再加上 P1 的向量，计算出 P2 的实际位置
		var P2 = P1 + P2Direction * rand_range(60, 80)
		
		# 把点 P2 和 控制点 P1 追加到曲线末尾, 这里要注意的是， 控制点的位置是相对于添加点的，所以需要P1 - P2
		curve.add_point(P2, P1 - P2)
    
    # 下一个P0点就是当前的P2点
    # 下一个P0的切线的方向向量就是当前P2点的切线的方向向量
		P0 = P2
		tangent = P2Direction
```

然后在 `_ready` 方法中调用 `addPoints` 方法，然后选择调试，勾选上"显示导航", 点击右上角运行场景，现在就能看到效果了。

![运行效果](https://user-images.githubusercontent.com/16240729/227191006-24ae9398-8101-4a6e-b338-24d2ed827749.png)

从图上看发现续接的曲线似乎并不是很平滑，这是为什么？因为现在我们还不能移动画面，所以为了在运行时方便查看曲线的效果，我们把 $P_0$、$P_1$、$P_2$ 这三个点的距离调得很近(目前是60-80)，所以曲线部分在整体来看就会显示不太平滑，我们后面把距离调远，就可以看到更为平滑的曲线了。

但是发现地面没了，这是怎么回事？

对于 `GroundShape` 来说，会把第一个点和最后一个点进行连接，形成一个闭合的多边形，而我们在上面改了曲线，导致曲线的最后一个点和第一个点连接的时候，形成的曲线不闭合，导致了这个问题，接下来就来处理这个问题

### 地面的修复

这里需要先获取曲线上的点，然后再添加其余三条直边的顶点，最后把这些点都传给 `GroundShape` 就能形成一个闭合的形状。

先在 `GroundShapePath.gd` 脚本中，添加方法 `updateShape` 如下:

```python
func updateShape():
	var points = curve.tessellate()
	
	# 曲线上的第一个点，也就是曲线的左上角的那个点
	var first = points[0]
	
	# 曲线上的最后一个点，曲线右下角的点
	var last = points[points.size() - 1]
	
	# 往曲线上添加另外三条边的顶点
	# 用户可见高度
	var height = get_viewport_rect().size.y
	var maxY = last.y + height
	
	points.append(Vector2(last.x, maxY)) # 添加右下角的点
	points.append(Vector2(first.x, maxY)) # 添加左下角的点
	
	# 设置父节点，也就是 GroundShape 的 polygon 属性
	get_parent().polygon = points
```

然后删除 `GroundShape.gd` 的 `_ready` 函数，现在完全由子节点 `GroundShapePath` 来直接更新父节点的属性了，所以 `_ready` 方法可以删除了。

然后再点击右上角的运行，现在应该就可以看到地面了。

![运行效果](https://user-images.githubusercontent.com/16240729/227434952-6e0468ba-e13f-4311-8ef7-966db36236a2.gif)


### 无限地图

目前循环只能生成有限长度的曲线，并不是无限的，这是因为不可能一开始就生成一条无限长的曲线，只能是生成有限长的曲线，然后配合画面的移动，不停的在曲线上续接，最终游玩的时候，就好像有无限长的路径一样。这里有三个步骤:

1. 获取画面的位置信息，包括画面的最左边和最右边位置，最左边用于清理之前生成的路径，最右边用于判断是否需要生成新的路径

2. 清理之前的路径

3. 生成新的路径

这里要想获取当前画面的位置信息，就需要了解 `Camera2D` 的原理。

#### Camera2D 的原理

这里需要理解一下 `Camera2D` 的原理。首先所有的 `CanvasItem` 是画在 `Canvas` 上(layer默认为0)，从运行效果上，我们会认为是 `Camera2D` 在画面上移动，渲染 `Camera2D` 范围内的图像到 `viewport`， 然而实际情况下并不是这样的， `Camera2D` 的作用只是把画布进行平移变换，让画面反方向动起来，这样视窗就看到画面向前运动了。如下:

![Camera2D在画布上移动](https://user-images.githubusercontent.com/16240729/228217992-1e446043-8ddd-4faf-8b1a-9e4edfd2289c.gif)

![Camera2D移动画布](https://user-images.githubusercontent.com/16240729/228217976-6df97a44-615c-43e6-8c11-2ac8acfbfd01.gif)

而画布的移动是通过 `viewport.canvas_transform` 属性来改变的，也就是说 `Camera2D` 做的仅是自动计算人物的位置，然后更新 `viewport.canvas_transform` 的值。

#### 具体实现

了解了 `Camera2D` 的原理，就可以通过下面的代码计算当前视窗内画面的位置信息了。

```python
  # 当前平移的距离取反就算出了 Camera 的等价平移距离
	var origin = - get_viewport().canvas_transform.origin
  # 视窗的大小
	var width = abs(get_viewport_rect().size.x)
  # 最左边边界的X坐标
	var minX = origin.x
  # 最右边的边界X坐标
	var maxX = origin.x + width
```

下一步，需要把点位置位于最左边边界左侧的点移除。这里需要注意的是，如果一个点在边界左边，一个点在边界右边(也就是视窗内或视窗右边)，那这两个点形成的曲线会有一部分在视窗内可以被看到，那这时就不能移动边界左边的点。转换一下就是是否要移除当前的点，需要判断下一个点是不是否在边界右边，如果下一个点在边界右边，那就不能移除，其余情况都可以移除。所以可以添加 `removePoints` 函数如下: 

```python
func removePoints(minX: int):
	var index = 0
	for i in curve.get_point_count() - 1:

		if index + 1 > curve.get_point_count() - 1:
			break;

		# 根据下一点所在的位置，判断当前点要不要删除
		var nextPoint = curve.get_point_position(index + 1)
		
		if nextPoint.x > minX:
			# 下一个点在视窗范围右侧，即在视窗范围内或还没进入视窗，则循环结束
			break
		else:
			# 下一个点在视窗范围左侧，说明当前点对视窗范围内的曲线无影响，可以移除
			curve.remove_point(index)
			
			# 移除后，需要注意下一次循环的index的变化
			index -= 1

		index += 1
```

接着需要对原来的 `addPoints` 方法做改造。需要把原来写死只能生成四段曲线的逻辑动态化，确保生成的曲线的最后一个点位于视窗的最右侧边界右边。这里同样会有一个问题，比如说如果我们的曲线的最后一段的两个点分别在边界的两侧，那在下一次生成曲线之前，如果视窗的移动非常快已经越过了最后一个点的位置，那玩家就会看到一段断掉的曲线，即使后面我们很快补上了，玩家也会看到补接的这一过程，这样就不够流畅，所以必须要在右边预留足够的曲线长度，才能在视窗移动不太离谱的情况下，保证玩家见到曲线不断。把 `addPoints` 方法改造如下:

```python
- func addPoints():
+ func addPoints(maxX: int):
+   # 生成的曲线延伸到两屏之后，确保可视区域内的网线不断
+   var lastPointOverX = maxX + abs(get_viewport_rect().size.x) * 2
    ...
-   for i in range(4):
+   while(P0.x < lastPointOverX):
-     P1 = P0 + tangent * rand_range(60,80) # 在切线的方向向量延伸 60-80 单位区间，随机一个数值，作为点 P1 的位置
+     P1 = P0 + tangent * rand_range(100,200) # 在切线的方向向量延伸 100-200 单位区间，随机一个数值，作为点 P1 的位置
      ...
-     var P2 = P1 + P2Direction * rand_range(60, 80)
+     var P2 = P1 + P2Direction * rand_range(100, 200)
    ...
```

然后需要删除原来的在 `_ready` 方法中对 `addPoints` 的调用，添加 `_process` 方法，在每一帧去做点的清理和添加动作。

```python
func _process(delta):
	# 当前平移的距离取反就算出了 Camera 的等价平移距离
	var origin = - get_viewport().canvas_transform.origin
	var width = get_viewport_rect().size.x
	var minX = origin.x
	var maxX = origin.x + width
	
	removePoints(minX)
	
	addPoints(maxX)
```

接着点击右上角运行场景，会发现曲线变得平滑，人物也能在曲线上进行无限的滑动了

![无限地图](https://user-images.githubusercontent.com/16240729/228729561-924714a3-fe22-4ffd-9f08-3a0a651d5724.gif)



