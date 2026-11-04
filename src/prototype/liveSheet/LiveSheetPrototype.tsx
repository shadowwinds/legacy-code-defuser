/**
 * ⚠️ PROTOTYPE · 一次性代码（地图 #39 · 活表格手感原型 #43）——不要合入正式实现，选定后重写。
 *
 * 问题：「活表格」长什么样、什么节奏让人紧张？
 * 三个结构不同的变体，挂在真实游戏页上，`?proto=live&variant=A|B|C` 切换：
 *   A 病毒蔓延：铺满屏幕的真·表格，错误值从最危险的行向外传染
 *   B 结构崩塌：放大居中，单元格下沉、歪斜、抖动、裂开，拆除时「咔」地复位
 *   C 条件格式接管：超高行 + 整行数据条 + 巨型倒计时，危险时窗口泛红、「未响应」
 * 纯演出：pointer-events 全部关闭，不参与判定、不挡操作（已钉决策 8）。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '../../store'
import './liveSheet.prototype.css'

type Variant = 'A' | 'B' | 'C'
const VARIANTS: { key: Variant; name: string }[] = [
  { key: 'A', name: '病毒蔓延' },
  { key: 'B', name: '结构崩塌' },
  { key: 'C', name: '条件格式接管' },
]
/** 手动模式下各模块行相对全局危险度的权重（让五行危险程度错开） */
const MANUAL_ROW_WEIGHT = [0.75, 1.05, 0.55, 1.15, 0.4]
const ERRORS = ['#REF!', '#N/A', '#VALUE!', '#NULL!', '#DIV/0!', '锟斤拷', '####', '#NAME?', '烫烫烫', '#SPILL!']
const COLS = 8
const PHANTOM_ROWS = 14 // 第 9 行往下的「空表」，A 变体用来铺满屏幕、供传染

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const levelOf = (d: number) => (d < 0.3 ? 0 : d < 0.6 ? 1 : d < 0.85 ? 2 : 3)

/** `?proto=live` 打开；`VITE_PROTO_LIVE=1` 构建的预览包（发给用户试玩）默认打开 */
export const isLiveSheetPrototype = () =>
  import.meta.env.VITE_PROTO_LIVE === '1' || new URLSearchParams(location.search).get('proto') === 'live'

function readVariant(): Variant {
  const v = new URLSearchParams(location.search).get('variant')?.toUpperCase()
  return v === 'B' || v === 'C' ? v : 'A'
}

/** 可被传染的空格（行 1–8 的空列 + 第 9 行以下的空表） */
function candidateCells(): { row: number; col: number }[] {
  const occupied: Record<number, number[]> = {
    // 模块行只让 H 列（及纯空白的 C 列）被传染，不盖住模块本身的信息
    1: [1, 2, 3, 4, 5, 6, 7],
    2: [1, 2, 3, 4, 5, 6, 7],
    3: [1, 2, 4, 5, 6, 7],
    4: [1, 2, 4, 5, 6, 7],
    5: [1, 2, 4, 5, 6, 7],
    6: [1],
    7: [1],
    8: [1, 7],
  }
  const out: { row: number; col: number }[] = []
  for (let row = 1; row <= 8 + PHANTOM_ROWS; row++) {
    for (let col = 1; col <= COLS; col++) {
      if (occupied[row]?.includes(col)) continue
      out.push({ row, col })
    }
  }
  return out
}
const CANDIDATES = candidateCells()

export function LiveSheetPrototype() {
  const [variant, setVariant] = useState<Variant>(readVariant)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [manualDanger, setManualDanger] = useState(0.5)
  const [fx, setFx] = useState<{ row: number; key: number } | null>(null)
  const [gridEl, setGridEl] = useState<Element | null>(null)

  const modules = useGameStore((s) => s.modules)
  const fuse = useGameStore((s) => s.fuseRemaining)
  const dColWidth = useGameStore((s) => s.dColWidth)

  // —— 危险度 ——
  const rowDanger = modules.map((m, i) =>
    m.defused
      ? 0
      : mode === 'manual'
        ? clamp01(manualDanger * MANUAL_ROW_WEIGHT[i])
        : clamp01((45 - m.remaining) / 45),
  )
  const danger =
    mode === 'manual' ? manualDanger : clamp01(Math.max(...rowDanger, (90 - fuse) / 90))
  const level = levelOf(danger)
  const hottestRow = rowDanger.indexOf(Math.max(...rowDanger)) + 1

  // —— URL 同步 + ←/→ 切变体 ——
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    p.set('variant', variant)
    try {
      history.replaceState(null, '', `?${p.toString()}`)
    } catch {
      // 沙箱 iframe 里改不了地址栏，切换照常
    }
  }, [variant])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const i = VARIANTS.findIndex((v) => v.key === variant)
      const next = (i + (e.key === 'ArrowRight' ? 1 : VARIANTS.length - 1)) % VARIANTS.length
      setVariant(VARIANTS[next].key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant])

  // —— 手动模式 = 暂停引擎（gameStartedAt 置空，tick 空转）；回到自动 = 重新开局计时 ——
  useEffect(() => {
    if (mode === 'manual') useGameStore.setState({ gameStartedAt: null })
    else useGameStore.getState().startGame()
  }, [mode])

  // —— 真实拆除 → 触发拆除爽感 ——
  const prevDefused = useRef(modules.map((m) => m.defused))
  useEffect(() => {
    modules.forEach((m, i) => {
      if (m.defused && !prevDefused.current[i]) setFx({ row: m.row, key: Date.now() })
    })
    prevDefused.current = modules.map((m) => m.defused)
  }, [modules])
  useEffect(() => {
    if (!fx) return
    const t = window.setTimeout(() => setFx(null), 1400)
    return () => window.clearTimeout(t)
  }, [fx])

  // —— 把状态挂到 .excel-shell 上供 CSS 使用 ——
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.excel-shell')
    setGridEl(document.querySelector('.grid'))
    if (!shell) return
    shell.dataset.live = variant
    shell.dataset.level = String(level)
    shell.style.setProperty('--danger', danger.toFixed(3))
    shell.style.setProperty('--lv-cols-w', `calc(var(--col-w) * 7 + ${dColWidth}px)`)
    rowDanger.forEach((d, i) => {
      const sign = i % 2 === 0 ? 1 : -1
      shell.style.setProperty(`--d-${i + 1}`, d.toFixed(3))
      shell.style.setProperty(`--sag-${i + 1}`, `${(d * d * 9).toFixed(1)}px`)
      shell.style.setProperty(`--tilt-${i + 1}`, `${(sign * d * d * 2.2).toFixed(2)}deg`)
    })
    shell.dataset.fxRow = fx ? String(fx.row) : ''
  })
  useEffect(
    () => () => {
      const shell = document.querySelector<HTMLElement>('.excel-shell')
      if (shell) delete shell.dataset.live
    },
    [],
  )

  // —— A：传染格子 ——
  const infected = useMemo(() => {
    if (variant !== 'A') return []
    const spread = level === 0 ? 0 : Math.pow((danger - 0.3) / 0.7, 2.2) * (fx ? 0.25 : 1)
    const n = Math.round(clamp01(spread) * CANDIDATES.length)
    return [...CANDIDATES]
      .map((c) => ({ ...c, rank: Math.abs(c.row - hottestRow) * 1.6 + Math.abs(c.col - 5) * 0.5 + hash(c.row, c.col) * 3 }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, n)
  }, [variant, danger, level, hottestRow, fx])

  // 列左边界：D 列宽可变（row3Slice.dColWidth），其余列 = --col-w
  const colLeft = (col: number) => {
    const varCols = col - 1 - (col > 4 ? 1 : 0)
    return `calc(var(--row-header-w) + var(--col-w) * ${varCols} + ${col > 4 ? dColWidth : 0}px)`
  }
  const colW = (col: number) => (col === 4 ? `${dColWidth}px` : 'var(--col-w)')

  const overlay = gridEl
    ? createPortal(
        <div className="lv-layer" aria-hidden="true">
          {variant === 'A' && (
            <>
              <div className="lv-phantom" style={{ top: 'calc(var(--row-h) * 9)' }}>
                {Array.from({ length: PHANTOM_ROWS }, (_, i) => (
                  <div key={i} className="lv-phantom-row">
                    <div className="lv-phantom-rh">{9 + i}</div>
                    {Array.from({ length: COLS }, (_, c) => (
                      <div key={c} className="lv-phantom-cell" style={{ width: colW(c + 1) }} />
                    ))}
                  </div>
                ))}
              </div>
              {infected.map((c) => (
                <div
                  key={`${c.row}-${c.col}`}
                  className="lv-infected"
                  style={{
                    left: colLeft(c.col),
                    top: `calc(var(--row-h) * ${c.row})`,
                    width: colW(c.col),
                  }}
                >
                  {ERRORS[Math.floor(hash(c.col, c.row) * ERRORS.length)]}
                </div>
              ))}
              {level === 3 &&
                Array.from({ length: Math.round(((danger - 0.85) / 0.15) * COLS) }, (_, i) => {
                  const col = [5, 4, 6, 3, 7, 2, 8, 1][i]
                  return (
                    <div key={col} className="lv-ref-header" style={{ left: colLeft(col), width: colW(col) }}>
                      #REF!
                    </div>
                  )
                })}
            </>
          )}
          {variant === 'B' && level >= 2 && (
            <svg className="lv-cracks" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={`0,${18 + hottestRow * 6} 14,${22 + hottestRow * 5} 27,${15 + hottestRow * 7} 41,${26 + hottestRow * 5} 58,${20 + hottestRow * 6} 73,${31 + hottestRow * 4} 100,${24 + hottestRow * 6}`} />
              {level === 3 && <polyline points="38,0 42,12 36,24 45,41 39,58 47,74 43,100" />}
              {level === 3 && <polyline points="71,0 66,18 74,33 68,52 76,70" />}
            </svg>
          )}
          {variant === 'C' &&
            modules.map((m) => {
              const pct = m.initial > 0 ? clamp01(m.remaining / m.initial) : 0
              const tier = m.defused ? 'ok' : m.remaining > 60 ? 'ok' : m.remaining >= 20 ? 'warn' : 'err'
              const shown = mode === 'manual' ? Math.max(1, Math.round(60 * (1 - rowDanger[m.row - 1]))) : Math.ceil(m.remaining)
              return (
                <div key={m.row} className="lv-row-bar" data-tier={tier} style={{ top: `calc(var(--row-h) * ${m.row})` }}>
                  <div className="lv-row-bar-fill" style={{ width: `${(mode === 'manual' ? 1 - rowDanger[m.row - 1] : pct) * 100}%` }} />
                  <div className="lv-big-count" data-hot={!m.defused && shown < 20 ? '' : undefined}>
                    {m.defused ? '✓' : shown}
                  </div>
                </div>
              )
            })}
          {fx && (
            <div key={fx.key} className={`lv-fx lv-fx-${variant}`} style={{ top: `calc(var(--row-h) * ${fx.row})` }}>
              {variant === 'C' && <span className="lv-stamp">已拆 ✓</span>}
              {variant === 'B' &&
                Array.from({ length: 14 }, (_, i) => (
                  <i key={i} style={{ left: `${hash(i, fx.row) * 100}%`, animationDelay: `${hash(fx.row, i) * 120}ms` }} />
                ))}
            </div>
          )}
        </div>,
        gridEl,
      )
    : null

  const idx = VARIANTS.findIndex((v) => v.key === variant)
  const cycle = (step: number) => setVariant(VARIANTS[(idx + step + VARIANTS.length) % VARIANTS.length].key)

  return (
    <>
      {overlay}
      {variant === 'C' && level >= 2 && <div className="lv-window-glow" data-level={level} aria-hidden="true" />}
      <div className="lv-switcher" role="toolbar" aria-label="原型切换条">
        <span className="lv-tag">PROTOTYPE</span>
        <button type="button" onClick={() => cycle(-1)} aria-label="上一个变体">◀</button>
        <span className="lv-name">
          {variant} · {VARIANTS[idx].name}
        </span>
        <button type="button" onClick={() => cycle(1)} aria-label="下一个变体">▶</button>
        <span className="lv-sep" />
        <label>
          <input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} /> 真实局势
        </label>
        <label>
          <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} /> 手动（暂停）
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((mode === 'manual' ? manualDanger : danger) * 100)}
          disabled={mode !== 'manual'}
          onChange={(e) => setManualDanger(Number(e.target.value) / 100)}
          aria-label="危险度"
        />
        <span className="lv-readout">
          危险度 {danger.toFixed(2)} · L{level}
        </span>
        <span className="lv-sep" />
        <span>预览拆除</span>
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} type="button" onClick={() => setFx({ row: r, key: Date.now() })}>
            R{r}
          </button>
        ))}
      </div>
    </>
  )
}
