/**
 * 本局种子与运行开关（地图 #39 已钉决策 7、9）。
 *
 * - 一局所有随机都从同一个种子派生：`streamFor(seed, 用途)` 给每个用途一条独立随机流，
 *   新增随机用途不会让既有用途的取值漂移（同种子的旧局可继续重放）。
 * - URL `?seed=XXXX` 重放同一局；无参数 / 非法时随机生成。
 * - v2 开关：`?v2=1` 或构建期 `VITE_V2=1`。关闭时游戏行为与 v1.1 线上版本一致。
 */

/** 种子字面：1–16 位大写字母数字（展示与 URL 都用它） */
export const SEED_PATTERN = /^[A-Z0-9]{1,16}$/

/** 生成种子的字符表：去掉易混的 0/O/1/I */
const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const GENERATED_SEED_LEN = 6

export interface RunConfig {
  /** 本局种子（已规范化为大写） */
  seed: string
  /** v2 内容开关 */
  v2: boolean
}

export interface Rng {
  /** [0, 1) 均匀分布 */
  next: () => number
  /** [0, n) 均匀整数 */
  int: (n: number) => number
}

/** 字符串 → 32 位整数（FNV-1a） */
function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32：32 位状态的小型 PRNG，足够游戏用、可复现 */
function mulberry32(state: number): Rng {
  let a = state >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { next, int: (n) => Math.floor(next() * n) }
}

/** 按「种子 + 用途」派生一条独立随机流 */
export function streamFor(seed: string, purpose: string): Rng {
  return mulberry32(hashString(`${seed}::${purpose}`))
}

/** 随机生成一个新种子（全局唯一的非确定性来源） */
export function generateSeed(): string {
  let s = ''
  for (let i = 0; i < GENERATED_SEED_LEN; i++) {
    s += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)]
  }
  return s
}

const envV2 = (): boolean => {
  try {
    return import.meta.env?.VITE_V2 === '1'
  } catch {
    return false
  }
}

/** 解析 URL 查询串为本局配置 */
export function parseRunConfig(search: string): RunConfig {
  const params = new URLSearchParams(search)
  const raw = (params.get('seed') ?? '').trim().toUpperCase()
  return {
    seed: SEED_PATTERN.test(raw) ? raw : generateSeed(),
    v2: params.get('v2') === '1' || envV2(),
  }
}

let cached: RunConfig | null = null

/** 本局配置（首次调用时从 location 解析并缓存，整局不变） */
export function getRunConfig(): RunConfig {
  if (!cached) {
    const search = typeof location !== 'undefined' ? location.search : ''
    cached = parseRunConfig(search)
  }
  return cached
}

/** 本局某用途的随机流（便捷写法） */
export function runStream(purpose: string): Rng {
  return streamFor(getRunConfig().seed, purpose)
}

/** 「重开新局」用的查询串：去掉种子，保留 v2 等其他参数 */
export function newRunSearch(search: string): string {
  const params = new URLSearchParams(search)
  params.delete('seed')
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** 「重放本局」用的查询串：在其他参数后写入种子 */
export function replaySearch(search: string, seed: string): string {
  const params = new URLSearchParams(search)
  params.delete('seed')
  params.set('seed', seed)
  return `?${params.toString()}`
}

/** 结局「重新开始」：开一颗新炸弹（去掉种子；带种子的链接点重开不会重复同一局） */
export function startNewRun(): void {
  const next = newRunSearch(location.search)
  if (next === location.search) location.reload()
  else location.search = next
}
