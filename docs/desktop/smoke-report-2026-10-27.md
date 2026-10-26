# 桌面化全链路冒烟报告 · 2026-10-27(issue #37,T8)

> 覆盖 GDD 06 §6.7 第 1–4、6 条(第 5 条真人试玩打扰度归 #19,不在本图)。
> 执行图:#29(T0–T8 全部合入,提交 95641d3…7865b6f)。

## §6.7 逐条结果

### 1. 开局 ≤25s 完成回忆杀或跳过,转场无白屏断裂;二局不再播 ✅

- 新访客(清空 localStorage)完整播放:Excel 挂载于 **24.54s**(≤25s),挂载瞬间 `fuseRemaining = 240`、`gameStartedAt` 落定(开场期间引信零消耗)。
- 转场连续性:T1 已用 rAF 采样验证白层 opacity 全程 1、无 intro/游戏双缺失空白帧。
- 二次进站(刷新):`intro-root` 不出现,直接进桌面。

### 2. 局内 toast 密度符合节流;全程无视推送通关,无机制惩罚 ✅

一局完整时间线(DEV 辅助拆 1/2/4 号模块以越过解谜输入,其余全走真实引擎路径):

| 时刻(elapsed) | 事件 | toast |
|---|---|---|
| 0–40s | 熟悉期 | 0 条 |
| 45s | Row5 自然假死 | ep_row5_stuck **A** |
| 46s | 窗口内重启服务(performRitual) | — |
| 63s | 引信进决战期 | ep_fuse_60s **A** |
| 80s | 引信 30s | ep_fuse_30s **B** |
| 81s | 第 5 拆 → 通关 | toast 全清,结局视图 + Win98 弹窗 |

- toast 总数 **3 ≤ 6**;相邻间隔 **17.9s / 17.5s ≥ 15s**(全程未触碰节流状态,decideTier 自然行为)。
- 全程未点任何 toast / 聊天,通关不受影响(§6.7-2)。
- 节流降 C 逐案验证见 #33/#34 关票记录(edge_a 后 5s 内的 fuse_60s 自动降 C 等)。

### 3. 7 组结局按凶手模块正确触发;老王永远拒收 ✅

7 组结局在 DEV 逐组触发(row1–row5 / fuse / win),每组核对:气泡按 orderInGroup、400ms 节奏、首条后约 800ms EndOverlay 淡入、结局视图与弹窗不重叠(1280×720 与 1920×1080 双视口)、pointer-events none、终局瞬间 toast 清空 + 聊天隐藏、重新开始可用。数据表见 #35 关票评论。

老王拒收:聊天浮层 wang 会话底部红色拒收条**任何操作下常驻**(T3 验收 4),结局视图不显示拒收条(设计)。

- 注:7 组为 DEV 触发;线上真实路径至少验证 fuse(引信烧尽)一组,见「线上冒烟」。

### 4. 任务栏时钟与引擎引信同步;聊天收起时 Excel 完整可见 ✅

- 双时钟同源 `fuseRemaining`:elapsed 46s 时任务栏与状态栏同显 **16:56:46**;对表走时偏差 < 1s。
- 聊天收起(`closeChat()`)后 Excel 网格 / Sheet 标签 / 状态栏完整可见,见截图 `t8-excel-full-chat-closed.png`。

### 6. 全 CSS/SVG 零美术资产;生产包零音频文件;中文 UI ⚠️(一项已知偏离)

- 生产包 `dist/assets`:**零音频文件** ✅;JS gzip 67.79KB(基线 65.17KB,**增量 +2.62KB ≤ 15KB 预算**)✅。
- **偏离**:T2 关票后的提交 fd8dfa6(用户决策)引入两张原创 PNG 图标共 2.4MB,与「零美术资产」冲突。本票不回退用户决策,已列入 [lighthouse-2026-10-27.md](../lighthouse-2026-10-27.md) 与 #37 报告,建议另开 issue 压缩或回退。
- 中文 UI:全部截图核对无英文泄漏 ✅。

## 性能预算

| 预算项 | 结果 |
| :--- | :--- |
| 无 >50ms long task | ✅ PerformanceObserver 实测高压序列(3 条 toast + 开关聊天 ×2 + 双切 Sheet + 跳引信 + 结局渲染):0 条 longtask |
| 动画只用 transform/opacity | ✅ `grep` 审计 desktop/*.css + narrowScreen/systemBroadcast 全部 keyframes,无 width/height/top/left 过渡 |
| 时钟 60s ±1s | ✅ 双钟同源引信,elapsed 46s 精确显示 16:56:46 |
| JS gzip 增量 ≤15KB | ✅ +2.62KB(65.17 → 67.79) |
| Lighthouse 桌面 Performance ≥95,其余不低于基线 | ✅ 100 / 100 / 100 / 100(a11y 还高于基线 95),见 [lighthouse-2026-10-27.md](../lighthouse-2026-10-27.md) |

> 说明:Chrome Performance 面板人工录屏不可用(无头环境),以页面内 PerformanceObserver longtask 观测替代;「开局 0–60s」整段由上方冒烟局覆盖(83s 全程含 3 toast + 聊天开关 + 结局)。

## 收尾改动(T8 本票)

1. **窄屏降级覆盖桌面壳**:NarrowScreenNotice 从 ExcelShell 挪到 App 顶层(IntroGate 兄弟节点),z 1000→3500;实测 480px 视口下提示覆盖开场动画(z 序:提示 3500 > 白闪 3000 > 开场 2500),见 `t8-narrow-screen.png`。
2. **SystemBroadcast 避让**:实测任务栏 48 + Sheet 标签 26 + 状态栏 24,`bottom: 56px → 106px`;改前气球压住两栏(`t8-broadcast-before.png`),改后留 8px 间隙(`t8-broadcast-after.png`,气球底 614 < 标签顶 622)。
3. **a11y 小修(<20 行边界)**:intro-skip-hint 对比度、intro-frame-bar aria-hidden(Lighthouse 85→100,详见 lighthouse 报告)。

## 线上冒烟

- 部署:push main → GitHub Actions「Deploy to GitHub Pages」成功(run 40373664216)。
- 线上地址:https://shadowwinds.github.io/legacy-code-defuser/?intro=1
- 核对项见 #37 关票评论(开场、开局、系统播报、fuse 结局)。

## 截图清单(docs/desktop/smoke-2026-10-27/)

| 文件 | 内容 |
| :--- | :--- |
| t3-chat-boss.png | T3 聊天浮层 boss 会话:3 气泡+已读+输入提示消失(1280×720) |
| t3-chat-wang.png | T3 老王会话:分镜历史+红色回执+拒收条(与爆炸弹窗同框验证 z 序) |
| t4-toast-a.png | T4 A 档 toast:红边/头像/两行截断(1280×720) |
| t6-ending-row1.png | T6 row1 结局:合并时间线+Win98 弹窗避让(1280×720) |
| t6-ending-fuse-1920.png | T6 fuse 结局:system 灰条首条(1920×1080) |
| t8-broadcast-before.png | T8 广播避让改前:气球压 Sheet 标签与状态栏 |
| t8-broadcast-after.png | T8 广播避让改后:留 8px 间隙 |
| t8-narrow-screen.png | T8 窄屏降级:480px 下覆盖开场动画 |
| t8-excel-full-chat-closed.png | 聊天收起时 Excel 完整可见 + 避让后广播 + 双钟同步 |
