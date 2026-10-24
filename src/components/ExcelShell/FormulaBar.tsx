import { GRID_ROWS } from '../../data/gridRows'
import { cellAddress, rowAddress } from '../../lib/grid'
import { useGameStore } from '../../store'

/** 名称框 + fx 公式栏：名称框随选中更新地址，fx 栏显示该行模块名 */
export function FormulaBar() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)

  const address =
    selectedCol === null ? rowAddress(selectedRow) : cellAddress(selectedRow, selectedCol)
  const content = GRID_ROWS[selectedRow - 1]?.text ?? ''

  return (
    <div className="formula-bar">
      <div className="name-box">{address}</div>
      <div className="fx-label">fx</div>
      <div className="fx-input">={content}</div>
    </div>
  )
}
