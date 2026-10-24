# 04 · 资源清单 (Assets Needed)

## 4.1 视觉（纯 CSS/SVG 矢量实现，零图片依赖）

### Excel 2016 经典色板

| 用途 | 色值 |
| :--- | :--- |
| 顶栏主题绿 | `#217346` |
| 工具栏/底色 | `#F3F2F1` |
| 选中单元格边框 | `2px solid #107C41` + 右下角 `6px` 实心拖拽块 |
| 正常（条件格式绿） | 底 `#C6EFCE` / 字 `#006100` |
| 警告（条件格式黄） | 底 `#FFEB9C` / 字 `#9C6500` |
| 报错（条件格式红） | 底 `#FFC7CE` / 字 `#9C0006` |
| 死锁紫（Row2） | 底 `#7030A0` / 白字 |
| 批注框 | 米黄 `#FFFFE1` + 右上角红三角 |
| 装饰灰行（Row6） | 底 `#F2F2F2` / 字 `#808080` |

### 结构性资产

* **SVG 覆盖层**：绘制耦合追踪箭头（蓝线=普通引用，红线=连坐生效中），复刻「追踪从属单元格」。
* **图标**：Lucide-React——格式刷、雪花、软盘、剪贴板。
* **标题栏彩蛋**：`核心业务_最终版_打死勿动.xlsx (未激活的产品)` —— 纯装饰，不参与任何机制。

## 4.2 音效（Web Audio API 合成，零音频文件）

| 事件 | 音效 |
| :--- | :--- |
| 常规操作 | 机械键盘敲击声、鼠标单击/双击声 |
| 系统提示 | Windows XP Chord（叮~），一秒拉满职场 PTSD |
| 错误操作 | Windows Error（咚!） |
| 倒计时 | 嘀嗒声——**切到 Sheet2 后是唯一时间线索**，随全局引信逼近 17:00 而加急 |
| 爆炸 | 蓝屏/报错蜂鸣 |

注意：`AudioContext` 须在用户首次交互后初始化（浏览器自动播放策略）。

## 4.3 代码架构（Vite + React + TypeScript + Zustand，见 ADR-0001）

```
src/
├── useGameEngine.ts      # 100ms 高精度定时状态机，驱动全局引信与 5 个局部倒计时
├── dependencyGraph.ts    # Edge A/B 耦合边定义与惩罚回调
├── randomizer.ts         # 开局随机：口令 5 选 1、倒计时 ±10% 抖动
├── components/
│   ├── ExcelShell.tsx    # 外壳：标题栏、Ribbon、fx 公式栏、网格、状态栏、Sheet 标签栏
│   ├── ManualSheet.tsx   # Sheet2 拟物化《离职交接文档》视图
│   ├── StatusBar.tsx     # 底部状态栏（求和实时显示，Row4 的核心交互面）
│   ├── TrackerOverlay.tsx# SVG 追踪箭头覆盖层
│   └── modules/          # Row1–Row5 各模块的交互与判定逻辑
└── store/                # Zustand store 切片
```

## 4.4 动效清单

| 动效 | 实现 |
| :--- | :--- |
| 数据条平滑收缩 | `transition: width 0.1s linear` |
| 高危单元格抖动 | 倒计时 <10s 触发 `@keyframes cell-shake` |
| 经典弹窗残影 | Game Over 时 Win98/XP 死机弹窗层叠拖拽残影 |
| Tab 切换过渡 | Sheet1/Sheet2 全屏滑动切换，切换瞬间倒计时数字仍走 |
| 死锁紫闪烁 | Row2 `#DEADLOCK!` 状态慢速呼吸闪烁 |
