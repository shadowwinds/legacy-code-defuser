import { useGameStore } from '../store'
import './endOverlay.css'

/**
 * 终局全屏遮罩（简版）：居中大字结局文案 +「重新开始」。
 * Win98 弹窗残影属后续票。
 */
export function EndOverlay() {
  const status = useGameStore((s) => s.status)
  const endReason = useGameStore((s) => s.endReason)

  if (status === 'playing') return null

  return (
    <div className={`end-overlay ${status}`}>
      <div className="end-text">{endReason ?? ''}</div>
      <button className="end-restart" onClick={() => location.reload()}>
        重新开始
      </button>
    </div>
  )
}
