import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { GRID_ROWS } from '../../data/gridRows'
import { COL_COUNT, colLetter } from '../../lib/grid'
import { useGameStore } from '../../store'
import { Comment } from './Comment'
import { DataBar } from './DataBar'

/** 8 行网格：行号 1–8 + 列标 A–H，E 列为数据条列；点击单元格/行号选中 */
export function Grid() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const selectCell = useGameStore((s) => s.selectCell)
  const selectRow = useGameStore((s) => s.selectRow)

  const rowSelected = selectedCol === null
  // Row1 的 A 列是合并单元格：选中 A1 时选中框横跨合并宽度
  const mergedSpan =
    !rowSelected && selectedCol === 1 ? (GRID_ROWS[selectedRow - 1]?.span ?? 1) : 1

  const isColActive = (col: number) =>
    !rowSelected && selectedCol !== null && col >= selectedCol && col < selectedCol + mergedSpan

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
          const cells: JSX.Element[] = []
          let col = 1
          while (col <= COL_COUNT) {
            const cls = `cell${r.kind === 'dim' ? ' dim' : ''}`
            if (col === 5) {
              // E 列：数据条（issue #3 静态示例；dim/decor 行不渲染）
              cells.push(
                <div key={col} className={cls}>
                  {r.remainingSec !== undefined && r.initialSec !== undefined ? (
                    <DataBar remainingSec={r.remainingSec} initialSec={r.initialSec} />
                  ) : null}
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
              <div key={col} className={cls} onClick={() => selectCell(r.row, col)}>
                <span>{col === 1 ? r.text : ''}</span>
                {col === 1 && r.comment ? <Comment text={r.comment} /> : null}
              </div>,
            )
            col += 1
          }
          return (
            <Fragment key={r.row}>
              <div
                className={`rh${r.kind === 'dim' ? ' dim' : ''}${isSelRow ? ' active' : ''}`}
                onClick={() => selectRow(r.row)}
              >
                {r.row}
              </div>
              {cells}
            </Fragment>
          )
        })}

        <div className="selection-frame" style={frameStyle} />
      </div>
    </div>
  )
}
