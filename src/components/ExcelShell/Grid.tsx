import { Fragment, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { GRID_ROWS } from '../../data/gridRows'
import { COL_COUNT, colLetter } from '../../lib/grid'
import { useGameStore } from '../../store'
import { Comment } from './Comment'
import { DataBar } from './DataBar'
import { TrackerOverlay } from './TrackerOverlay'

/** 8 行网格：行号 1–8 + 列标 A–H，E 列为数据条列；点击单元格/行号选中 */
export function Grid() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const selectCell = useGameStore((s) => s.selectCell)
  const selectRow = useGameStore((s) => s.selectRow)
  const modules = useGameStore((s) => s.modules)
  const locks = useGameStore((s) => s.locks)
  const applyPenalty = useGameStore((s) => s.applyPenalty)
  const formatBrush = useGameStore((s) => s.formatBrush)
  const greenWashRow = useGameStore((s) => s.greenWashRow)
  const frozenRowsUntil = useGameStore((s) => s.frozenRowsUntil)

  // Row8 禁操行：点击全场 -30s，1s 防抖 + 短暂红闪
  const [row8Flash, setRow8Flash] = useState(false)
  const lastRow8ClickAt = useRef(0)
  const handleRow8Click = () => {
    const now = Date.now()
    if (now - lastRow8ClickAt.current < 1000) return
    lastRow8ClickAt.current = now
    applyPenalty({ all: true, sec: 30, source: 'row8' })
    setRow8Flash(true)
    window.setTimeout(() => setRow8Flash(false), 500)
  }

  const rowSelected = selectedCol === null
  // Row1 的 A 列是合并单元格：选中 A1 时选中框横跨合并宽度
  const mergedSpan =
    !rowSelected && selectedCol === 1 ? (GRID_ROWS[selectedRow - 1]?.span ?? 1) : 1

  const isColActive = (col: number) =>
    !rowSelected && selectedCol !== null && col >= selectedCol && col < selectedCol + mergedSpan

  // 行锁定（penaltySlice）：锁定期间该行灰化
  const isLocked = (row: number) => (locks[row] ?? 0) > Date.now()

  // 选中框覆盖层：按网格结构尺寸绝对定位（随滚动容器一起滚动）
  const frameStyle: CSSProperties = rowSelected
    ? {
        left: 'var(--row-header-w)',
        top: `calc(var(--row-h) * ${selectedRow})`,
        width: `calc(var(--col-w) * ${COL_COUNT})`,
        height: 'var(--row-h)',
      }
    : {
        left: `calc(var(--row-header-w) + var(--col-w) * ${selectedCol - 1})`,
        top: `calc(var(--row-h) * ${selectedRow})`,
        width: `calc(var(--col-w) * ${mergedSpan})`,
        height: 'var(--row-h)',
      }

  return (
    <div className="grid-wrap">
      <div className="grid">
        <div className="gh" aria-hidden="true" />
        {Array.from({ length: COL_COUNT }, (_, i) => (
          <div key={`col-${i}`} className={`gh${isColActive(i + 1) ? ' active' : ''}`}>
            {colLetter(i + 1)}
          </div>
        ))}

        {GRID_ROWS.map((r) => {
          const isSelRow = selectedRow === r.row
          const locked = isLocked(r.row)
          // 格式刷假绿（skillSlice）：效果期该行数据条强制绿（CSS 覆盖，引擎照跑）
          const greenWashed = greenWashRow === r.row && formatBrush.activeUntil > Date.now()
          // 冻结窗格（engineSlice）：行号头 ❄ + 浅蓝
          const frozen = (frozenRowsUntil[r.row] ?? 0) > Date.now()
          // Row8 禁操行：任何单元格点击 → 全场 -30s
          const isRow8 = r.kind === 'decor' && r.text.includes('🐉')
          const cells: JSX.Element[] = []
          let col = 1
          while (col <= COL_COUNT) {
            const cls = `cell${r.kind === 'dim' ? ' dim' : ''}${locked ? ' locked' : ''}${greenWashed ? ' green-wash' : ''}${isRow8 && row8Flash ? ' row8-flash' : ''}`
            if (col === 5) {
              // E 列：模块行接引擎倒计时数据条；非模块行不渲染
              const mod = r.kind === 'module' ? modules[r.row - 1] : undefined
              cells.push(
                <div key={col} className={cls}>
                  {mod ? <DataBar remainingSec={mod.remaining} initialSec={mod.initial} /> : null}
                </div>,
              )
              col += 1
              continue
            }
            if (r.span && col === 1) {
              cells.push(
                <div
                  key={col}
                  className={cls}
                  style={{ gridColumn: `span ${r.span}` }}
                  onClick={() => selectCell(r.row, 1)}
                >
                  <span>{r.text}</span>
                  {r.comment ? <Comment text={r.comment} /> : null}
                </div>,
              )
              col += r.span
              continue
            }
            cells.push(
              <div
                key={col}
                className={cls}
                onClick={isRow8 ? handleRow8Click : () => selectCell(r.row, col)}
              >
                <span>{col === 1 ? r.text : ''}</span>
                {col === 1 && r.comment ? <Comment text={r.comment} /> : null}
              </div>,
            )
            col += 1
          }
          return (
            <Fragment key={r.row}>
              <div
                className={`rh${r.kind === 'dim' ? ' dim' : ''}${isSelRow ? ' active' : ''}${locked ? ' locked' : ''}${greenWashed ? ' green-wash' : ''}${frozen ? ' frozen' : ''}`}
                onClick={() => selectRow(r.row)}
              >
                {frozen ? `${r.row} ❄` : r.row}
              </div>
              {cells}
            </Fragment>
          )
        })}

        <div className="selection-frame" style={frameStyle} />
        <TrackerOverlay />
      </div>
    </div>
  )
}
