/** dialogues.json × dialogues.schema.json 校验器(issue #17 验收):node docs/desktop/validate-dialogues.mjs */
import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('./dialogues.json', import.meta.url), 'utf8'))
const errors = []
const ids = new Set()

const ID_RE = /^(sb|ep|ed_(win|fuse|row[1-5])|egg)_[a-z0-9_]+$/
const CONTACTS = ['boss', 'hr', 'wang', 'system', 'player']
const EVENTS = ['first_manual_switch', 'first_edge_a', 'row5_stuck', 'row5_stuck_repeat', 'fuse_60s', 'fuse_30s', 'first_defuse', 'skill_format_brush', 'skill_freeze_pane', 'row8_trap']
const ENDINGS = ['win', 'fuse', 'row1', 'row2', 'row3', 'row4', 'row5']

for (const [i, m] of (data.messages ?? []).entries()) {
  const at = `messages[${i}](${m.id ?? '?'})`
  if (!m.id || !ID_RE.test(m.id)) errors.push(`${at}: id 缺失或不符合命名正则`)
  if (ids.has(m.id)) errors.push(`${at}: id 重复`)
  ids.add(m.id)
  if (!CONTACTS.includes(m.contact)) errors.push(`${at}: contact 非法`)
  if (!m.text || m.text.length > 80) errors.push(`${at}: text 缺失或超 80 字`)
  const t = m.trigger ?? {}
  if (t.type === 'event' && !EVENTS.includes(t.event)) errors.push(`${at}: 事件锚非法`)
  if (t.type === 'time' && typeof t.atSec !== 'number') errors.push(`${at}: 时间锚缺 atSec`)
  if (t.type === 'ending' && !ENDINGS.includes(t.ending)) errors.push(`${at}: 结局锚非法`)
  if (typeof m.orderInGroup !== 'number' || m.orderInGroup < 1) errors.push(`${at}: orderInGroup 非法`)
  if (m.category === 'push' && typeof m.interruptible !== 'boolean') errors.push(`${at}: push 缺 interruptible`)
  if (m.category === 'ending' && t.type !== 'ending') errors.push(`${at}: ending 类必须挂结局锚`)
  if (m.category === 'storyboard' && !['wang', 'player', 'system'].includes(m.contact))
    errors.push(`${at}: 分镜联系人越界(只允许 wang/player/system)`)
  if (m.contact === 'player' && m.category !== 'storyboard')
    errors.push(`${at}: player 只允许出现在分镜`)
}

// 覆盖率:7 组结局齐全、每组 2–4 条;推送 8–10 条且锚点覆盖 ≥6;分镜 8–12 条
for (const e of ENDINGS) {
  const n = (data.messages ?? []).filter((m) => m.category === 'ending' && m.trigger?.ending === e).length
  if (n < 2 || n > 4) errors.push(`结局组 ${e}: 条数 ${n} 不在 2–4`)
}
const pushes = (data.messages ?? []).filter((m) => m.category === 'push')
if (pushes.length < 8 || pushes.length > 10) errors.push(`局内推送 ${pushes.length} 条,不在 8–10`)
const eventCov = new Set(pushes.filter((m) => m.trigger?.type === 'event').map((m) => m.trigger.event))
if (eventCov.size < 6) errors.push(`事件锚覆盖 ${eventCov.size} <6`)
const sb = (data.messages ?? []).filter((m) => m.category === 'storyboard')
if (sb.length < 8 || sb.length > 12) errors.push(`分镜 ${sb.length} 条,不在 8–12`)
const totalChars = sb.reduce((a, m) => a + m.text.length, 0)
if (totalChars > 12 * 80) errors.push(`分镜总字数 ${totalChars} 超 25s 阅读预算(≈960 字上限)`)

if (errors.length) {
  console.error('校验失败:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}
console.log(`校验全绿:共 ${data.messages.length} 条(分镜 ${sb.length}/推送 ${pushes.length}/结局 ${(data.messages.length) - sb.length - pushes.length - (data.messages.filter((m) => m.category === 'tooltip')).length}/彩蛋 ${data.messages.filter((m) => m.category === 'tooltip').length}),事件锚覆盖 ${eventCov.size}/10,结局 7 组齐全,分镜总字数 ${totalChars}`)
