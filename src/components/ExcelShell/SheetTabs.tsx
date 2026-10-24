import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store'
import type { SheetId } from '../../store/sheetSlice'
import '../modules/skills.css'

/** 可点击切换的 Sheet（死循环命名彩蛋标签不在其列） */
const LIVE_TABS: { id: SheetId; name: string }[] = [
  { id: 'sheet1', name: 'Sheet1' },
  { id: 'sheet2', name: 'Sheet2' },
]

/** 废标签（Row7 考古区彩蛋）：可点，弹批注泡，不切换 sheet */
const DEAD_TABS = ['最终版_勿用', '真最终版(2)']
const DEAD_TAB_TIP = '考古现场。Sheet1 才是唯一真数据源'

export function SheetTabs() {
  const activeSheet = useGameStore((s) => s.activeSheet)
  const setSheet = useGameStore((s) => s.setSheet)
  const [tipTab, setTipTab] = useState<string | null>(null)
  const hideTimer = useRef(0)

  const showDeadTip = (name: string) => {
    setTipTab(name)
    window.clearTimeout(hideTimer.current)
    // 2.5–3.5s 自动消失（规格 2~4s）
    hideTimer.current = window.setTimeout(
      () => setTipTab(null),
      2500 + Math.round(Math.random() * 1000),
    )
  }

  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  return (
    <div className="sheet-tabs">
      {LIVE_TABS.map((tab) => (
        <div
          key={tab.id}
          className={`sheet-tab clickable${activeSheet === tab.id ? ' active' : ''}`}
          onClick={() => setSheet(tab.id)}
        >
          {tab.name}
        </div>
      ))}
      {DEAD_TABS.map((name) => (
        <div key={name} className="sheet-tab dead clickable" onClick={() => showDeadTip(name)}>
          {name}
          {tipTab === name ? <div className="dead-tab-pop">{DEAD_TAB_TIP}</div> : null}
        </div>
      ))}
    </div>
  )
}
