import { useState } from 'react'
import { getRunConfig } from '../../lib/seed'
import { useGameStore } from '../../store'
import './macroWarningBar.css'

/**
 * 公式栏上方的宏安全警告条（外壳变量 M，GDD 07 §7.2）。
 * 只在 v2 且本局局面有警告条时出现；【启用内容】纯装饰，点了不改变任何局面。
 */
export function MacroWarningBar() {
  const macroBar = useGameStore((s) => s.situation.macroBar)
  const [quip, setQuip] = useState(false)
  if (!getRunConfig().v2 || !macroBar) return null
  return (
    <div className="macro-bar" role="status">
      <span className="macro-bar-icon" aria-hidden="true">⚠</span>
      <strong>安全警告</strong>
      <span>宏已被禁用。</span>
      <button type="button" className="macro-bar-btn" onClick={() => setQuip(true)}>
        启用内容
      </button>
      {quip ? <span className="macro-bar-quip">老王：宏一开，生产环境就真炸了。别点。</span> : null}
    </div>
  )
}
