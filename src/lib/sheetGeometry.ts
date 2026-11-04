/**
 * Sheet1 网格的结构尺寸（px）。CSS 用 `--row-header-w` / `--col-w` / `--row-h`，
 * SVG（追踪箭头）不能用 CSS calc，统一从这里取同一份数值。
 */
export interface SheetGeometry {
  rowHeaderW: number
  colW: number
  rowH: number
}

/** v1 线上尺寸（与 styles/global.css 的 :root 变量一致） */
export const LEGACY_GEOMETRY: SheetGeometry = { rowHeaderW: 42, colW: 96, rowH: 24 }

const LIVE_ROW_HEADER_W = 48
const LIVE_ROW_H = 34
const LIVE_MIN_COL_W = 110
/** 铺满时按 D 列初始宽度（row3Slice 的 72px）计算；玩家拉宽 D 列后像真 Excel 一样横向滚动 */
const D_COL_INITIAL_W = 72
/** 取整与边框余量（活表格不竖向滚动，没有滚动条要让），防止刚好多出 1px 触发横向滚动条 */
const EDGE_SLACK = 4

/** 活表格（v2）：宽列铺满屏幕——7 个等宽列 + D 列正好占满视口宽度 */
export function liveSheetGeometry(viewportWidth: number): SheetGeometry {
  const fill = Math.floor((viewportWidth - LIVE_ROW_HEADER_W - D_COL_INITIAL_W - EDGE_SLACK) / 7)
  return { rowHeaderW: LIVE_ROW_HEADER_W, colW: Math.max(LIVE_MIN_COL_W, fill), rowH: LIVE_ROW_H }
}
