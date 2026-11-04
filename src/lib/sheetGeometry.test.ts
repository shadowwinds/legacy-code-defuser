import { expect, test } from 'vitest'
import { LEGACY_GEOMETRY, liveSheetGeometry } from './sheetGeometry'

test('v1 几何保持线上尺寸：行号 42 / 列宽 96 / 行高 24', () => {
  expect(LEGACY_GEOMETRY).toEqual({ rowHeaderW: 42, colW: 96, rowH: 24 })
})

test('活表格：1440 宽屏上 7 列宽列 + 初始 D 列铺满整屏', () => {
  // (1440 − 行号 48 − D 列 72 − 边框余量 4) / 7 = 188
  expect(liveSheetGeometry(1440)).toEqual({ rowHeaderW: 48, colW: 188, rowH: 34 })
})

test('活表格：窄屏时列宽不低于 110', () => {
  expect(liveSheetGeometry(800).colW).toBe(110)
})
