import { useGameStore } from '../../store'
import { useSheetGeometry } from '../liveSheet/useLiveSheet'

/*
 * 网格几何取自 useSheetGeometry（SVG 路径数据无法使用 CSS calc，与 CSS 变量同一来源）：
 * v1 = global.css 的 42/96/24；v2 活表格 = 随窗口宽度铺满的宽列。
 */

/**
 * 耦合追踪箭头覆盖层（GDD 02 §2.5 / 04 §4.1）：Excel「追踪从属单元格」拟物。
 * 选中 Row4（点行号）且 row4Imbalanced 时，红色折线从 Row4 E 列指向 Edge A 受害者 Row2/Row3；
 * 其余情况不渲染。pointer-events: none，随网格滚动。
 */
export function TrackerOverlay() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const imbalanced = useGameStore((s) => s.row4Imbalanced)
  const dColWidth = useGameStore((s) => s.dColWidth)
  const { rowHeaderW, colW, rowH } = useSheetGeometry()

  if (!imbalanced || selectedRow !== 4 || selectedCol !== null) return null

  // E 列（第 5 列）左边界：A–C 等宽 + 可变的 D 列宽（row3Slice.dColWidth，与 Grid 的 gridTemplateColumns 同源）
  const eLeft = rowHeaderW + colW * 3 + dColWidth
  /** 行 N 中心 y（.gh 表头行占第 0 行，数据行 N 从 y = rowH * N 开始） */
  const rowCenterY = (row: number) => rowH * row + rowH / 2

  const sx = eLeft + colW / 2
  const sy = rowCenterY(4)
  const enterX = eLeft + colW - 8
  // Excel 式折线：出源单元格 → 竖直上行（两条错开竖线避免重叠）→ 折回进入目标行 E 列
  const arrowPath = (targetRow: number, gutterX: number) => {
    const ty = rowCenterY(targetRow)
    return `M${sx},${sy} L${gutterX},${sy} L${gutterX},${ty} L${enterX},${ty}`
  }

  return (
    <svg className="tracker-overlay" aria-hidden="true">
      <defs>
        <marker
          id="tracker-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#e02b2b" />
        </marker>
      </defs>
      <circle className="tracker-src-dot" cx={sx} cy={sy} r={3.5} />
      <path className="tracker-line" d={arrowPath(3, sx + 16)} markerEnd="url(#tracker-arrowhead)" />
      <path className="tracker-line" d={arrowPath(2, sx + 32)} markerEnd="url(#tracker-arrowhead)" />
    </svg>
  )
}
