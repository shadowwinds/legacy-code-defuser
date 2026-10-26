import { useDesktopStore } from './desktopStore'
import { getMessage, getPushByEvent, getTimeAnchors } from './dialogues'
import type { AnchorEvent, DialogueMessage } from './dialogues'
import { QUIET_UNTIL_SEC, SKIP_FILLER, SKIP_FILLER_DELAY_SEC, tierOf } from './tiers'
import { useGameStore } from '../store'
import type { RootState } from '../store'
import { FUSE_INITIAL_SEC } from '../store/engineSlice'

/**
 * 局内推送接线（T5）：一个 store 订阅 + 一个 lcd:penalty 监听识别全部锚点，
 * 按 pacing 档位调用 desktopStore.deliver。桌面层只读游戏 store 的边界在这里收口。
 */

/** 本局已触发的消息 id（每锚一次；「重新开始」是整页刷新，模块状态天然重置） */
const fired = new Set<string>()
/** 熟悉期（0–40s）攒下的待投递消息，保持触发顺序 */
const pending: DialogueMessage[] = []

const isPlaying = (s: RootState) => s.status === 'playing' && s.gameStartedAt !== null

const elapsedOf = (fuseRemaining: number) => FUSE_INITIAL_SEC - fuseRemaining

const countDefused = (s: RootState) => s.modules.reduce((n, m) => n + (m.defused ? 1 : 0), 0)

function deliverNow(msg: Pick<DialogueMessage, 'id' | 'contact' | 'text'>): void {
  useDesktopStore.getState().deliver(msg, tierOf(msg.id))
}

/** 投递核心：去重 → 熟悉期排队 / 直投（节流由 deliver 内的 decideTier 兜底） */
function fireMessage(msg: DialogueMessage): void {
  if (fired.has(msg.id)) return
  fired.add(msg.id)
  const s = useGameStore.getState()
  if (!isPlaying(s)) return
  if (elapsedOf(s.fuseRemaining) < QUIET_UNTIL_SEC) {
    pending.push(msg)
    return
  }
  deliverNow(msg)
}

/** 事件锚入口（DEV 句柄 __lcdFire 同走此管线，含去重/熟悉期/节流） */
function fire(event: AnchorEvent): void {
  const s = useGameStore.getState()
  if (!isPlaying(s)) return
  const msg = getPushByEvent(event)
  if (!msg) return
  fireMessage(msg)
}

/**
 * 熟悉期释放与跳过补位（pacing §3/§5）：
 * 跨过 40s 按序释放 pending——第一条按原档、后续被 15s 节流自然降 C，防 40–50s 扎堆；
 * 跨过 8s 且跳过开场、本局还什么都没触发时，播一条 system 补位（豁免熟悉期）。
 */
function onCrossed(elapsed: number, prevElapsed: number): void {
  if (prevElapsed < QUIET_UNTIL_SEC && elapsed >= QUIET_UNTIL_SEC) {
    const queue = pending.splice(0)
    for (const msg of queue) deliverNow(msg)
  }
  if (
    prevElapsed < SKIP_FILLER_DELAY_SEC &&
    elapsed >= SKIP_FILLER_DELAY_SEC &&
    useDesktopStore.getState().introSkipped &&
    fired.size === 0 &&
    pending.length === 0
  ) {
    // pacing §5:补位条定档 B,不走 tierOf(json 里没有 sys_skip_filler)
    useDesktopStore.getState().deliver(getMessage(SKIP_FILLER.id) ?? SKIP_FILLER, 'B')
  }
}

function onGameStore(state: RootState, prev: RootState): void {
  if (!isPlaying(state)) return
  const elapsed = elapsedOf(state.fuseRemaining)
  const prevElapsed = elapsedOf(prev.fuseRemaining)

  // ---- store 锚：每 100ms 跑一次，只做 O(1) 比较 ----
  if (prev.activeSheet === 'sheet1' && state.activeSheet === 'sheet2') fire('first_manual_switch')
  if (prev.row5Phase === 'normal' && state.row5Phase === 'stuck') fire('row5_stuck')
  if (countDefused(prev) === 0 && countDefused(state) >= 1) fire('first_defuse')
  if (state.formatBrush.cdUntil !== prev.formatBrush.cdUntil && state.formatBrush.cdUntil > 0)
    fire('skill_format_brush')
  if (state.freezePane.cdUntil !== prev.freezePane.cdUntil && state.freezePane.cdUntil > 0)
    fire('skill_freeze_pane')
  if (prev.fuseRemaining >= 60 && state.fuseRemaining < 60) fire('fuse_60s')
  if (prev.fuseRemaining >= 30 && state.fuseRemaining < 30) fire('fuse_30s')
  // 时间锚兜底：prevElapsed < atSec <= elapsed（ep_time_160 是 json 里唯一的时间推送）
  for (const m of getTimeAnchors()) {
    const at = m.trigger.atSec
    if (at !== undefined && prevElapsed < at && at <= elapsed) fireMessage(m)
  }

  onCrossed(elapsed, prevElapsed)
}

function onPenalty(e: Event): void {
  const source = (e as CustomEvent<{ source?: string }>).detail?.source
  if (source === 'edge-a') fire('first_edge_a')
  else if (source === 'row8') fire('row8_trap')
}

let started = false

/** 幂等初始化（App 每次渲染都会调用） */
export function initDesktopAnchors(): void {
  if (started) return
  started = true
  useGameStore.subscribe(onGameStore)
  window.addEventListener('lcd:penalty', onPenalty)

  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__lcdFire = fire
    ;(window as unknown as Record<string, unknown>).__lcdAnchors = {
      fired: () => [...fired],
      pending: () => pending.map((m) => m.id),
    }
  }
}
