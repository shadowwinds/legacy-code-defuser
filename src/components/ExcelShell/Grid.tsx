import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { GRID_ROWS } from '../../data/gridRows'
import { COL_COUNT, colLetter } from '../../lib/grid'
import { useGameStore } from '../../store'
import { Comment } from './Comment'
import { DataBar } from './DataBar'
import { Row4GOverlay } from '../modules/Row4GOverlay'
import { TrackerOverlay } from './TrackerOverlay'
import { Row5Module } from '../modules/Row5Module'

/** 8 行网格：行号 1–8 + 列标 A–H，E 列为数据条列；点击单元格/行号选中 */
export function Grid() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const selectCell = useGameStore((s) => s.selectCell)
  const selectRow = useGameStore((s) => s.selectRow)
  const modules = useGameStore((s) => s.modules)
  const locks = useGameStore((s) => s.locks)
  // Row2 #DEADLOCK! 死锁（row2Slice）：紫底呼吸 + 非 G/E 列禁点
  const deadlocked = useGameStore((s) => s.deadlocked)
  // Row5（issue #10）：假死阶段 + Edge B 反噬命中行
  const row5Stuck = useGameStore((s) => s.row5Phase === 'stuck')
  const edgeBHitRow = useGameStore((s) => s.edgeBHitRow)

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
          const row2Dead = r.row === 2 && deadlocked
          // Row5 假死紫灰行 + Edge B 命中行闪烁（样式在 modules/row5.css）
          const rowMods =
            `${r.row === 5 && row5Stuck ? ' row5-stuck' : ''}` +
            `${edgeBHitRow === r.row ? ' flash-hit' : ''}`
          const cells: JSX.Element[] = []
          let col = 1
          while (col <= COL_COUNT) {
            const row2Blocked = row2Dead && col !== 5 && col !== 7
            const cls =
              `cell${r.kind === 'dim' ? ' dim' : ''}${locked ? ' locked' : ''}` +
              `${row2Dead ? ' row2-deadlocked' : ''}${row2Blocked ? ' row2-blocked' : ''}` +
              rowMods
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
                  onClick={row2Blocked ? undefined : () => selectCell(r.row, 1)}
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
                onClick={row2Blocked ? undefined : () => selectCell(r.row, col)}
              >
                <span>{col === 1 ? r.text : ''}</span>
                {col === 1 && r.comment ? <Comment text={r.comment} /> : null}
                {r.row === 5 && col === 6 ? <Row5Module /> : null}
              </div>,
            )
            col += 1
          }
          return (
            <Fragment key={r.row}>
              <div
                className={`rh${r.kind === 'dim' ? ' dim' : ''}${isSelRow ? ' active' : ''}${locked ? ' locked' : ''}${row2Dead ? ' row2-deadlocked' : ''}${r.row === 5 && row5Stuck ? ' row5-stuck' : ''}`}
                onClick={() => selectRow(r.row)}
              >
                {r.row}
              </div>
              {cells}
            </Fragment>
          )
        })}

        <div className="selection-frame" style={frameStyle} />
        <Row4GOverlay />
        <TrackerOverlay />
      </div>
    </div>
  )
}
