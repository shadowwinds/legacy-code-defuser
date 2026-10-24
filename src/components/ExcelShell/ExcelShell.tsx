import { FormulaBar } from './FormulaBar'
import { Grid } from './Grid'
import { Ribbon } from './Ribbon'
import { SheetTabs } from './SheetTabs'
import { StatusBar } from './StatusBar'
import { TitleBar } from './TitleBar'
import './excelShell.css'

/**
 * 高仿 Excel 2016 的游戏外壳（issue #2 静态骨架）。
 * 后续票挂载位：Grid 的 Row1–Row5 模块组件、Ribbon 技能按钮逻辑、
 * fx 公式栏与状态栏的动态数值。
 */
export function ExcelShell() {
  return (
    <div className="excel-shell">
      <TitleBar />
      <Ribbon />
      <FormulaBar />
      <Grid />
      <SheetTabs />
      <StatusBar />
    </div>
  )
}
