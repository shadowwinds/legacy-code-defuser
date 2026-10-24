import { Fragment, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { GRID_ROWS } from '../../data/gridRows'
import { PASSCODES } from '../../data/passcodes'
import { COL_COUNT, colLetter } from '../../lib/grid'
import { useGameStore } from '../../store'
import { Comment } from './Comment'
import { DataBar } from './DataBar'
import { TrackerOverlay } from './TrackerOverlay'

/** D 列宽拖拽范围（px） */
const D_COL_MIN_PX = 48
const D_COL_MAX_PX = 480

/** F3 口令输入框（stage formatted 后出现；填错锁期间可继续输入；solved 后只读回显口令） */
function Row3PasscodeCell() {
  const stage = useGameStore((s) => s.stage)
  const wrongLock = useGameStore((s) => s.wrongLock)
  const status = useGameStore((s) => s.status)
  const submitPasscode = useGameStore((s) => s.submitPasscode)
  const passcode = useGameStore((s) => PASSCODES[s.passcodeIndex].passcode)
  const [text, setText] = useState('')
  const solved = stage === 'solved'
  return (
    <div className={`f3-passcode${wrongLock ? ' wrong' : ''}`}>
      {wrongLock && <span className="f3-error">#VALUE!</span>}
      <input
        className="f3-input"
        value={solved ? passcode : text}
        placeholder={solved ? '' : '输入口令'}
        readOnly={solved}
        disabled={status !== 'playing'}
        aria-label="口令输入"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || solved || status !== 'playing') return
          submitPasscode(text)
          setText('')
        }}
      />
    </div>
  )
}

/** 8 行网格：行号 1–8 + 列标 A–H，E 列为数据条列；点击单元格/行号选中 */
export function Grid() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const selectCell = useGameStore((s) => s.selectCell)
  const selectRow = useGameStore((s) => s.selectRow)
  const modules = useGameStore((s) => s.modules)
  const locks = useGameStore((s) => s.locks)
  // Row3 乱码考古：D 列宽 / 三阶段 / 本局口令行
  const stage = useGameStore((s) => s.stage)
  const formatMode = useGameStore((s) => s.formatMode)
  const dColWidth = useGameStore((s) => s.dColWidth)
  const setDColWidth = useGameStore((s) => s.setDColWidth)
  const passcodeIndex = useGameStore((s) => s.passcodeIndex)

  const rowSelected = selectedCol === null
  // Row1 的 A 列是合并单元格：选中 A1 时选中框横跨合并宽度
  const mergedSpan =
    !rowSelected && selectedCol === 1 ? (GRID_ROWS[selectedRow - 1]?.span ?? 1) : 1

  const isColActive = (col: number) =>
    !rowSelected && selectedCol !== null && col >= selectedCol && col < selectedCol + mergedSpan

  // 行锁定（penaltySlice）：锁定期间该行灰化
  const isLocked = (row: number) => (locks[row] ?? 0) > Date.now()

  // D 列（col 4）宽度可变（row3Slice.dColWidth），其余列固定 --col-w；选中框定位需按列累计
  const colWExpr = (col: number) => (col === 4 ? `${dColWidth}px` : 'var(--col-w)')
  const spanWExpr = (startCol: number, span: number) => {
    const parts: string[] = []
    for (let c = startCol; c < startCol + span; c++) parts.push(colWExpr(c))
    return parts.length === 1 ? parts[0] : `calc(${parts.join(' + ')})`
  }
  const colLeftExpr = (col: number) => (col <= 1 ? '0px' : spanWExpr(1, col - 1))

  // 选中框覆盖层：按网格结构尺寸绝对定位（随滚动容器一起滚动）
  const frameStyle: CSSProperties = rowSelected
    ? {
        left: 'var(--row-header-w)',
        top: `calc(var(--row-h) * ${selectedRow})`,
        width: spanWExpr(1, COL_COUNT),
        height: 'var(--row-h)',
      }
    : {
        left: `calc(var(--row-header-w) + ${colLeftExpr(selectedCol)})`,
        top: `calc(var(--row-h) * ${selectedRow})`,
        width: spanWExpr(selectedCol, mergedSpan),
        height: 'var(--row-h)',
      }

  // D3 显示：narrow=####；revealed=序列值；formatted/solved 按格式显示日期/序列值
  const passcodeEntry = PASSCODES[passcodeIndex]
  const d3Text =
    stage === 'narrow'
      ? '####'
      : stage === 'revealed' || formatMode === 'general'
        ? passcodeEntry.serial.toFixed(1)
        : passcodeEntry.date
  // 阶段③：口令输入框在 formatted 后出现于 F3
  const passcodeVisible = stage === 'formatted' || stage === 'solved'

  // D/E 分界拖拽：pointer capture 拖动改 D 列宽（拉过阈值由 row3Slice 切阶段）
  const onResizerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    const startX = e.clientX
    const startW = dColWidth
    el.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      setDColWidth(Math.min(D_COL_MAX_PX, Math.max(D_COL_MIN_PX, startW + (ev.clientX - startX))))
    }
    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
  }

  return (
    <div className="grid-wrap">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `var(--row-header-w) repeat(3, var(--col-w)) ${dColWidth}px repeat(4, var(--col-w))`,
        }}
      >
        <div className="gh" aria-hidden="true" />
        {Array.from({ length: COL_COUNT }, (_, i) => (
          <div key={`col-${i}`} className={`gh${isColActive(i + 1) ? ' active' : ''}`}>
            {colLetter(i + 1)}
          </div>
        ))}

        {GRID_ROWS.map((r) => {
          const isSelRow = selectedRow === r.row
          const locked = isLocked(r.row)
          const cells: JSX.Element[] = []
          let col = 1
          while (col <= COL_COUNT) {
            const cls = `cell${r.kind === 'dim' ? ' dim' : ''}${locked ? ' locked' : ''}`
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
            if (r.row === 3 && col === 4) {
              // D3 乱码考古：#### → 序列值 → 短日期（row3Slice 三阶段）
              cells.push(
                <div key={col} className={cls} onClick={() => selectCell(r.row, col)}>
                  <span className="d3-value">{d3Text}</span>
                </div>,
              )
              col += 1
              continue
            }
            if (r.row === 3 && col === 6 && passcodeVisible) {
              // F3 口令输入框：阶段③填口令
              cells.push(
                <div key={col} className={cls} onClick={() => selectCell(r.row, col)}>
                  <Row3PasscodeCell />
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
                className={`rh${r.kind === 'dim' ? ' dim' : ''}${isSelRow ? ' active' : ''}${locked ? ' locked' : ''}`}
                onClick={() => selectRow(r.row)}
              >
                {r.row}
              </div>
              {cells}
            </Fragment>
          )
        })}

        <div className="selection-frame" style={frameStyle} />
        <TrackerOverlay />
        <div
          className="d-col-resizer"
          style={{
            left: `calc(var(--row-header-w) + var(--col-w) * 3 + ${dColWidth}px - 3px)`,
          }}
          onPointerDown={onResizerPointerDown}
          aria-label="D 列宽拖拽"
        />
      </div>
    </div>
  )
}
