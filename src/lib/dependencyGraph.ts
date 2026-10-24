/**
 * 耦合边定义（GDD 02 §2.5）：全游戏仅 2 条边，写入手册第 4 节。
 * 本票只做结构与 Edge A 的辅助判定/视觉层；真实触发接线见 #9（Edge A 扣时）/#10（Edge B 触发）。
 */

/** Edge A 失衡持续阈值（毫秒）：失衡 >10s 触发连坐 */
export const EDGE_A_THRESHOLD_MS = 10_000

/** 边触发上下文：由调用方（#9/#10 票）按当前游戏快照构造 */
export interface EdgeTriggerContext {
  /** 当前时间戳（epoch ms） */
  nowMs: number
  /** Row4 是否失衡（Edge A） */
  imbalanced: boolean
  /** 失衡起始时间戳（epoch ms）；未失衡为 null */
  imbalanceSince: number | null
  /** 未拆模块行号列表（Edge B 挑选反噬目标用） */
  aliveRows: readonly number[]
}

export interface DependencyEdge {
  /** 唯一标识 */
  id: 'edge-a' | 'edge-b'
  /** 手册中的边名 */
  name: string
  /** 源头行 */
  from: number
  /** 受害者行（固定列表）；Edge B 反噬目标运行时随机挑选，故为空数组 */
  to: readonly number[]
  /** 每个受害者的扣时（秒） */
  penaltySec: number
  /** 触发条件谓词（轮询式判定；回调驱动的边返回 false，见 EDGE_B） */
  condition: (ctx: EdgeTriggerContext) => boolean
}

/** Edge A 辅助判定：失衡状态是否已持续达到阈值（供 condition 与 #9 票复用） */
export function evaluateEdgeA(imbalanced: boolean, sinceMs: number | null, nowMs: number = Date.now()): boolean {
  if (!imbalanced || sinceMs === null) return false
  return nowMs - sinceMs >= EDGE_A_THRESHOLD_MS
}

/** Edge A · 脏数据连坐：Row4 失衡（求和 ≠ 1024）持续 >10s → Row2/Row3 各 -15s */
export const EDGE_A: DependencyEdge = {
  id: 'edge-a',
  name: '脏数据连坐',
  from: 4,
  to: [2, 3],
  penaltySec: 15,
  condition: (ctx) => evaluateEdgeA(ctx.imbalanced, ctx.imbalanceSince, ctx.nowMs),
}

/** Edge B 反噬目标挑选签名：从未拆模块中随机选 1 个（#10 实装） */
export type EdgeBPickTarget = (aliveRows: readonly number[]) => number | null

/** Edge B 反噬回调签名（#10 接线示例：applyPenalty({ row: target, sec: EDGE_B.penaltySec, source: 'edge-b' })） */
export type EdgeBCallback = (targetRow: number) => void

/** Edge B · 重启是赌博：Row5 仪式成功 → 随机 1 个未拆模块 -5s（数据结构先行，触发由 #10 实装） */
export const EDGE_B: DependencyEdge & { pickTarget: EdgeBPickTarget | null } = {
  id: 'edge-b',
  name: '重启是赌博',
  from: 5,
  to: [],
  penaltySec: 5,
  condition: () => false, // 回调驱动（仪式成功瞬间），不走谓词轮询
  pickTarget: null, // #10 接入随机挑选
}
