# 原创办公应用图标 · v1

2026-10-26，按用户要求调用内置 image_gen 工具生成。未将官方图片作为输入或底图，仅参考应用类别与桌面图标的视觉语言。

| 文件 | 用途 | 规格 |
|---|---|---|
| [spreadsheet.png](../../../src/assets/icons/spreadsheet.png) | 虚构表格应用：青绿色台账、金色表头 | 1254×1254，RGBA PNG，透明背景 |
| [workplace-chat.png](../../../src/assets/icons/workplace-chat.png) | 虚构办公聊天：蓝色底、米白消息卡片、金色菱形 | 1254×1254，RGBA PNG，透明背景 |

两枚图标统一圆角和轻立体质感，保留表格及办公聊天的通用语义，采用独立构图。避免 Excel 的 X 字母面板、绿色叠片，以及企业微信的蓝色轮廓气泡与四色水滴组合。

参考来源：

- [Microsoft Design：Office 图标设计说明](https://microsoft.design/articles/redesigning-the-office-app-icons-to-embrace-a-new-world-of-work/)
- [腾讯企业微信官方 App Store 页面](https://apps.apple.com/cn/app/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1/id1189898970?mt=12)

素材放在 `src/assets/icons/`，供桌面、任务栏和开场图标共享引用；打包时由 Vite 生成资源路径，兼容子路径部署。未进行商标检索或法律审核，不据此承诺零侵权风险。完整生成提示词见 [prompts.md](prompts.md)。
