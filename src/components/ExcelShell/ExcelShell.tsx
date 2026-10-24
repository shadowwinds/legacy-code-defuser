import { useEffect } from 'react'
import { useGameStore } from '../../store'
import { FormulaBar } from './FormulaBar'
import { Grid } from './Grid'
import { ManualSheet } from './ManualSheet'
import { Ribbon } from './Ribbon'
import { SheetTabs } from './SheetTabs'
import { StatusBar } from './StatusBar'
import { TitleBar } from './TitleBar'
import './excelShell.css'

/**
 * 高仿 Excel 2016 的游戏外壳。
 * 后续票挂载位：Grid 的 Row1–Row5 模块组件、Ribbon 技能按钮逻辑、
 * fx 公式栏与状态栏的动态数值。
 * Sheet1/Sheet2 常驻挂载（引擎挂点不可卸载），由 CSS 显隐切换；
 * Tab 键在两个 Sheet 间全屏切换。
 */
export function ExcelShell() {
  const activeSheet = useGameStore((s) => s.activeSheet)
  const toggleSheet = useGameStore((s) => s.toggleSheet)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        toggleSheet()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSheet])

  return (
    <div className="excel-shell">
      <TitleBar />
      <Ribbon />
      <FormulaBar />
      <div className={`sheet-pane${activeSheet === 'sheet1' ? ' active' : ''}`}>
        <Grid />
      </div>
      <div className={`sheet-pane${activeSheet === 'sheet2' ? ' active' : ''}`}>
        <ManualSheet />
      </div>
      <SheetTabs />
      <StatusBar />
    </div>
  )
}
