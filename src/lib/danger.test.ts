import { describe, expect, test } from 'vitest'
import { dangerLevel, dangerOf, hottestRow, pickInfectedCells, refHeaderCols } from './danger'

const mod = (row: number, remaining: number, defused = false) => ({ row, remaining, defused })
/** 五个模块都很安全（剩余 ≥ 45s） */
const calm = () => [1, 2, 3, 4, 5].map((r) => mod(r, 60))

describe('危险度', () => {
  test('开局：模块和引信都远离危险 → 0', () => {
    expect(dangerOf({ modules: calm(), fuseRemaining: 240 })).toBe(0)
  })

  test('最危险的未拆模块剩 9s → 0.8（(45−9)/45）', () => {
    const modules = [mod(1, 30), mod(2, 9), mod(3, 60), mod(4, 50), mod(5, 44)]
    expect(dangerOf({ modules, fuseRemaining: 200 })).toBeCloseTo(0.8)
  })

  test('引信更紧迫时取引信：剩 18s → 0.8（(90−18)/90）', () => {
    expect(dangerOf({ modules: calm(), fuseRemaining: 18 })).toBeCloseTo(0.8)
  })

  test('已拆模块不计入危险度', () => {
    const modules = [mod(1, 0, true), mod(2, 60), mod(3, 60), mod(4, 60), mod(5, 60)]
    expect(dangerOf({ modules, fuseRemaining: 200 })).toBe(0)
  })

  test('五个模块全拆 = 炸弹已解除，引信再紧也没有危险', () => {
    const modules = [1, 2, 3, 4, 5].map((r) => mod(r, 10, true))
    expect(dangerOf({ modules, fuseRemaining: 5 })).toBe(0)
  })
})

describe('最危险的行（传染源）', () => {
  test('剩余秒数最少的未拆模块所在行', () => {
    const modules = [mod(1, 30), mod(2, 50), mod(3, 12), mod(4, 40), mod(5, 20)]
    expect(hottestRow(modules)).toBe(3)
  })

  test('已拆模块再快也不是传染源', () => {
    const modules = [mod(1, 30), mod(2, 50), mod(3, 0, true), mod(4, 40), mod(5, 20)]
    expect(hottestRow(modules)).toBe(5)
  })

  test('全部拆完 → 没有传染源', () => {
    expect(hottestRow([1, 2, 3, 4, 5].map((r) => mod(r, 10, true)))).toBeNull()
  })
})

const key = (c: { row: number; col: number }) => `${c.row}-${c.col}`

describe('错误值传染', () => {
  const base = { hottestRow: 4, cleanRows: [] as number[], totalRows: 8, seed: 'TEST01' }

  test('L0（危险度 < 0.3）不传染', () => {
    expect(pickInfectedCells({ ...base, danger: 0.29 })).toEqual([])
  })

  test('危险度拉满：真实 8 行的所有空白格全部感染，模块信息一格不盖', () => {
    // 独立事实来源：网格内容（data/gridRows + 各模块 UI）里真正空白的格子。
    // 模块行只有 C/H 列（Row1–2 只有 H）空着；G 列整列是 Row4 的数据区；A 列是行标题。
    const blank = [
      '1-8',
      '2-8',
      '3-3', // H3 是 v2 口令输入框（#52），不传染
      '4-3', '4-8',
      '5-3', '5-8',
      '6-2', '6-3', '6-4', '6-5', '6-6', '6-8',
      '7-2', '7-3', '7-4', '7-5', '7-6', '7-8',
      '8-2', '8-3', '8-4', '8-5', '8-6', '8-8',
    ]
    const infected = pickInfectedCells({ ...base, danger: 1 }).map(key)
    expect(infected.sort()).toEqual(blank.sort())
  })

  test('从最危险的行向外扩散：危险度 0.5 只感染传染源附近的格子', () => {
    // 30 行：真实 8 行 26 个空白格 + 22 行空表 × 8 = 202 个候选；
    // 比例 ((0.5 − 0.3) / 0.7)^2.2 ≈ 0.0635 → 202 × 0.0635 ≈ 12.8 → 13 格
    const infected = pickInfectedCells({ ...base, totalRows: 30, hottestRow: 20, danger: 0.5 })
    expect(infected).toHaveLength(13)
    for (const c of infected) expect(Math.abs(c.row - 20)).toBeLessThanOrEqual(3)
  })

  test('同一种子重放：传染位置与错误文本完全一致；换种子则不同', () => {
    const at = (seed: string) => pickInfectedCells({ ...base, totalRows: 30, danger: 0.7, seed })
    expect(at('TEST01')).toEqual(at('TEST01'))
    expect(at('OTHER2')).not.toEqual(at('TEST01'))
  })

  test('错误文本都是 Excel 错误值或经典乱码', () => {
    const known = ['#REF!', '#N/A', '#VALUE!', '#NULL!', '#DIV/0!', '锟斤拷', '####', '#NAME?', '烫烫烫', '#SPILL!']
    for (const c of pickInfectedCells({ ...base, totalRows: 30, danger: 1 })) expect(known).toContain(c.text)
  })

  test('危险度上升只新增格子，已感染的格子不换位、不换字', () => {
    const at = (danger: number) =>
      pickInfectedCells({ ...base, totalRows: 30, danger }).map((c) => `${key(c)}:${c.text}`)
    const lower = at(0.6)
    const higher = at(0.9)
    expect(higher.length).toBeGreaterThan(lower.length)
    expect(higher).toEqual(expect.arrayContaining(lower))
  })

  test('已拆的行被擦净后最后才会再被传染', () => {
    // 传染源 Row4，Row3 刚拆：Row2 / Row5 都已感染时 Row3 仍然干净
    const infected = pickInfectedCells({ ...base, totalRows: 30, hottestRow: 4, cleanRows: [3], danger: 0.75 })
    const rows = new Set(infected.map((c) => c.row))
    expect(rows.has(2)).toBe(true)
    expect(rows.has(5)).toBe(true)
    expect(rows.has(3)).toBe(false)
  })
})

describe('L3 列标变成 #REF!', () => {
  test('L3 以下列标完好', () => {
    expect(refHeaderCols(0.84)).toEqual([])
  })

  test('刚进 L3 先坏 E 列（倒计时那列），再从中间向两边坏', () => {
    expect(refHeaderCols(0.85)).toEqual([5])
    expect(refHeaderCols(0.925)).toEqual([5, 4, 6, 3])
  })

  test('危险度拉满时 A–H 全部 #REF!', () => {
    expect([...refHeaderCols(1)].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('危险分级：L0 < 0.3 ≤ L1 < 0.6 ≤ L2 < 0.85 ≤ L3', () => {
  test.each([
    [0, 0],
    [0.29, 0],
    [0.3, 1],
    [0.59, 1],
    [0.6, 2],
    [0.84, 2],
    [0.85, 3],
    [1, 3],
  ])('危险度 %s → L%s', (d, level) => {
    expect(dangerLevel(d)).toBe(level)
  })
})
