import { useMemo, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { dangerLevel, dangerOf } from '../../lib/danger'
import type { DangerLevel } from '../../lib/danger'
import { getRunConfig } from '../../lib/seed'
import { LEGACY_GEOMETRY, liveSheetGeometry } from '../../lib/sheetGeometry'
import type { SheetGeometry } from '../../lib/sheetGeometry'
import { useGameStore } from '../../store'
import type { RootState } from '../../store'

/** 活表格只在 v2 开关下出现；关闭时与线上 v1.1 一致 */
export const liveSheetEnabled = (): boolean => getRunConfig().v2

/**
 * 危险度（百分整数）。组件订阅这个原始值而不是 100ms 一变的浮点数，
 * 每 0.01 才重渲一次，传染列表也按它 memo。
 */
export const selectDangerPct = (s: RootState): number => Math.round(dangerOf(s) * 100)

/** 当前危险分级；v2 关闭时为 null */
export function useLiveLevel(): DangerLevel | null {
  const enabled = liveSheetEnabled()
  return useGameStore((s) => (enabled ? dangerLevel(selectDangerPct(s) / 100) : null))
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}
const subscribeNothing = () => () => {}

/** Sheet1 网格尺寸：v2 = 宽列铺满屏幕（随窗口宽度），v1 = 线上固定尺寸 */
export function useSheetGeometry(): SheetGeometry {
  const enabled = liveSheetEnabled()
  const width = useSyncExternalStore(
    enabled ? subscribeResize : subscribeNothing,
    () => (enabled ? window.innerWidth : 0),
    () => 0,
  )
  return useMemo(() => (enabled && width > 0 ? liveSheetGeometry(width) : LEGACY_GEOMETRY), [enabled, width])
}

/** 把几何写成 CSS 变量（网格、选中框、G 列覆盖层等都按这三个变量排版） */
export function geometryVars(g: SheetGeometry): CSSProperties {
  return {
    '--row-header-w': `${g.rowHeaderW}px`,
    '--col-w': `${g.colW}px`,
    '--row-h': `${g.rowH}px`,
  } as CSSProperties
}

/** 第 col 列（1-based）的左边界与宽度（px，相对 .grid 左缘）；D 列宽可变 */
export function columnBox(g: SheetGeometry, dColWidth: number, col: number): { left: number; width: number } {
  const widthOf = (c: number) => (c === 4 ? dColWidth : g.colW)
  let left = g.rowHeaderW
  for (let c = 1; c < col; c++) left += widthOf(c)
  return { left, width: widthOf(col) }
}
