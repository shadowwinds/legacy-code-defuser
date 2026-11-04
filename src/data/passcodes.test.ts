import { expect, test } from 'vitest'
import { PASSCODES } from './passcodes'

/** #46 Q27：序列值必须是日期在 Excel 1900 日期系统里的真实值（小数部分只是时刻） */
test('v1 口令表：序列值与日期严格对应', () => {
  for (const e of PASSCODES) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(e.serial) * 86400000)
    expect(d.toISOString().slice(0, 10), e.passcode).toBe(e.date)
  }
})
