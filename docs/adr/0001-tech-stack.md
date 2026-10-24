# ADR-0001 · 技术栈：Vite + React + TypeScript + Zustand，部署 GitHub Pages

* **Status**: Accepted
* **Date**: 2026-10-24
* **Deciders**: 项目所有人 + AI 结对助手

## Context

《屎山拆弹专家》是 48 小时纯前端 Demo：零后端、零持久化、零图片资产（CSS/SVG 拟物）、中文 UI。游戏核心是一个 100ms 高频 tick 的倒计时状态机，驱动全局引信与 5 个局部倒计时，UI 需要高仿 Excel 的复杂组件外壳。部署目标为零运维的静态托管。

## Decision

* **构建**：Vite —— 冷启动/热更新快，适配 48h 节奏；原生支持相对路径 `base`，对 GitHub Pages 子路径部署友好。
* **视图**：React + TypeScript —— Excel 外壳组件密度高（Ribbon/网格/fx/状态栏/批注），组件化收益明显；倒计时状态机的惩罚结算、模块判定逻辑复杂，需要类型约束。
* **状态**：Zustand —— 高频 tick 场景下比 Context/Redux 更合适：切片订阅避免整树重渲染，无 Provider 嵌套，样板代码最少。
* **部署**：GitHub Pages + GitHub Actions —— 免费零运维；构建产物为纯静态单页，无路由需求。
* **约束**：无后端、无持久化（刷新即新的一局）；中文 UI；音频用 Web Audio API 合成，零音频文件。

## Consequences

* 倒计时 tick 必须收敛在 store 内部，组件只订阅自己需要的切片，避免 100ms 全树渲染。
* GitHub Pages 无服务端：不做路由、不做 API 代理，`base` 设相对路径。
* 单人局、无存档是有意取舍——「一局一背手册」的短循环符合 KTaNE 体验，也砍掉持久化的开发成本。
* 若未来上移动端，本栈可直接复用，但交互（拖列宽/悬停批注）需重新设计，暂不纳入 demo 范围。
