import { useGameStore } from '../../store'
import type { SheetId } from '../../store/sheetSlice'

/** 可点击切换的 Sheet（死循环命名彩蛋标签不在其列） */
const LIVE_TABS: { id: SheetId; name: string }[] = [
  { id: 'sheet1', name: 'Sheet1' },
  { id: 'sheet2', name: 'Sheet2' },
]

/** 废标签：纯占位彩蛋，不响应点击 */
const DEAD_TABS = ['最终版_勿用', '真最终版(2)']

/** Sheet 标签栏：Sheet1/Sheet2 随 store 高亮可切换，废标签纯占位不响应 */
export function SheetTabs() {
  const activeSheet = useGameStore((s) => s.activeSheet)
  const setSheet = useGameStore((s) => s.setSheet)

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
        <div key={name} className="sheet-tab dead">
          {name}
        </div>
      ))}
    </div>
  )
}
