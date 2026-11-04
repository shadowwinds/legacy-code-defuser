import { useState } from 'react'
import { isMuted, toggleMute } from '../../audio/tick'
import { getRunConfig } from '../../lib/seed'
import { workbookName } from '../../rules/situation'
import { useGameStore } from '../../store'

export function TitleBar() {
  const [muted, setMuted] = useState(isMuted())
  const situation = useGameStore((s) => s.situation)
  // v2：文件名带本局版本号（外壳变量 V）；v1 保持原标题
  const fileName = getRunConfig().v2 ? workbookName(situation) : '核心业务_最终版_打死勿动.xlsx'

  return (
    <div className="titlebar">
      <div className="qat">
        <span>💾</span>
        <span>↶</span>
        <span>↷</span>
      </div>
      <div className="title">{fileName} (未激活的产品)</div>
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
