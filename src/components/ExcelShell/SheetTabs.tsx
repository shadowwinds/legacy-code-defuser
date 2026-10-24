/** Sheet 标签栏：Sheet1（激活态）/Sheet2 + 两个废标签，本票纯占位不响应 */
const SHEETS = [
  { name: 'Sheet1', active: true },
  { name: 'Sheet2', active: false },
  { name: '最终版_勿用', active: false },
  { name: '真最终版(2)', active: false },
]

export function SheetTabs() {
  return (
    <div className="sheet-tabs">
      {SHEETS.map((sheet) => (
        <div key={sheet.name} className={`sheet-tab${sheet.active ? ' active' : ''}`}>
          {sheet.name}
        </div>
      ))}
    </div>
  )
}
