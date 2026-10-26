/**
 * 打断档位与节奏常量（docs/desktop/pacing.md 决策稿的代码版）。
 * 与 dialogues.json 的 effects/interruptible 冲突时，一律以本文件（pacing）为准。
 */
export type InterruptTier = 'A' | 'B' | 'C'
export type MessageSound = 'ding' | 'urgent'

/** pacing §1：A 强打断 / B 弱打断 / C 仅红点 */
export const TIER_SPEC: Record<InterruptTier, { toastMs: number; sound: MessageSound | null }> = {
  A: { toastMs: 6000, sound: 'urgent' },
  B: { toastMs: 4000, sound: 'ding' },
  C: { toastMs: 0, sound: null },
}

/** pacing §2 三列表定档，键 = dialogues.json 消息 id */
export const PUSH_TIER: Record<string, InterruptTier> = {
  ep_first_manual_switch: 'B',
  ep_first_edge_a: 'B', // pacing：B→A 待真人试玩定档
  ep_row5_stuck: 'A',
  ep_first_defuse: 'C',
  ep_skill_format_brush: 'C',
  ep_skill_freeze_pane: 'C',
  ep_row8_trap: 'A',
  ep_fuse_60s: 'A',
  ep_fuse_30s: 'B',
  ep_time_160: 'C',
}

export const tierOf = (id: string): InterruptTier => PUSH_TIER[id] ?? 'C'

/** 气泡 / toast 入场动画时长（ms）：超过 300ms 就从「压迫」变「表演」 */
export const ENTER_ANIM_MS = 200
/** 节流窗：任意 15s 内最多 1 条 toast（pacing §3） */
export const THROTTLE_WINDOW_MS = 15_000
/** 每局 toast 上限（pacing §3） */
export const MAX_TOASTS_PER_GAME = 6
/** 熟悉期：开局 0–40s 不出新推送（系统播报与跳过补位除外） */
export const QUIET_UNTIL_SEC = 40
/** 结局气泡吐入间隔（ms，pacing §4） */
export const ENDING_BUBBLE_INTERVAL_MS = 400
/** 首条结局气泡后 EndOverlay 淡入延迟（ms，pacing §4） */
export const ENDING_OVERLAY_DELAY_MS = 800
/** 跳过开场后的补位检查时刻（开局后秒数，pacing §5） */
export const SKIP_FILLER_DELAY_SEC = 8
/** 跳过补位条（pacing §5；文案未进 dialogues.json，暂以常量承载） */
export const SKIP_FILLER = {
  id: 'sys_skip_filler',
  contact: 'system',
  text: '【系统提示】已跳过入职回忆。反正也没人看。',
} as const

/** desktopStore → 音频层的消息提示音事件（仿 lcd:penalty 解耦，避免 audio↔desktop 循环依赖） */
export const MESSAGE_SOUND_EVENT = 'lcd:message'
export interface MessageSoundDetail {
  sound: MessageSound
}
