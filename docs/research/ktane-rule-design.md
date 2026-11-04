# KTaNE 式规则设计调研：手册固定、炸弹每局不同

> 调研票：#41（地图 #39 · v2.0「每局都得查手册」）· 2026-11-04
>
> 问题：*Keep Talking and Nobody Explodes*（下称 KTaNE）的手册为什么能做到「手册不变、炸弹每局不同、每局都得查，但查得到、背得住」？哪些手法能直接搬进本作（Excel 外壳变量 + 职场黑话手册）？

**标注约定**：正文里 **【源】** 表示一手来源原文或代码写明的事实，**【推断】** 表示本文作者从来源里归纳出的结论，来源本身没有这么说。英文引文保留原文。

## 0. 结论速览

1. KTaNE 每局的变化**主要来自模块自身的随机外观**（线的数量和颜色、按钮颜色和文字、键盘符号、显示屏单词），外壳信息（edgework）只是少数规则里的「二级开关」：11 个常规模块里只有 4 个读外壳，Wires 的 17 条规则里也只有 3 条读外壳。
2. 规则统一写成「**按肉眼可数的特征先分节 → 有序条件、首条命中 → 兜底**」，所以每次只有一个答案，而且从上往下扫就能定位。
3. 外壳变量都被压成**一眼可判的二值谓词**（末位奇偶、含不含元音、电池是否 >1 节、某个标签的指示灯亮没亮、有没有并口）。外壳上还有大量没有任何规则引用的噪声，玩家必须先查手册才知道该看哪一项。
4. 设计者唯一公开讲过的相关原则是**规则必须绝对无歧义**、**操作简单，难点在决策**（GDC 2016）。关于「可背但不能无脑背」的平衡，我**没有找到** Steel Crate 的直接论述，第 4 节的复杂度梯度是从手册结构推断出来的。

## 1. 外壳信息（edgework）：有哪些、取值空间多大

### 1.1 手册怎么说

- 【源】手册总则要求玩家主动收集外壳信息：「Some disarming instructions will require specific information about the bomb, such as the serial number. This type of information can typically be found on the top, bottom, or sides of the bomb casing. See Appendix A, B, and C for identification instructions」[M p3]
- 【源】手册用三个附录教玩家**认外壳**，附录里没有任何规则：附录 A 列 11 个指示灯标签 `SND CLR CAR IND FRQ SIG NSA MSA TRN BOB FRK`；附录 B 列 AA 和 D 两种电池；附录 C 列 6 种端口 `DVI-D / Parallel / PS/2 / RJ-45 / Serial / Stereo RCA` [M p21–23]。
- 【源】只有需要外壳的模块，才会在开头写交叉引用。例如 The Button 写「See Appendix A for indicator identification reference. See Appendix B for battery identification reference.」[M p6]，Complicated Wires 引用了附录 B 和 C [M p13]。

### 1.2 取值空间（官方 modkit 测试桩）

手册没有写取值范围。Steel Crate 官方 modkit 的 TestHarness 用来在编辑器里模拟炸弹外壳，下面这些数据都取自它的代码 [MK]。**注意**：这是给 mod 作者用的模拟器，不是游戏本体的生成器，正式关卡（mission）还可以单独配置外壳。

| 外壳项 | 测试桩生成规则【源 MK】 | 被原版规则引用的谓词【源 M】 |
| :--- | :--- | :--- |
| 序列号 | 6 位，固定格式：第 1–2 位字母或数字，**第 3 位数字**，第 4–5 位字母，**第 6 位数字**。字符集排除了 `O` 和 `Y`（`O` 的位置填了重复的 `E`） | 末位奇/偶（Wires、Complicated Wires）；含不含元音（Simon Says） |
| 小部件 | 序列号之外再放 **5 个**部件，每个以 1/3 概率是端口板、指示灯或电池盒 | — |
| 电池 | 每个电池盒装 1 或 2 节，全炸弹合计 0–10 节 | 电池 >1、>2（Button）；≥2（Complicated Wires） |
| 指示灯 | 从 11 个标签里**不重复**抽取，60% 概率点亮 | 点亮的 `CAR`、点亮的 `FRK`（Button） |
| 端口板 | 二选一：一类是 {Parallel, Serial} 的子集，另一类是 {DVI, PS2, RJ45, StereoRCA} 的子集，每个端口 50% 出现，可能是空板 | 有没有 Parallel（Complicated Wires） |

- 【源】序列号去掉 `O`，是因为游戏字体里大写 O 和数字 0 分不清，玩家快速念序列号时会产生歧义：「they wound up removing all capital Os from serial numbers in the game」[GD]
- 【推断】固定格式保证了第 6 位永远是数字，所以「the last digit of the serial number」永远有定义，而且就是最后一个字符，不用数。去掉 `Y` 大概是为了避开「Y 算不算元音」的争议，但来源没有说明原因。
- 【推断】外壳上的噪声很多：手册列了 11 个指示灯标签和 6 种端口，原版规则只用到 2 个标签（CAR、FRK）和 1 种端口（Parallel）。玩家没法把整块外壳背下来，只能先查手册，才知道这个模块该看哪一项。

### 1.3 原版各模块怎么引用外壳

| 模块 | 读外壳？ | 读了什么【源 M】 |
| :--- | :--- | :--- |
| Wires | 是 | 4/5/6 根线的**第一条**规则都要求「序列号末位是奇数」；3 根线不读外壳 |
| The Button | 是 | 7 条规则里第 2、3、4 条读电池数和指示灯；松手时机读的是**倒计时数字**（实时状态） |
| Complicated Wires | 是 | 5 种指令里有 3 种（S/P/B）分别读序列号末位偶数、并口、电池 ≥2 |
| Simon Says | 是 | 序列号含不含元音决定用哪张表；表内的行由**当前失误次数**决定（实时状态） |
| Keypad / Who's on First / Memory / Morse / Wire Sequences / Mazes / Password | 否 | 只看模块自身（Memory 还要看前几阶段自己按过什么） |

- 【推断】KTaNE 让每局不同，靠的是「**模块自身的随机外观** × **少量外壳开关** × **局内实时状态**（倒计时、失误数、前几阶段的历史）」三层叠加，不是靠外壳单独撑起来的。
- 【推断】这和地图 #39 的验收条件「每个分支至少依赖 1 个外壳变量」对比，**本作的要求比 KTaNE 更严**。v1 的问题恰好出在第一层：模块外观永远一样，比如 fx 栏永远写 `"PRODUCTION"`、对账目标永远是 1024。只补外壳变量、不让模块外观随机，可能会出现「外壳变了但答案空间仍然很小」的情况。

## 2. 规则复杂度分布

按原版手册逐条清点 [M p5–20]（模块图片的数量取自官方网页版手册 [MW] 的 `<img>` 统计）：

| 模块 | 规则形态 | 规模 | 读外壳 |
| :--- | :--- | :--- | :--- |
| Wires | 先按线数分 4 节，每节一组有序 if/otherwise | 3/4/5/6 根线分别 4/5/4/4 条，共 **17 条** | 3 条 |
| The Button | 有序规则「Perform the first action that applies」，加一张松手表 | 7 条 + 4 种色条 | 3 条 |
| Simon Says | 两张表（含/不含元音），表内按失误数分行 | 2 × 3 × 4 = **24 格** | 选表 |
| Complicated Wires | 4 个二值特征组成的韦恩图 → 16 个区域 → 5 种指令 | 16 区 / 5 指令 | 3 种指令 |
| Memory | 5 个阶段 × 4 种显示 | **20 条**，引用自身历史 | 否 |
| Wire Sequences | 3 种颜色 × 第 1–9 次出现，次数跨面板累计 | 27 格 | 否 |
| Keypad | 6 列符号，每列 7 个，找出同时含 4 个符号的那一列 | 42 格，27 种不同符号 | 否 |
| Morse Code | 解码摩斯码 → 16 个单词对应 16 个频率 | 16 行 + 字母表 | 否 |
| Who's on First | 第 1 步：28 种显示 → 按钮位置；第 2 步：28 个单词各对应一个 14 词优先级列表 | 28 + 28 × 14 = **420 词** | 否 |
| Mazes | 9 张迷宫图，按圆形标记匹配 | 9 张 | 否 |
| Password | 35 个五字母单词 | 35 词 | 否 |

- 【源】社区维护的模块仓库给原版模块打了难度分：Wires、The Button、Keypad、Simon Says、Complicated Wires 都是 VeryEasy；Who's on First、Password、Mazes 是 Easy；Morse Code 对拆弹者是 Medium；Wire Sequence 对专家是 Medium [REPO]。这个评分是相对于数千个 mod 模块的，原版整体都偏简单，只能看相对高低。
- 【推断】**「记几次就会」和「每次都得查」的分界，在于规则条数和条件能不能用语言复述**：
  - **可背型**（Wires 17 条、Button 7 条、Complicated Wires 5 个字母）：条件都是「数量/颜色/有没有」这种能说出口的谓词。老玩家背下来的是**规则**，不是答案，因为答案还取决于本局的线和外壳。
  - **必查型**（Who's on First 420 词、Keypad 27 种怪符号、Mazes 9 张图、Password 35 词）：靠表的体积，或者靠「不可言说」（符号没有名字、迷宫墙看不见），把记忆成本推到不值得背。
  - 同一本手册里两类模块**混编**，所以老手翻手册的速度会提升，但手册没法彻底扔掉。
- 【推断】**局内动态变量**是 KTaNE 让「背规则」也不够用的另一个手段：Button 的松手时机要看倒计时上有没有出现某个数字，Simon 的映射会随失误次数切换，Memory 要记前几阶段的操作。就算答案在开局时就确定了，执行中途还要再判断一次。

## 3. 手册排版手法

- 【源】**每模块一页、统一标题**「On the Subject of X」，页眉有模块名和模块图标 [M][MW]。
- 【源】**笑话只放在第一段导语**，后面的规则一律平实。例如 Wires 开头是「Wires are the lifeblood of electronics! Wait, no, electricity is the lifeblood…」，规则正文却是干巴巴的「If there are no red wires, cut the second wire.」[M p5]
- 【源】**导语之后先用方框写清约定**，再写规则：「A wire module can have 3-6 wires on it… Wire ordering begins with the first on the top.」[M p5]；Memory 写「Button positions are ordered from left to right.」[M p11]
  - 【源】设计者在 GDC 讲过，规则「cut the second wire」曾经没写清从上数还是从下数，「Steel Crate had assumed it was obvious, but in practical testing they discovered it wasn't」[GD]。【推断】方框里的顺序约定，就是这类问题修完后留下的写法。
- 【源】**两种首条命中写法**：
  - 编号列表加显式指令：「Follow these rules in the order they are listed. Perform the first action that applies」，最后一条写「If none of the above apply…」兜底 [M p6]。
  - 「If… Otherwise, if… Otherwise, cut the last wire.」链式写法，最后一句无条件兜底 [M p5]。
- 【源】**先按肉眼可数的东西分节**：Wires 按线数分「3 wires: / 4 wires: / …」[M p5]，Memory 按阶段分「Stage 1: … Stage 5:」[M p11]，Simon 按「If the serial number contains a vowel / does not contain a vowel」分成两张表 [M p8]。
- 【推断】**表达形式和数据形状对应**：线性决策用有序列表（Wires、Button）；两个维度的映射用表格（Simon、Wire Sequences）；4 个独立二值特征用韦恩图加字母图例（Complicated Wires）；没有名字的视觉元素用图片矩阵（Keypad、Mazes）；字典型数据用词表（Password、Who's on First）。KTaNE 没有用流程图。
- 【源】手册有版本号和校验码：封面写「Version 1 / Verification Code: 241」[M p1][BM]。
- 【源】手册的网页排版被开发者视为谜题的一部分：「The manual, and its layout and browser compatibility, is hugely important piece of the puzzle.」——Ben Kane [IGF]

## 4. 设计者关于「可背但不可无脑背」的公开论述

**找到的**（都来自 Ben Kane 在 GDC 2016 独立游戏峰会的演讲「Designing Asymmetric Gameplay For *Keep Talking and Nobody Explodes*」。GDC Vault 只公开了摘要 [GDC]，演讲内容取自 Game Developer 的现场报道 [GD]）：

- 【源】议题摘要：「Hear about our efforts to balance approachability and challenge」[GDC]
- 【源】规则无歧义：「The rules have to be totally unambiguous… If players are forced to guess, or feel forced to guess, they're either going to be wrong and feel cheated, or be right and feel unsatisfied, which is just as bad.」[GD]
- 【源】操作简单，难点在决策：「We require simple and deliberate inputs… The decision-making is the hard part….this ensures that the conversation doesn't stray from team thinking… to blaming a player for their execution.」[GD]
- 【源】失败要让玩家看得出是自己的错：「players should see any moments where they fail in your game as their own fault」[GD]（这句是报道的转述）。
- 【源】有一套看玩家表现的节奏系统：表现好时触发干扰事件（关灯、闹钟），目标是「We don't want to accelerate a death spiral; we want people to get those really exciting moments, where they defuse the bomb with two seconds left」[GD]
- 【源】这类问题靠「偷听」试玩发现，玩家自己不会报告：「none of these groups ever told us this was a problem… It was only because we were eavesdropping on them that we caught this.」[GD]

**没找到的**：Steel Crate 关于「手册该多大才不会被背下来」「外壳信息出现频率怎么定」的直接论述。社区后来做了 Rule Seed Modifier，用种子重新生成整本手册的规则（「Ever wish you could change the rules you play the modules under?」）[RS]。【推断】这说明固定手册最终还是会被老玩家背下来，KTaNE 并没有在原版里彻底解决这个问题。好在本作的目标是「照搬上局**答案**通不过」，不是「规则背不下来」（见 GDD 2.7「背手册的成长感」），和 KTaNE 的状态一致。

## 5. 对验收指标的一个换算【推断】

地图 #39 要求「照搬上局答案通关率 < 20%」。假设单个模块的正确答案在 k 种结果间分布，概率分别为 p₁…p_k，那么照搬上局答案在本局仍然正确的概率是 Σpᵢ²：

- 3 个等概率分支：1/3 ≈ 33%，**单模块达不到 20%**；5 个等概率分支：20%；分支概率不均时会更高。比如 70/15/15 的分支，碰撞率约 54%。
- 通关要 5 个模块全对，模块之间独立时，整局碰撞率是各模块碰撞率的乘积，所以整局目标很容易达到。但玩家可以只对没碰上的模块重新查手册，所以**真正该盯的是单模块的碰撞率**，并且要让每个分支的出现概率接近均匀。KTaNE 的谓词大多接近 50/50，比如末位奇偶 1/2、指示灯点亮 60%。

## 6. 可直接套用到本作的设计原则

1. **外壳变量是开关，变化的主力是模块自身的随机外观。** 每个模块先让自己的表面每局不同（fx 栏里的环境串、G 列垃圾数据、合并区域的形状、乱码日期），再用 1 个外壳变量切换规则分支。只靠外壳变量撑 ≥3 个分支，答案空间往往太小。
   *出处*：原版 11 个常规模块里只有 4 个读外壳，Wires 17 条规则里只有 3 条读外壳 [M p5–16]；第 1.3 节。

2. **每个模块的手册小节都写成「按可见特征分节 → 有序条件、首条命中 → 无条件兜底」。** 第一层用玩家在模块里一眼能数出来的东西分节（比如报错类型、行数），每节内按优先级写「若…；否则若…；否则…」，最后一句无条件兜底，保证永远恰好一个答案。
   *出处*：Wires 按线数分节加 Otherwise 链 [M p5]；Button「Perform the first action that applies」「If none of the above apply」[M p6]。

3. **外壳变量在规则里只以「一眼可判的谓词」出现，生成格式要保证谓词永远有定义、字形无歧义。** 比如「文件名版本号末位是奇数」「作者栏含"王"字」「修订次数 >10」「任务栏显示周五」。版本号的格式要固定，末位必须是数字；生成时去掉 `0/O`、`1/l/I` 这类容易混淆的字形。各谓词的真假概率尽量接近一半。
   *出处*：序列号固定格式，去掉 `O`/`Y`[MK]；去 `O` 的原因 [GD]；谓词形态 [M p5, p6, p8, p13]。

4. **外壳要有噪声，手册要有一份「去哪找」附录。** 【文件 → 信息】面板可以多放几个没有规则引用的字段，玩家必须先查手册才知道该看哪一项。手册单设一个附录，类似 KTaNE 的附录 A/B/C，只讲每个外壳变量在 Excel 的哪个原生位置、长什么样，不写任何规则。读外壳的模块小节开头写一句交叉引用（「本节需查附录 C：标题栏版本号」），同时提示玩家这个模块要看外壳。
   *出处*：「Gathering Information」总则与附录 A/B/C [M p3, p21–23]；Button、Complicated Wires 的「See Appendix…」[M p6, p13]；11 个标签只用 2 个，6 种端口只用 1 种 [M]。

5. **黑话只放在导语和附录，条件句本身零歧义。** 每个小节第一句可以用老王的黑话吐槽，条件句要平实；必须用的黑话词（比如「颗粒度」「闭环」）在附录对照表里一对一映射到具体的 Excel 位置或数值。每个小节开头用一个约定框写清计数方向、行列编号这类默认约定。这对现行 GDD 3.3「黑话写在条件句里」是一个修正。
   *出处*：Wires 导语抖机灵、正文平实 [M p5]；「Wire ordering begins with the first on the top」[M p5]；「The rules have to be totally unambiguous…」与「second wire」事故 [GD]。

6. **难点放在查和判，操作保持简单。** Excel 动作（下拉、改 fx、填数）保持单步、可预期，不加精确拖拽或限时连击这类手法考验；复杂度全部放进规则判定。玩家失败时应该能看出是「我查错/判错了」，不是「我没点准」。
   *出处*：「We require simple and deliberate inputs… The decision-making is the hard part」；「players should see any moments where they fail… as their own fault」[GD]。

7. **5 个模块混编「可背型」和「必查型」。** 2–3 个模块用小规则集（每节 3–5 条谓词），几局后玩家能背下规则，但答案仍随外壳和外观变化，提供成长感。1–2 个模块用大表，比如口令表扩成按外壳变量二维查找，或者用不可言说的符号或单元格样式匹配，保证老手也得翻手册。
   *出处*：Wires 17 条、Button 7 条对比 Who's on First 420 词、Keypad 27 种符号、Mazes 9 张图 [M p5–16]；社区难度评分 [REPO]；第 2 节。

8. **至少一个模块读局内实时状态。** 本作的全局时钟 16:56–17:00 和已拆模块数，都可以充当 KTaNE 里倒计时数字和失误次数的角色。例如「时钟秒位含 5 时再提交」，或者「已拆 ≥2 个模块时改用另一列」。这样即使开局就背好了答案，执行中途还要再判断一次，也和 Row5 的打断节奏契合。
   *出处*：Button 松手看「the countdown timer has a 4 in any position」；Simon 按「No Strikes / 1 Strike / 2 Strikes」分行 [M p6, p8]。

## 来源

- **[M]** Steel Crate Games, *Bomb Defusal Manual*, Version 1, Verification Code 241（PDF，23 页）：https://www.bombmanual.com/manual/1/pdf/Bomb-Defusal-Manual_1.pdf
- **[MW]** 同一手册的官方网页版：https://www.bombmanual.com/web/index.html
- **[BM]** 官方手册首页：https://www.bombmanual.com/
- **[GDC]** Ben Kane, "Designing Asymmetric Gameplay For 'Keep Talking and Nobody Explodes'", GDC 2016 Independent Games Summit（GDC Vault 摘要）：https://gdcvault.com/play/1023471/Designing-Asymmetric-Gameplay-For-Keep
- **[GD]** Game Developer, "Finding the fun in bomb defusal with *Keep Talking and Nobody Explodes*"（上述 GDC 演讲的现场报道）：https://www.gamedeveloper.com/design/finding-the-fun-in-bomb-defusal-with-i-keep-talking-and-nobody-explodes-i-
- **[IGF]** Game Developer, "Road to the IGF: Steel Crate Games' *Keep Talking and Nobody Explodes*"（Ben Kane / Brian Fetter / Allen Pestaluky 访谈）：https://www.gamedeveloper.com/design/road-to-the-igf-steel-crate-games-i-keep-talking-and-nobody-explodes-i-
- **[MK]** Steel Crate Games 官方 modkit，TestHarness 外壳生成代码（commit `e379d86`）：
  - https://github.com/keeptalkinggame/ktanemodkit/blob/e379d86e12d1d6409c228b84ca9a74deffa15c99/Assets/TestHarness/Widgets/SerialNumber.cs
  - https://github.com/keeptalkinggame/ktanemodkit/blob/e379d86e12d1d6409c228b84ca9a74deffa15c99/Assets/TestHarness/Widgets/BatteryWidget.cs
  - https://github.com/keeptalkinggame/ktanemodkit/blob/e379d86e12d1d6409c228b84ca9a74deffa15c99/Assets/TestHarness/Widgets/IndicatorWidget.cs
  - https://github.com/keeptalkinggame/ktanemodkit/blob/e379d86e12d1d6409c228b84ca9a74deffa15c99/Assets/TestHarness/Widgets/PortWidget.cs
  - https://github.com/keeptalkinggame/ktanemodkit/blob/e379d86e12d1d6409c228b84ca9a74deffa15c99/Assets/TestHarness/TestHarness.cs（`SetupEdgework`：序列号 + 5 个随机部件）
- **[REPO]** 社区维护的 Repository of Manual Pages（原版模块难度评分，数据见 `json/raw`，社区来源，可信度低于官方）：https://ktane.timwi.de/
- **[RS]** Rule Seed Modifier（社区 mod）：Steam Workshop https://steamcommunity.com/sharedfiles/filedetails/?id=2037350348 · API 文档 https://github.com/CaitSith2/KTANE-mods/wiki/RuleSeedModifier
