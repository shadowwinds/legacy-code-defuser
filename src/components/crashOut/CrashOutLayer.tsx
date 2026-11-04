import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { climaxProgress, leakSpots, shardPlan, type LeakZone } from '../../lib/crashOut'
import { getRunConfig } from '../../lib/seed'
import { useGameStore } from '../../store'
import './crashOut.css'

/** 错误值小块的尺寸（px），用来把它整个放进区域框里 */
const CHIP_W = 58
const CHIP_H = 18

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const boxOf = (r: DOMRect | undefined | null): Box | null => (r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null)

/** 两个元素之间的水平空白（同一条栏里），太窄就不要 */
function gapBetween(a: Element | null, b: Element | null, bar: Element | null, pad = 10): Box | null {
  if (!bar) return null
  const barR = bar.getBoundingClientRect()
  const left = a ? a.getBoundingClientRect().right + pad : barR.left + pad
  const right = b ? b.getBoundingClientRect().left - pad : barR.right - pad
  const width = right - left
  return width >= CHIP_W ? { left, top: barR.top + 2, width, height: barR.height - 4 } : null
}

/**
 * 量出四个漏出区域的像素框。全部是不可交互的装饰区（GDD 07 §7.6「可交互区域永远不盖」）：
 * - ribbon：Ribbon 里没有按钮的装饰占位组（技能组有按钮，排除）；
 * - chrome：标题栏快速访问栏与标题之间、标题与静音键之间；页签条最后一个页签右侧；
 * - statusbar：状态栏左侧统计与右侧「就绪」之间；
 * - taskbar：越过窗口下缘，任务栏图标与时钟之间。
 * 局内 Excel 窗口占满任务栏以上区域，看不到壁纸，所以「爬上桌面」落在任务栏上；壁纸在碎窗时露出。
 */
function measureZones(): Record<LeakZone, Box[]> {
  const q = (sel: string) => document.querySelector(sel)
  const ribbon = [...document.querySelectorAll('.ribbon-body .ribbon-group')]
    .filter((g) => !g.querySelector('button, select, input'))
    .map((g) => boxOf(g.getBoundingClientRect()))
  const tabs = [...document.querySelectorAll('.ribbon-tab')]
  const chrome = [
    gapBetween(q('.titlebar .qat'), q('.titlebar .title'), q('.titlebar'), 24),
    gapBetween(q('.titlebar .title'), q('.titlebar .mute-btn'), q('.titlebar'), 24),
    gapBetween(tabs[tabs.length - 1] ?? null, null, q('.ribbon-tabs'), 16),
  ]
  const statusbar = [gapBetween(q('.statusbar-left'), q('.statusbar > div:last-child'), q('.statusbar'), 24)]
  const apps = [...document.querySelectorAll('.desktop-taskbar .tb-app')]
  const taskbar = [gapBetween(apps[apps.length - 1] ?? null, q('.desktop-taskbar .tb-clock'), q('.desktop-taskbar'), 16)]
  const keep = (xs: (Box | null)[]) => xs.filter((x): x is Box => x !== null && x.width >= CHIP_W && x.height >= CHIP_H - 4)
  return { ribbon: keep(ribbon), chrome: keep(chrome), statusbar: keep(statusbar), taskbar: keep(taskbar) }
}

const EMPTY_ZONES: Record<LeakZone, Box[]> = { ribbon: [], chrome: [], statusbar: [], taskbar: [] }

/** 漏出进度只在局内上涨；终局后冻结在最后的值，供倒放 / 碎窗使用 */
function useClimax(): { progress: number; status: string } {
  const status = useGameStore((s) => s.status)
  const live = useGameStore((s) => Math.round(climaxProgress(s) * 50) / 50)
  const last = useRef(0)
  if (status === 'playing') last.current = live
  return { progress: status === 'playing' ? live : last.current, status }
}

/**
 * 崩出 Excel 的高潮演出（GDD 07 §7.6，#56，仅 v2）：
 * 1. 最后 30 秒：错误值漏出表格，依次爬上 Ribbon 装饰区 → 窗口边框空白 → 状态栏 → 任务栏；
 * 2. 爆炸：裂纹 → 窗口碎块掉落 → 露出「已停止工作」蓝屏，结局对话与弹窗顺延 SHATTER_MS；
 * 3. 通关：错误值缩回表格，整表刷绿，「是否保存」顺延 REWIND_MS。
 * 整层 pointer-events: none，不参与判定、不挡操作；prefers-reduced-motion 下只淡入淡出。
 */
export function CrashOutLayer() {
  if (!getRunConfig().v2) return null
  return <CrashOut />
}

function CrashOut() {
  const seed = useGameStore((s) => s.seed)
  const { progress, status } = useClimax()
  const [zones, setZones] = useState(EMPTY_ZONES)
  const active = progress > 0

  // 进入最后 30 秒时量一次区域，窗口尺寸变化时重量
  useLayoutEffect(() => {
    if (!active) return
    const update = () => setZones(measureZones())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  const spots = useMemo(() => leakSpots(progress, seed), [progress, seed])

  // 终局时给 <html> 打标，CSS 让真窗口退场（碎窗）或刷绿（倒放）
  useEffect(() => {
    const root = document.documentElement
    if (status === 'exploded') root.dataset.crash = 'shatter'
    else if (status === 'won') root.dataset.crash = 'rewind'
    else delete root.dataset.crash
    return () => {
      delete root.dataset.crash
    }
  }, [status])

  return (
    <>
      {status !== 'exploded' && spots.length > 0 && (
        <div className={`crash-leak${status === 'won' ? ' rewind' : ''}`} aria-hidden="true">
          {spots.map((s) => {
            const boxes = zones[s.zone]
            if (boxes.length === 0) return null
            const pick = Math.min(boxes.length - 1, Math.floor(s.fx * boxes.length))
            const box = boxes[pick]
            const within = s.fx * boxes.length - pick
            const style: CSSProperties = {
              left: box.left + within * Math.max(0, box.width - CHIP_W),
              top: box.top + s.fy * Math.max(0, box.height - CHIP_H),
              animationDelay: `${(s.index % 5) * 60}ms`,
            }
            return (
              <span key={`${s.zone}-${s.index}`} className={`crash-chip zone-${s.zone}`} style={style}>
                {s.text}
              </span>
            )
          })}
        </div>
      )}
      {status === 'exploded' && <Shatter seed={seed} />}
      {status === 'won' && <div className="crash-green-wash" aria-hidden="true" />}
    </>
  )
}

/** 碎窗：裂纹 → 碎块掉落 → 蓝屏 */
function Shatter({ seed }: { seed: string }) {
  const shards = useMemo(() => shardPlan(seed), [seed])
  return (
    <div className="crash-shatter" aria-hidden="true">
      <div className="crash-bsod">
        <div className="crash-bsod-face">:(</div>
        <p className="crash-bsod-title">核心业务.xlsx 已停止工作</p>
        <p>Windows 正在收集错误信息。收集完了也没人看。</p>
        <p className="crash-bsod-code">终止代码：LEGACY_CODE_DETONATED</p>
      </div>
      {shards.map((s, i) => (
        <div
          key={i}
          className="crash-shard"
          style={
            {
              clipPath: `polygon(${s.points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`,
              // 绕碎块自己的重心转，而不是绕整个窗口
              transformOrigin: `${s.points.reduce((a, [x]) => a + x, 0) / s.points.length}% ${s.points.reduce((a, [, y]) => a + y, 0) / s.points.length}%`,
              '--dx': `${s.dx}vw`,
              '--rot': `${s.rot}deg`,
              animationDelay: `${250 + s.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
      <svg className="crash-cracks" viewBox="0 0 100 100" preserveAspectRatio="none">
        {shards.map((s, i) => (
          <polygon key={i} points={s.points.map(([x, y]) => `${x},${y}`).join(' ')} />
        ))}
      </svg>
    </div>
  )
}
