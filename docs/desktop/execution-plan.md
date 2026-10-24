# v1.1 桌面化 · 执行票清单(issue #20 交付,供下次执行图直接派工)

> 规格:沿用 Demo 期三件套(**所有权白名单 + 验证铁律 + 「问题与耗时」汇报**)。
> 依赖链即波次边界;每票 ≤ 一个 100K token 会话可完成。

## 所有权白名单(防冲突)

| 目录/文件 | 归属票 |
| :--- | :--- |
| `src/components/desktop/*`(新建) | T2/T3/T4/T5 |
| `src/audio/*` | T7(扩展现有 tick.ts) |
| `src/components/EndOverlay.tsx` | T6 |
| `src/App.tsx` / `src/store/index.ts` | 仅集成点;merge 冲突按票号顺序由协调者处理 |
| `src/store/slices/*` | T5(新增 desktopSlice);T4 触碰 penaltySlice 广播为只读消费 |
| `docs/desktop/*`(文案/契约) | 只读消费,不修改 |

## 验证铁律(每票完成标准)

1. `npx tsc --noEmit` + `npm run build` 通过
2. `npm run dev` 下浏览器手测票内验收项(截图贴票)
3. 不破坏既有 5 模块通关路径(冒烟:Row4 彩蛋 → Row2 fx → Row3 → Row5 → Row1 仍可通关)

## 汇报格式

每票关票评论附:做了什么 / 遇到的问题与耗时 / 验证路径。

## 执行票(T1→T8)

### T1 · 开场动画(回忆杀)
- 分镜渲染(黑场字幕 + 气泡拟物,读 `dialogues.json` sb_*)、首次进站播一次(localStorage)、点击跳过、≤25s、「双击 Excel」脉冲 → 白闪转场进 ExcelShell
- 消费:dialogues.json / proto.html 场景 A(视觉基线)
- 高危:App.tsx(挂载时序)、main.tsx
- 验收:GDD 06 §6.4 验收 1–2 条

### T2 · 桌面壳 + 任务栏 + 时钟
- 壁纸/桌面图标/任务栏(proto.html 场景 B 基线);时钟消费 `fuseRemaining` 换算 16:56:00 起
- 高危:App.tsx(壳层叠放顺序)、ExcelShell(收起/展开协调)
- 验收:时钟与引信同步;Excel 全屏不遮挡

### T3 · 聊天浮层 + 会话列表 + 拒收条
- 会话(甲方/HR/老王)+ 气泡流 + 老王「拒收」状态条 +「对方正在输入…」+ 玩家仅已读
- 消费:dialogues.json(会话渲染);proto.html 场景 B(基线)
- 验收:GDD 06 §6.7 第 3 条(7 组触发正确、老王永远拒收)

### T4 · Toast 系统 + 打断档位 + 节流窗
- 三档物理表现(pacing §1)、点击跳聊天、15s 节流 + 每局 ≤6 条、0:00–0:40 静默
- 高危:penaltySlice(消费既有 `lcd:penalty` 事件,不改其语义)
- 验收:pacing §2 三列表逐行对档

### T5 · 局内推送接线(事件锚 → 消息)
- 新增 `desktopSlice`:消费引擎既有事实(sheetSlice 首切/penaltySlice 首连坐/row5 stuck/tick 阈值/技能/Row8),映射 dialogues.json ep_*;时间锚兜底 + 跳过补位条
- 高危:store/index.ts(新 slice 注册)
- 依赖:T3、T4
- 验收:10 个事件锚逐一触发(DEV 钩子辅助)、节流生效

### T6 · 结局对话 + EndOverlay 时序
- 终局时结局组气泡 400ms/条吐入 → 0.8s 后 EndOverlay 淡入 → 弹窗下可回看不可交互
- 高危:EndOverlay.tsx(既有 win98 弹窗 #26 的时序协调)
- 依赖:T5
- 验收:7 组结局逐一触发(GDD 06 §6.5 顺序)

### T7 · 消息提示音
- tick.ts 扩展 `ding`/`urgent` 两音(复用 AudioContext 单例,音量 ≤ 嘀嗒,静音全生效)
- 验收:三档音效正确、静音全静

### T8 · 打磨 + 部署
- 性能预算核对(开场动画 + 消息动画 vs 240s tick,§6.7/ Fog 项)、窄屏降级提示覆盖桌面壳、全链路通关冒烟、push 部署 + 线上冒烟
- 验收:GDD 06 §6.7 全条
