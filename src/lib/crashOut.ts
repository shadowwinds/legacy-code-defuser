/**
 * 崩出 Excel 的高潮演出（GDD 07 §7.6，#56）：纯函数部分。
 * 组件只负责量出各区域的像素框，「何时漏、漏到哪、漏几个、写什么」都在这里决定，同一种子同一画面。
 */
import { streamFor } from './seed'

/** 最后 30 秒：全局引信阈值（秒） */
export const CLIMAX_FUSE_SEC = 30
/** 或任一未拆模块剩余 ≤ 该秒数 */
export const CLIMAX_MODULE_SEC = 10
/** 爆炸碎窗时长（ms）：碎完才露出蓝屏，结局对话与弹窗顺延这么久 */
export const SHATTER_MS = 1200
/** 通关倒放时长（ms）：错误值缩回 + 整表刷绿，「是否保存」顺延这么久 */
export const REWIND_MS = 1200

export interface ClimaxInput {
  status: 'idle' | 'playing' | 'won' | 'exploded' | string
  fuseRemaining: number
  modules: readonly { remaining: number; defused: boolean }[]
}

/**
 * 漏出进度 0–1：0 = 还没到最后 30 秒。
 * 进入后至少 0.1（一进来就看得见），引信或最危险模块越接近归零越接近 1。
 */
export function climaxProgress({ status, fuseRemaining, modules }: ClimaxInput): number {
  if (status !== 'playing') return 0
  const live = modules.filter((m) => !m.defused)
  if (live.length === 0) return 0
  const minRem = Math.min(...live.map((m) => m.remaining))
  if (fuseRemaining > CLIMAX_FUSE_SEC && minRem > CLIMAX_MODULE_SEC) return 0
  const raw = Math.max(
    (CLIMAX_FUSE_SEC - fuseRemaining) / CLIMAX_FUSE_SEC,
    (CLIMAX_MODULE_SEC - minRem) / CLIMAX_MODULE_SEC,
  )
  return Math.min(1, 0.1 + 0.9 * Math.max(0, raw))
}

/**
 * 漏出区域，按漏出先后排列。全部是不可交互的装饰区：
 * Ribbon 装饰占位组 → 标题栏/页签条空白 → 状态栏空白 → 越过窗口下缘到任务栏空白。
 */
export const LEAK_ZONES = ['ribbon', 'chrome', 'statusbar', 'taskbar'] as const
export type LeakZone = (typeof LEAK_ZONES)[number]

/** 每个区域从多少进度开始漏、最多漏几个 */
const ZONE_SPEC: Record<LeakZone, { from: number; max: number }> = {
  ribbon: { from: 0, max: 10 },
  chrome: { from: 0.3, max: 8 },
  statusbar: { from: 0.55, max: 5 },
  taskbar: { from: 0.75, max: 7 },
}

const LEAK_TEXTS = ['#REF!', '#N/A', '#VALUE!', '#NULL!', '#DIV/0!', '锟斤拷', '#NAME?', '烫烫烫', '#SPILL!', '####']

export interface LeakSpot {
  zone: LeakZone
  /** 区域内序号（稳定 key） */
  index: number
  /** 区域内相对位置 0–1 */
  fx: number
  fy: number
  text: string
}

/**
 * 进度 → 漏出的错误值。进度只增不减时结果只增不挪（同 pickInfectedCells 的约定），
 * 每个区域的候选位置由种子固定，进度决定露出前几个。
 */
export function leakSpots(progress: number, seed: string): LeakSpot[] {
  if (progress <= 0) return []
  const out: LeakSpot[] = []
  for (const zone of LEAK_ZONES) {
    const { from, max } = ZONE_SPEC[zone]
    if (progress <= from) continue
    const share = Math.min(1, (progress - from) / (1 - from))
    const count = Math.max(1, Math.round(share * max))
    const rng = streamFor(seed, `crash-out:${zone}`)
    for (let i = 0; i < max; i++) {
      const spot: LeakSpot = { zone, index: i, fx: rng.next(), fy: rng.next(), text: LEAK_TEXTS[rng.int(LEAK_TEXTS.length)] }
      if (i < count) out.push(spot)
    }
  }
  return out
}

/** 终局演出要占用的时长（ms）：结局对话和 Win98 弹窗顺延这么久再出。v2 关闭时为 0 */
export function endingDelayMs(status: string, v2: boolean): number {
  if (!v2) return 0
  if (status === 'exploded') return SHATTER_MS
  if (status === 'won') return REWIND_MS
  return 0
}

export interface Shard {
  /** clip-path 多边形顶点（百分比，相对 Excel 窗口） */
  points: [number, number][]
  /** 掉落时的水平漂移（vw）、旋转（deg）、起跳延迟（ms） */
  dx: number
  rot: number
  delay: number
}

/**
 * 碎窗：把窗口切成 cols × rows 块，内部格点按种子抖动，块与块严丝合缝（共用格点）。
 * 越靠下的块越早掉（像从底下塌）。
 */
export function shardPlan(seed: string, cols = 4, rows = 3): Shard[] {
  const rng = streamFor(seed, 'crash-out:shards')
  const grid: [number, number][][] = []
  for (let r = 0; r <= rows; r++) {
    grid.push([])
    for (let c = 0; c <= cols; c++) {
      const inner = r > 0 && r < rows && c > 0 && c < cols
      const jx = inner ? (rng.next() - 0.5) * (60 / cols) : 0
      const jy = inner ? (rng.next() - 0.5) * (60 / rows) : 0
      grid[r].push([(c / cols) * 100 + jx, (r / rows) * 100 + jy])
    }
  }
  const shards: Shard[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      shards.push({
        points: [grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]],
        dx: (rng.next() - 0.5) * 30,
        rot: (rng.next() - 0.5) * 70,
        delay: Math.round((rows - 1 - r) * 90 + rng.next() * 120),
      })
    }
  }
  return shards
}
