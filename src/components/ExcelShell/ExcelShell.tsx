import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store'
import { FormatSelect } from '../modules/FormatSelect'
import './excelShell.css'
import '../modules/row3.css'
import { FormulaBar } from './FormulaBar'
import { Grid } from './Grid'
import { ManualSheet } from './ManualSheet'
import { NarrowScreenNotice } from './NarrowScreenNotice'
import { Ribbon } from './Ribbon'
import { SheetTabs } from './SheetTabs'
import { StatusBar } from './StatusBar'
import { SystemBroadcast } from './SystemBroadcast'
import { TitleBar } from './TitleBar'
import './excelShell.css'

/**
 * 高仿 Excel 2016 的游戏外壳。
 * 后续票挂载位：Grid 的 Row1–Row5 模块组件、Ribbon 技能按钮逻辑、
 * fx 公式栏与状态栏的动态数值。
 * Sheet1/Sheet2 常驻挂载（引擎挂点不可卸载），由 CSS 显隐切换；
 * Tab 键在两个 Sheet 间全屏切换（#27：带方向性滑动过渡）。
 */
export function ExcelShell() {
  const activeSheet = useGameStore((s) => s.activeSheet)
  const toggleSheet = useGameStore((s) => s.toggleSheet)
  // 切换方向：sheet1→sheet2 前向（左入），sheet2→sheet1 后向（右入）
  const prevSheet = useRef(activeSheet)
  const [slideDir, setSlideDir] = useState<'fwd' | 'back'>('fwd')
  if (prevSheet.current !== activeSheet) {
    setSlideDir(prevSheet.current === 'sheet1' ? 'fwd' : 'back')
    prevSheet.current = activeSheet
  }

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
      <div className="formula-bar-anchor">
        <FormulaBar />
        <FormatSelect />
      </div>
      <div className={`sheet-pane${activeSheet === 'sheet1' ? ` active slide-${slideDir}` : ''}`}>
        <Grid />
      </div>
      <div className={`sheet-pane${activeSheet === 'sheet2' ? ` active slide-${slideDir}` : ''}`}>
        <ManualSheet />
      </div>
      <SheetTabs />
      <StatusBar />
      <SystemBroadcast />
      <NarrowScreenNotice />
    </div>
  )
}
