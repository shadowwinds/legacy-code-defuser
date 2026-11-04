/**
 * 本局「局面」：外壳变量 + 时间场景 + 噪声字段（GDD 07 §7.2，GLOSSARY「外壳变量」）。
 * 全部由种子派生，每个变量一条独立随机流 `shell:<名>`，新增变量不会让老种子的其他变量漂移。
 * 规则只通过 `predicates` 读外壳变量（一眼可判的开关）。
 */
import { streamFor } from '../lib/seed'

export type SceneId = 'fri-close' | 'wed-release' | 'sat-review' | 'sun-eve'

export interface Scene {
  id: SceneId
  /** 场景名（手册/附录用） */
  name: string
  /** 开局那天的星期（0 = 周日 … 6 = 周六） */
  weekday: number
  /** 截止时刻的钟点（24 = 次日 00:00） */
  deadlineHour: number
  weekend: boolean
  night: boolean
}

/** 4 个场景正好铺满「周末 × 深夜」2×2 */
export const SCENES: readonly Scene[] = [
  { id: 'fri-close', name: '下班封网', weekday: 5, deadlineHour: 17, weekend: false, night: false },
  { id: 'wed-release', name: '发版窗口关闭', weekday: 3, deadlineHour: 22, weekend: false, night: true },
  { id: 'sat-review', name: '甲方周末验收', weekday: 6, deadlineHour: 10, weekend: true, night: false },
  { id: 'sun-eve', name: '例会前夜', weekday: 0, deadlineHour: 24, weekend: true, night: true },
]

export const AUTHORS = ['老王', '外包-张三', '实习生小李', 'Administrator', 'AutoSave', '甲方'] as const
export type Author = (typeof AUTHORS)[number]

const COMPANIES = ['某某科技有限公司', '降本增效（集团）', '未激活的产品', '甲方爸爸控股']
const TAGS = ['最终版', '勿动', '机密', '待评审', '真最终版(2)']

export interface Situation {
  /** 标题栏版本号 N（`_v{N}.xlsx`），2–29 */
  version: number
  /** 公式栏上方是否有宏安全警告条 */
  macroBar: boolean
  scene: Scene
  /** 开局那天的日期（与 scene.weekday 在日历上一致），day ∈ 1–28 */
  date: { year: number; month: number; day: number }
  /** 【文件 → 信息】作者 */
  author: Author
  /** 噪声字段：不被任何规则引用 */
  noise: {
    fileSizeKb: number
    revisions: number
    lastModified: string
    company: string
    tag: string
  }
}

/** 规则里能用的全部外壳谓词（手册附录 C「去哪找」与之一一对应） */
export const predicates = {
  /** 标题栏版本号末位是单数 */
  versionOdd: (s: Situation) => s.version % 2 === 1,
  /** 有宏警告条 */
  macroBar: (s: Situation) => s.macroBar,
  /** 周末 */
  weekend: (s: Situation) => s.scene.weekend,
  /** 深夜 */
  night: (s: Situation) => s.scene.night,
  /** 过了 15 号发薪日 */
  pastPayday: (s: Situation) => s.date.day > 15,
  /** 作者是外包-张三 */
  authorOutsourcer: (s: Situation) => s.author === '外包-张三',
}

const weekdayOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay()

/** 由种子生成本局局面 */
export function createSituation(seed: string): Situation {
  const r = (name: string) => streamFor(seed, `shell:${name}`)

  const version = 2 + r('version').int(28)
  const macroBar = r('macro').next() < 0.5
  const scene = SCENES[r('scene').int(SCENES.length)]

  // 日期：先抽几号，再在 2026–2027 年里找星期对得上的月份
  const dateRng = r('date')
  const day = 1 + dateRng.int(28)
  const candidates: { year: number; month: number }[] = []
  for (const year of [2026, 2027]) {
    for (let month = 1; month <= 12; month++) {
      if (weekdayOf(year, month, day) === scene.weekday) candidates.push({ year, month })
    }
  }
  const ym = candidates[dateRng.int(candidates.length)]

  const author = AUTHORS[r('author').int(AUTHORS.length)]

  const noiseRng = r('noise')
  const lmMonth = 1 + noiseRng.int(12)
  const lmDay = 1 + noiseRng.int(28)
  const noise = {
    fileSizeKb: 64 + noiseRng.int(4000),
    revisions: 1 + noiseRng.int(99),
    lastModified: `2013/${lmMonth}/${lmDay} ${17 + noiseRng.int(3)}:${String(noiseRng.int(60)).padStart(2, '0')}`,
    company: COMPANIES[noiseRng.int(COMPANIES.length)],
    tag: TAGS[noiseRng.int(TAGS.length)],
  }

  return { version, macroBar, scene, date: { ...ym, day }, author, noise }
}

/** 标题栏文件名 */
export const workbookName = (s: Situation) => `核心业务_最终版_v${s.version}.xlsx`
