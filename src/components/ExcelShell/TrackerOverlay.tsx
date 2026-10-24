import { useGameStore } from '../../store'

/**
 * 网格几何常量（与 src/styles/global.css 的 --row-header-w/--col-w/--row-h 保持一致，
 * SVG 路径数据无法使用 CSS calc，改在此处单一来源镜像）。
 */
const ROW_HEADER_W = 42
const COL_W = 96
const ROW_H = 24

/** E 列（第 5 列）中心 x */
const E_CENTER_X = ROW_HEADER_W + COL_W * 4 + COL_W / 2
/** E 列单元格右边界 x */
const E_RIGHT_X = ROW_HEADER_W + COL_W * 5
/** 行 N 中心 y（.gh 表头行占第 0 行，数据行 N 从 y = ROW_H * N 开始） */
const rowCenterY = (row: number) => ROW_H * row + ROW_H / 2

/**
 * 耦合追踪箭头覆盖层（GDD 02 §2.5 / 04 §4.1）：Excel「追踪从属单元格」拟物。
 * 选中 Row4（点行号）且 row4Imbalanced 时，红色折线从 Row4 E 列指向 Edge A 受害者 Row2/Row3；
 * 其余情况不渲染。pointer-events: none，随网格滚动。
 */
export function TrackerOverlay() {
  const selectedRow = useGameStore((s) => s.selectedRow)
  const selectedCol = useGameStore((s) => s.selectedCol)
  const imbalanced = useGameStore((s) => s.row4Imbalanced)

  if (!imbalanced || selectedRow !== 4 || selectedCol !== null) return null

  const sx = E_CENTER_X
  const sy = rowCenterY(4)
  const enterX = E_RIGHT_X - 8
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
