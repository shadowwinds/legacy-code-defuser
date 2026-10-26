# #31 桌面壳与任务栏验收 · 2026-10-26

- 基准提交：`592cfd749a7d168d72cb7d75bccb2abb41080f6b`。
- 环境：本地 Vite DEV、内嵌 Chromium，1280×720 / 1920×1080。
- 验证范围：#31 原始验收，以及用户追加的单元格批注左侧裁切修复。

## 做了什么

- `DesktopShell.tsx`、`DesktopIcons.tsx`、`desktop.css`：渐变壁纸、三个装饰图标、250ms 开窗淡入及 48px 固定任务栏布局。
- `Taskbar.tsx`：同步引信的秒级时钟、未读总数、聊天开关和鼠标点击时的焦点保护。
- `Taskbar.test.tsx`：使用已有 React 服务端渲染和 Vitest 验证开局可见行为；不新增依赖。新增测试先因组件缺失失败，再实现通过。
- `ExcelShell/excelShell.css`：用户追加要求；批注由向左展开改为向右展开，避免 A 列批注被网格裁切。其余 Excel 业务逻辑不变。

测试文件、批注样式和本目录已在 #31 中提前说明范围扩展。

## 问题与耗时

- 本机 Node 版本管理器的 shim 偶发报告没有活动版本。仅为验证进程指定已安装的 Node 22.23.0 路径后恢复，排查约 2 分钟，未改系统配置或依赖。
- 原版页面的横向滚动条来自 Sheet 入场动画的临时溢出。桌面根容器限制溢出后，两个验收尺寸下均无页面滚动条。
- 批注左侧裁切在基准提交隔离副本中复现：240px 批注范围为 `x=-102..138`。修复后为 `x=125..365`。对照与三个批注回归约 5 分钟；基准页面首次加载额外等待约 4 分钟。

## 验证路径

| 验收项 | 结果与证据 |
|---|---|
| 1. 120 秒时钟同步 | ✅ DEV 设置 `fuseRemaining: 120`，两处同显 `16:58:00`。[同框截图](clock-165800-badge3.png) |
| 2. 自然运行 10 秒 | ✅ 实测 10.0074 秒，两处均为 `16:56:10`，引信为 `229.995`。 |
| 3. 1280×720 完整布局 | ✅ Excel / 状态栏底边 `672`，任务栏顶边 `672`、高度 `48`，页面滚动尺寸 `1280×720`。[截图](clock-165800-badge3.png) |
| 3. 1920×1080 完整布局 | ✅ Excel / 状态栏底边 `1032`，任务栏顶边 `1032`、高度 `48`，页面滚动尺寸 `1920×1080`。[截图](after-1920.png) |
| 4. 未读数与聊天状态 | ✅ `{boss:2,hr:1,wang:0}` 显示 `3`；总数 101 显示 `99+`；总数 0 不显示。点击后 `chatOpen=true`，再次点击关闭；打开时按既有 store 规则清当前联系人未读。 |
| 4. 输入焦点 | ✅ Row2 fx 编辑期间点击聊天图标，`document.activeElement.className` 仍为 `fx-input fx-editing`，编辑内容保留。 |
| 5. 秒级重渲染 | ✅ 临时 `console.count('tb')` 显示每秒两个组件函数调用，符合 DEV StrictMode；MutationObserver 在 10 秒内记录恰好 10 次时钟 DOM 更新（01 至 10），没有随 100ms tick 更新。计数代码已删除。 |
| 6. 开窗动画 | ✅ 浏览器检查实际 CSS 动画 `duration=250`、`fill=none`；暂停于 40ms 截帧时 `opacity=0.250589`，壁纸及三个图标可见。[动画帧](opening-wallpaper.png)。随后恢复正常页面。 |
| 6. 弹层与交互 | ✅ fx 输入、D 列拖拽、格式下拉、Row1 原生下拉及系统播报可用。动画结束后 Excel 容器为 `position:static; z-index:auto; transform:none; filter:none; opacity:1`。系统播报仍相对视口 `right:16px; bottom:56px`。 |
| 7. GDD 时钟要求 | ✅ 任务栏与 Excel 状态栏消费同一引信；通关后均停在 `16:56:50`，后续读取引信仍为 `189.494`。 |
| 追加：批注全文 | ✅ Row4 / Row6 / Row8 均通过真实鼠标悬停验证：240px 批注完整处于网格内，边界均为 `125..365`。[修复前](comment-before-fix.png) / [修复后](comment-fixed-row4.png) |

关键 DEV 输出：

```text
自然走时：taskbar=16:56:10, statusbar=16:56:10
时钟 DOM 更新：[16:56:01, 02, 03, 04, 05, 06, 07, 08, 09, 10]
聊天点击：chatOpen=true, editing=true, focus=fx-input fx-editing
批注回归：Row4 pass=true, Row6 pass=true, Row8 pass=true
通关：status=won, modules=[1:true, 2:true, 3:true, 4:true, 5:true]
```

## 五模块通关冒烟

同一局使用实际 UI，未通过 store 写入拆除状态或推进游戏时间：

1. Row4 G 列输入 `=1024-SUM(G2:G9)`，出现「外包本人吧？」。
2. 选中 Row2，在 fx 栏输入 `=IF(ENV="LOCALHOST", CRASH_NOW(), "SAFE")`，紫色死锁解除。
3. D 列从 72px 拖至 146px，选择「短日期」，通过 Tab 切 Sheet2 查出 `2019-01-03` 对应口令「锟斤拷烫烫烫」，Tab 返回后提交通过。
4. 等待自然进入 `#STUCK!`，在窗口期内选择「重启服务」。
5. Row1 选择「保留合并强行写入」，五个模块均拆除，出现通关弹窗。

[通关截图](smoke-won.png)。

## 自动检查与审查

- `npx tsc --noEmit`：通过。
- `npm test`：4 个测试文件、19 个测试通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- code-review 两路独立审查：Standards 0 项、Spec 0 项；追加批注改动的增量审查均为 0 项。

未扩展聊天浮层、开始菜单、窗口管理等其他票的功能；未进行其他浏览器或主观音效测试。
