/** 网格尺寸常量与地址工具（8 行 × A–H 列） */
export const ROW_COUNT = 8
export const COL_COUNT = 8

export function colLetter(col: number): string {
  return String.fromCharCode(64 + col)
}

export function cellAddress(row: number, col: number): string {
  return `${colLetter(col)}${row}`
}

/** 整行选中时名称框显示的地址，如 "A3:H3" */
export function rowAddress(row: number): string {
  return `A${row}:${colLetter(COL_COUNT)}${row}`
}
