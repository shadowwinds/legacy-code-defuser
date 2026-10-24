import { useEffect, useRef, useState } from 'react'
import { GRID_ROWS } from '../../data/gridRows'
import { cellAddress, rowAddress } from '../../lib/grid'
import { useGameStore } from '../../store'
import '../modules/row2.css'

/** Row2 死锁公式（GDD 02 §2.3 Row2） */
const FX_ROW2_LOCKED =
  '=IF(ENV="PRODUCTION", CRASH_NOW(), "SAFE")  // 生产环境定时自爆，防拖欠尾款'
/** Row2 解锁后公式（只读展示） */
const FX_ROW2_UNLOCKED = '=IF(ENV="LOCALHOST", CRASH_NOW(), "SAFE")'

/** IFERROR 彩蛋批注自动消失时长（规格 3~5s，取中值） */
const EGG_VISIBLE_MS = 4000

/**
 * 名称框 + fx 公式栏。
 * Row2 死锁中且选中该行：fx 显示自爆公式，点击进入编辑（Enter 提交 editFx / Esc 取消 / 失焦取消）；
 * Row2 解锁后：fx 只读显示 LOCALHOST 公式；其余行维持默认展示（该行模块名）。
 */
export function FormulaBar() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const deadlocked = useGameStore((s) => s.deadlocked)
  const editFx = useGameStore((s) => s.editFx)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [showEgg, setShowEgg] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const eggTimer = useRef<number | null>(null)

  const row2Armed = selectedRow === 2 && deadlocked

  const address =
    selectedCol === null ? rowAddress(selectedRow) : cellAddress(selectedRow, selectedCol)
  // Row2 公式自带 "="，其余行沿用「= + 行文本」的既有展示
  const content =
    selectedRow === 2
      ? deadlocked
        ? FX_ROW2_LOCKED
        : FX_ROW2_UNLOCKED
      : `=${GRID_ROWS[selectedRow - 1]?.text ?? ''}`

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(
    () => () => {
      if (eggTimer.current !== null) window.clearTimeout(eggTimer.current)
    },
    [],
  )

  const startEdit = () => {
    if (!row2Armed) return
    setDraft(FX_ROW2_LOCKED)
    setEditing(true)
  }

  const submit = () => {
    if (editFx(draft) === 'iferror') {
      setShowEgg(true)
      if (eggTimer.current !== null) window.clearTimeout(eggTimer.current)
      eggTimer.current = window.setTimeout(() => setShowEgg(false), EGG_VISIBLE_MS)
    }
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  return (
    <div className="formula-bar">
      <div className="name-box">{address}</div>
      <div className="fx-label">fx</div>
      {editing ? (
        <input
          ref={inputRef}
          className="fx-input fx-editing"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={cancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
        />
      ) : (
        <div className={`fx-input${row2Armed ? ' fx-editable' : ''}`} onClick={startEdit}>
          {content}
        </div>
      )}
      {showEgg ? <div className="row2-egg-pop">糊弄学大师。</div> : null}
    </div>
  )
}
