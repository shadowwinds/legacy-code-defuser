import raw from '../../docs/desktop/dialogues.json'
import type { GameStatus, ModuleState } from '../store/engineSlice'

/**
 * 桌面化文案契约的 TS 版（docs/desktop/dialogue-contract.md）。
 * dialogues.json 是唯一真源，只读消费；字段语义以契约文档为准。
 */
export type Contact = 'boss' | 'hr' | 'wang' | 'system' | 'player'
/** 会话列表里的三个联系人（system / player 不进会话列表） */
export type ChatContact = 'boss' | 'hr' | 'wang'
export type Category = 'storyboard' | 'push' | 'ending' | 'tooltip'
export type AnchorEvent =
  | 'first_manual_switch'
  | 'first_edge_a'
  | 'row5_stuck'
  | 'row5_stuck_repeat'
  | 'fuse_60s'
  | 'fuse_30s'
  | 'first_defuse'
  | 'skill_format_brush'
  | 'skill_freeze_pane'
  | 'row8_trap'
export type EndingKey = 'win' | 'fuse' | 'row1' | 'row2' | 'row3' | 'row4' | 'row5'

export interface Trigger {
  type: 'event' | 'time' | 'ending' | 'static'
  event?: AnchorEvent
  /** 自 16:56:00 起的相对秒（240s 引信坐标） */
  atSec?: number
  ending?: EndingKey
  once?: boolean
}

export interface DialogueMessage {
  id: string
  category: Category
  contact: Contact
  text: string
  trigger: Trigger
  orderInGroup: number
  interruptible?: boolean
  effects?: { sound?: 'ding' | 'urgent' | 'none'; badge?: boolean; pin?: boolean }
}

export const MESSAGES: readonly DialogueMessage[] = (raw as { messages: DialogueMessage[] }).messages

const byOrder = (a: DialogueMessage, b: DialogueMessage) => a.orderInGroup - b.orderInGroup

export function getMessage(id: string): DialogueMessage | undefined {
  return MESSAGES.find((m) => m.id === id)
}

/** 开场回忆杀分镜 sb_*，按 orderInGroup 排帧 */
export function getStoryboard(): DialogueMessage[] {
  return MESSAGES.filter((m) => m.category === 'storyboard').sort(byOrder)
}

/** 事件锚对应的局内推送（无文案的锚返回 undefined，如 row5_stuck_repeat） */
export function getPushByEvent(event: AnchorEvent): DialogueMessage | undefined {
  return MESSAGES.find((m) => m.category === 'push' && m.trigger.type === 'event' && m.trigger.event === event)
}

/** 时间锚兜底推送，按 atSec 升序 */
export function getTimeAnchors(): DialogueMessage[] {
  return MESSAGES.filter((m) => m.category === 'push' && m.trigger.type === 'time').sort(
    (a, b) => (a.trigger.atSec ?? 0) - (b.trigger.atSec ?? 0),
  )
}

/** 结局组对话，按 orderInGroup 排序 */
export function getEndingGroup(ending: EndingKey): DialogueMessage[] {
  return MESSAGES.filter((m) => m.category === 'ending' && m.trigger.ending === ending).sort(byOrder)
}

/** 彩蛋 tooltip 文本（egg_*）；缺失返回空串 */
export function getTooltip(id: string): string {
  return MESSAGES.find((m) => m.category === 'tooltip' && m.id === id)?.text ?? ''
}

/** 联系人展示信息（proto.html 场景 B 基线） */
export const CONTACT_META: Record<Contact, { name: string; subtitle: string; avatar: string; color: string }> = {
  boss: { name: '甲方老总', subtitle: '张总(金主爸爸)', avatar: 'B', color: '#c0392b' },
  hr: { name: 'HR 小陈', subtitle: '人力·暖心补刀', avatar: 'H', color: '#8e44ad' },
  wang: { name: '老王', subtitle: '已拉黑 · 消息未送达', avatar: 'W', color: '#555' },
  system: { name: '系统通知', subtitle: '', avatar: '!', color: '#777' },
  player: { name: '我', subtitle: '', avatar: '我', color: '#3a5f3a' },
}

export const CHAT_CONTACTS: readonly ChatContact[] = ['boss', 'hr', 'wang']

export const isChatContact = (c: Contact): c is ChatContact => c === 'boss' || c === 'hr' || c === 'wang'

/**
 * 终局 → 结局锚（GDD 06 §6.3）：与引擎判定同序——won → win；引信归零 → fuse（tick 里引信优先）；
 * 否则取首个归零未拆模块 → rowN。对局中返回 null。
 */
export function endingOf(s: { status: GameStatus; fuseRemaining: number; modules: readonly ModuleState[] }): EndingKey | null {
  if (s.status === 'playing') return null
  if (s.status === 'won') return 'win'
  if (s.fuseRemaining <= 0) return 'fuse'
  const dead = s.modules.find((m) => !m.defused && m.remaining <= 0)
  return dead ? (`row${dead.row}` as EndingKey) : 'fuse'
}
