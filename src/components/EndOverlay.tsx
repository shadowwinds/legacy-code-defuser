import { useState } from 'react'
import { useGameStore } from '../store'
import './endOverlay.css'

/**
 * 终局 Win98 弹窗（issue #26，GDD 05 M4）：灰底 3D 浮雕对话框 + 蓝标题栏，双结局分型。
 * - won「Microsoft Excel · 是否保存修改?」→【不保存，直接跑路!】重开（保存键弹吐槽）；
 * - exploded「严重错误」→ endReason 文案 +【重新开始】。
 * 大结局文案居对话框上方，保留「XX 当场爆炸。」的冲击力。
 */
export function EndOverlay() {
  const status = useGameStore((s) => s.status)
  const endReason = useGameStore((s) => s.endReason)
  const [saveClicked, setSaveClicked] = useState(false)

  if (status === 'playing') return null
  const won = status === 'won'

  return (
    <div className={`end-overlay ${status}`}>
      <div className="end-text">{endReason ?? ''}</div>
      <div className={`win98-dialog${won ? ' won' : ' exploded'}`} role="dialog" aria-label={won ? '是否保存修改' : '严重错误'}>
        <div className="win98-titlebar">
          <span className="win98-title-icon">{won ? '📄' : '⚠️'}</span>
          <span className="win98-title">{won ? 'Microsoft Excel' : '严重错误'}</span>
          <span className="win98-close" aria-hidden="true">✕</span>
        </div>
        <div className="win98-body">
          {won ? (
            <>
              <div className="win98-msg">
                <span className="win98-msg-icon" aria-hidden="true">💾</span>
                <span>
                  是否保存对「核心业务_最终版_打死勿动.xlsx」的修改?
                  {saveClicked ? <span className="win98-save-quip">……你认真的?这表可是会自爆的。</span> : null}
                </span>
              </div>
              <div className="win98-actions">
                <button type="button" className="win98-btn" onClick={() => setSaveClicked(true)}>
                  保存并继续加班
                </button>
                <button type="button" className="win98-btn primary" onClick={() => location.reload()}>
                  不保存，直接跑路!
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="win98-msg">
                <span className="win98-msg-icon" aria-hidden="true">💥</span>
                <span>{endReason ?? '发生严重错误。'}</span>
              </div>
              <div className="win98-actions">
                <button type="button" className="win98-btn primary" onClick={() => location.reload()}>
                  重新开始
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
