# DeepSeek 提示词包(issue #17 步骤 1)

> 用法:把下面整段发给 DeepSeek,产出 JSON 直接存为 `docs/desktop/dialogues.json`。
> 产出后 agent 按 #17 流程校验(schema + 人设抽查),不合格字段打回重写。
> **当前 `dialogues.json` 由 agent 代拟占位**,每条 `_provenance` 标注 `agent-draft`;DeepSeek 产出后替换并改为 `deepseek`。

--- 以下为提示词正文 ---

你是职场黑色幽默文案写手。为游戏《屎山拆弹专家》的「Windows 桌面聊天叙事壳」写一套消息文案。

## 世界观(30 秒)

2026 年某个周五 16:56,前任架构师老王离职并拉黑了所有人。你接手一张连着生产环境的 Excel 表(VBA 宏 2013 年写的),5 个祖传模块在倒计时,17:00 前拆不完全表爆炸。玩家全程沉默牛马,不发言。

## 联系人与语气(严格遵守)

- **甲方老总 boss**:暴躁金主。短句、感叹号、拿尾款当武器。例:「系统又挂了?尾款别想!」
- **HR hr**:圆滑补刀。称呼亲昵 + 制度条款,先扬后抑。例:「辛苦啦~加班申请单审批人:离职中的老王。」
- **老王 wang**:丧系前架构师,已拉黑。低能耗惜字,黑话藏真心,消息一律发不出去。例:「别发挥。按文档做。」
- **system**:【系统提示】开头,冷静陈述荒诞事实。例:「【系统提示】您的离职交接人已将您拉黑。」
- **player**:只允许出现在开场分镜,且只说「已读/正在输入」级别的话。

## 红线

1. 不给解谜线索(线索只在游戏内手册)
2. 不骂玩家
3. 每条 ≤60 字
4. 结局组不出现「重开吧」元话语

## 产出格式

一个 JSON:`{ "version": "1.0.0", "messages": [...] }`,字段见 schema(dialogues.schema.json),要点:

- `id`:`sb_*`(分镜)/`ep_*`(局内推送)/`ed_<win|fuse|row1..row5>_*`(结局)/`egg_*`(彩蛋)
- `category`:`storyboard`/`push`/`ending`/`tooltip`
- `contact`:见上
- `trigger`:`{"type":"event","event":"<锚点>"}` / `{"type":"time","atSec":N}` / `{"type":"ending","ending":"<结局>"}` / `{"type":"static"}`
- 事件锚枚举:`first_manual_switch` `first_edge_a` `row5_stuck` `row5_stuck_repeat` `fuse_60s` `fuse_30s` `first_defuse` `skill_format_brush` `skill_freeze_pane` `row8_trap`
- push 类必须带 `"interruptible": true|false`

## 两条示例消息

```json
{ "id": "ep_first_manual_switch", "category": "push", "contact": "boss", "text": "翻什么文档!我花钱是让你修表的,不是让你读书的!", "trigger": { "type": "event", "event": "first_manual_switch" }, "orderInGroup": 1, "interruptible": false, "effects": { "sound": "ding", "badge": true } }
{ "id": "ed_row4_02", "category": "ending", "contact": "boss", "text": "差 1024 是态度问题!", "trigger": { "type": "ending", "ending": "row4" }, "orderInGroup": 2, "effects": { "sound": "none", "badge": true } }
```

## 清单(一次给全)

1. 开场分镜 `sb_*`:8–12 条,总阅读时长 ≤25s,叙事线「老王甩文档 → 你提问 → 被拉黑」+ 末条转场提示(双击 Excel)
2. 局内推送 `ep_*`:8–10 条,boss 为主、hr 补刀 1–2 条,覆盖至少 6 个不同锚点;时间锚兜底 ≤2 条
3. 结局 `ed_*`:7 组(win/fuse/row1/row2/row3/row4/row5)× 2–4 条;row4 组突出「账目/钱」、row5 组突出「又双叒挂了」;老王的拒收消息用 wang + `effects.badge:true` 表达
4. 彩蛋 `egg_*`:任务栏图标 tooltip ×2、聊天窗口标题栏 ×1、拒收状态条 ×1、回收站 ×1

--- 提示词正文结束 ---
