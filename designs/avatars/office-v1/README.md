# 办公角色头像 v1

2026-10-27，按用户在 #29 实现审查中的授权，使用内置 image_gen 生成四位虚构成年人物。保留已有应用图标，只替换原有 B/H/W/我 等头像占位。

| 文件 | 角色 | 规格 | 体积 |
| --- | --- | --- | --- |
| [boss.webp](../../../src/assets/avatars/boss.webp) | 甲方老总 | 256×256 WebP | 6812 B |
| [hr.webp](../../../src/assets/avatars/hr.webp) | HR 小陈 | 256×256 WebP | 7416 B |
| [wang.webp](../../../src/assets/avatars/wang.webp) | 老王 | 256×256 WebP | 9188 B |
| [player.webp](../../../src/assets/avatars/player.webp) | 玩家 | 256×256 WebP | 7870 B |

共 31,286 B，覆盖 18–34 CSS 像素的高密度显示。生成原图为 1254×1254 PNG；仅做尺寸与 WebP 编码导出，不改构图。原图保留在生成工具输出目录，项目依赖全部为仓库内资源。

初始 128×128 导出会被当前构建器内联到 JS，导致 gzip 超出原桌面化增量预算。最终采用 256×256 独立文件，JS gzip 为 67.89 KB（#29 拉取后基线为 67.76 KB，仅增加约 0.13 KB），相对既有 v1.0 报告的 65.17 KB 仍低于 +15 KB 预算。

使用位置：开场回忆、聊天联系人、消息气泡、Toast、结局时间线。系统通知保留符号，不生成拟人头像。无文案、档位、引擎或游戏逻辑改动。

## 生成提示词

### boss

```text
Use case: illustration-story. Asset type: one square character profile avatar for a fictional Chinese office satire puzzle game with an Excel and Windows desktop interface. Subject: A fictional middle-aged Chinese male client executive, about 48, neatly combed short dark hair, strong square face, stern slightly impatient expression, dark suit jacket and burgundy tie, brick red backdrop. Style: polished editorial digital illustration, simplified bold shapes, soft restrained shading, subtle warm grain, mature and understated workplace humor. Composition: head and upper shoulders only, straight-on portrait centered, face large and legible at 26px, equal padding, full square opaque background with a very subtle gradient; no frame, no text, no letters, no logos, no watermarks, no objects. Original fictional adult, not a real person. Palette limited and readable. This is one avatar, not a sprite sheet, not a collage.
```

### hr

```text
Use case: illustration-story. Asset type: one square character profile avatar for a fictional Chinese office satire puzzle game with an Excel and Windows desktop interface. Subject: A fictional Chinese woman HR colleague, about 30, neat shoulder-length dark hair, round thin glasses, polite composed slight smile, lavender office blouse, muted plum backdrop. Style: polished editorial digital illustration, simplified bold shapes, soft restrained shading, subtle warm grain, mature and understated workplace humor. Composition: head and upper shoulders only, straight-on portrait centered, face large and legible at 26px, equal padding, full square opaque background with a very subtle gradient; no frame, no text, no letters, no logos, no watermarks, no objects. Original fictional adult, not a real person. Palette limited and readable. This is one avatar, not a sprite sheet, not a collage.
```

### wang

```text
Use case: illustration-story. Asset type: one square character profile avatar for a fictional Chinese office satire puzzle game with an Excel and Windows desktop interface. Subject: A fictional Chinese male senior programmer, about 40, tousled short hair, dark rectangular glasses, slight stubble, wry resigned smile, charcoal casual zip jacket, warm slate backdrop. Style: polished editorial digital illustration, simplified bold shapes, soft restrained shading, subtle warm grain, mature and understated workplace humor. Composition: head and upper shoulders only, straight-on portrait centered, face large and legible at 26px, equal padding, full square opaque background with a very subtle gradient; no frame, no text, no letters, no logos, no watermarks, no objects. Original fictional adult, not a real person. Palette limited and readable. This is one avatar, not a sprite sheet, not a collage.
```

### player

```text
Use case: illustration-story. Asset type: one square character profile avatar for a fictional Chinese office satire puzzle game with an Excel and Windows desktop interface. Subject: A fictional Chinese male junior office programmer, about 25, short black hair, slightly tired eyes but determined, sage green casual shirt, muted forest green backdrop. Style: polished editorial digital illustration, simplified bold shapes, soft restrained shading, subtle warm grain, mature and understated workplace humor. Composition: head and upper shoulders only, straight-on portrait centered, face large and legible at 26px, equal padding, full square opaque background with a very subtle gradient; no frame, no text, no letters, no logos, no watermarks, no objects. Original fictional adult, not a real person. Palette limited and readable. This is one avatar, not a sprite sheet, not a collage.
```
