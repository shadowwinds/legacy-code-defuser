import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { COL_COUNT, ROW_COUNT } from '../../lib/grid'
import { dangerLevel, hottestRow, pickInfectedCells, refHeaderCols } from '../../lib/danger'
import type { InfectedCell } from '../../lib/danger'
import type { SheetGeometry } from '../../lib/sheetGeometry'
import { useGameStore } from '../../store'
import { columnBox, selectDangerPct, useSheetGeometry } from './useLiveSheet'
import './liveSheet.css'

/** 退去动画时长（ms）：格子离开传染集合后再挂这么久播完退场 */
const RECEDE_MS = 800
/** 拆除擦除波 + 盖章总时长（ms） */
const DEFUSE_FX_MS = 1600

const cellKey = (c: { row: number; col: number }) => `${c.row}-${c.col}`

/**
 * 活表格演出层（#48，v2）：挂在 .grid 内，随网格滚动。
 * - 第 9 行以下补空行，让宽列表格铺满整屏；
 * - 错误值从最危险的行向外传染（lib/danger 纯函数决定位置与文本），新格子只在第一次出现时播入场；
 * - L3 列标变成 #REF!；
 * - 拆除：绿色擦除波扫过该行 +「已拆 ✓」盖章，附近的传染格子随之退去。
 * 纯演出：整层 pointer-events: none，不参与判定、不挡操作。
 */
export function LiveSheetLayer() {
  const geometry = useSheetGeometry()
  const dColWidth = useGameStore((s) => s.dColWidth)
  const seed = useGameStore((s) => s.seed)
  const dangerPct = useGameStore(selectDangerPct)
  const hot = useGameStore((s) => hottestRow(s.modules))
  // 已拆行掩码（如 "00101"）：字符串原始值，拆除时才变
  const defusedMask = useGameStore((s) => s.modules.map((m) => (m.defused ? '1' : '0')).join(''))

  const layerRef = useRef<HTMLDivElement>(null)
  const totalRows = useVisibleRowCount(layerRef, geometry.rowH)

  const danger = dangerPct / 100
  const infected = useMemo(
    () =>
      pickInfectedCells({
        danger,
        hottestRow: hot,
        cleanRows: rowsOf(defusedMask),
        totalRows,
        seed,
      }),
    [danger, hot, defusedMask, totalRows, seed],
  )
  // 退场中的格子若已被重新感染，以传染集合为准（同一渲染里避免重复 key）
  const leavingAll = useLeavingCells(infected)
  const leaving = useMemo(() => {
    const present = new Set(infected.map(cellKey))
    return leavingAll.filter((c) => !present.has(cellKey(c)))
  }, [infected, leavingAll])
  const sweeps = useDefuseSweeps(defusedMask)
  // 每个格子只在第一次出现时播入场动画（退去后再出现不重播）
  const seen = useRef(new Set<string>())

  return (
    <div ref={layerRef} className="lv-layer" aria-hidden="true">
      <PhantomRows geometry={geometry} dColWidth={dColWidth} from={ROW_COUNT + 1} to={totalRows} />
      {infected.map((c) => (
        <InfectedCellView key={cellKey(c)} cell={c} geometry={geometry} dColWidth={dColWidth} seen={seen.current} />
      ))}
      {leaving.map((c) => (
        <InfectedCellView
          key={cellKey(c)}
          cell={c}
          geometry={geometry}
          dColWidth={dColWidth}
          seen={seen.current}
          leaving
        />
      ))}
      {dangerLevel(danger) === 3 &&
        refHeaderCols(danger).map((col) => {
          const box = columnBox(geometry, dColWidth, col)
          return (
            <div key={col} className="lv-ref-header" style={{ left: box.left, width: box.width }}>
              #REF!
            </div>
          )
        })}
      {sweeps.map((s) => (
        <div key={s.id} className="lv-sweep" data-row={s.row} style={{ top: geometry.rowH * s.row }}>
          <span className="lv-stamp">已拆 ✓</span>
        </div>
      ))}
    </div>
  )
}

function rowsOf(mask: string): number[] {
  const rows: number[] = []
  for (let i = 0; i < mask.length; i++) if (mask[i] === '1') rows.push(i + 1)
  return rows
}

/** 屏幕上能看到的总行数（真实 8 行 + 补满 .grid-wrap 剩余高度的空行），随窗口高度变化 */
function useVisibleRowCount(layerRef: React.RefObject<HTMLElement>, rowH: number): number {
  const [wrapH, setWrapH] = useState(0)
  useEffect(() => {
    const wrap = layerRef.current?.closest('.grid-wrap')
    if (!wrap) return
    const measure = () => setWrapH(wrap.clientHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [layerRef])
  // 减去列标那一行
  return Math.max(ROW_COUNT, Math.ceil(wrapH / rowH) - 1)
}

/** 离开传染集合的格子：再挂 RECEDE_MS 播退去动画（重新感染则立即回到集合里） */
function useLeavingCells(infected: InfectedCell[]): InfectedCell[] {
  const prev = useRef(infected)
  const timers = useRef<number[]>([])
  const [leaving, setLeaving] = useState<InfectedCell[]>([])

  useEffect(() => {
    const present = new Set(infected.map(cellKey))
    const gone = prev.current.filter((c) => !present.has(cellKey(c)))
    prev.current = infected
    setLeaving((cur) => {
      const kept = cur.filter((c) => !present.has(cellKey(c)))
      return gone.length === 0 && kept.length === cur.length ? cur : [...kept, ...gone]
    })
    if (gone.length === 0) return
    const goneKeys = new Set(gone.map(cellKey))
    timers.current.push(
      window.setTimeout(() => setLeaving((cur) => cur.filter((c) => !goneKeys.has(cellKey(c)))), RECEDE_MS),
    )
  }, [infected])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  return leaving
}

/** 新拆除的行：播一次擦除波 + 盖章（开局即已拆的不播） */
function useDefuseSweeps(defusedMask: string): { row: number; id: number }[] {
  const prevMask = useRef(defusedMask)
  const nextId = useRef(0)
  const timers = useRef<number[]>([])
  const [sweeps, setSweeps] = useState<{ row: number; id: number }[]>([])

  useEffect(() => {
    const before = prevMask.current
    prevMask.current = defusedMask
    const fresh = rowsOf(defusedMask).filter((row) => before[row - 1] !== '1')
    if (fresh.length === 0) return
    const added = fresh.map((row) => ({ row, id: nextId.current++ }))
    setSweeps((cur) => [...cur, ...added])
    const ids = new Set(added.map((s) => s.id))
    timers.current.push(window.setTimeout(() => setSweeps((cur) => cur.filter((s) => !ids.has(s.id))), DEFUSE_FX_MS))
  }, [defusedMask])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  return sweeps
}

interface InfectedCellViewProps {
  cell: InfectedCell
  geometry: SheetGeometry
  dColWidth: number
  seen: Set<string>
  leaving?: boolean
}

const InfectedCellView = memo(function InfectedCellView({
  cell,
  geometry,
  dColWidth,
  seen,
  leaving,
}: InfectedCellViewProps) {
  const key = cellKey(cell)
  // 挂载时决定是否播入场：本局第一次出现才播
  const [fresh] = useState(() => !seen.has(key))
  useEffect(() => {
    seen.add(key)
  }, [seen, key])

  const box = columnBox(geometry, dColWidth, cell.col)
  const style = {
    left: box.left,
    top: geometry.rowH * cell.row,
    width: box.width,
    // 退去按列错开，跟着从左往右扫的擦除波走
    '--lv-col': cell.col - 1,
  } as CSSProperties
  const cls = `lv-infected${fresh ? ' lv-fresh' : ''}${leaving ? ' lv-leaving' : ''}`
  return (
    <div className={cls} style={style}>
      {cell.text}
    </div>
  )
})

interface PhantomRowsProps {
  geometry: SheetGeometry
  dColWidth: number
  from: number
  to: number
}

/** 第 9 行往下的空表：只有行号与网格线，铺满屏幕 */
const PhantomRows = memo(function PhantomRows({ geometry, dColWidth, from, to }: PhantomRowsProps) {
  if (to < from) return null
  const rows: JSX.Element[] = []
  for (let row = from; row <= to; row++) {
    rows.push(
      <div key={row} className="lv-phantom-row" style={{ height: geometry.rowH }}>
        <div className="lv-phantom-rh" style={{ width: geometry.rowHeaderW }}>
          {row}
        </div>
        {Array.from({ length: COL_COUNT }, (_, i) => (
          <div key={i} className="lv-phantom-cell" style={{ width: columnBox(geometry, dColWidth, i + 1).width }} />
        ))}
      </div>,
    )
  }
  return (
    <div className="lv-phantom" style={{ top: geometry.rowH * from }}>
      {rows}
    </div>
  )
})
