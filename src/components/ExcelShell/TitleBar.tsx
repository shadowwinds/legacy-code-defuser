import { useState } from 'react'
import { isMuted, toggleMute } from '../../audio/tick'

export function TitleBar() {
  const [muted, setMuted] = useState(isMuted())

  return (
    <div className="titlebar">
      <div className="qat">
        <span>💾</span>
        <span>↶</span>
        <span>↷</span>
      </div>
      <div className="title">核心业务_最终版_打死勿动.xlsx (未激活的产品)</div>
      <button
        type="button"
        className="mute-btn"
        title={muted ? '取消静音' : '静音'}
        onClick={() => setMuted(toggleMute())}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="win-controls">
        <span>─</span>
        <span>☐</span>
        <span>✕</span>
      </div>
    </div>
  )
}
