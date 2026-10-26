import spreadsheetIcon from '../../assets/icons/spreadsheet.png'
import workplaceChatIcon from '../../assets/icons/workplace-chat.png'
import { useDesktopStore } from '../../desktop/desktopStore'
import { getTooltip } from '../../desktop/dialogues'
import { formatFuseClock } from '../../lib/clock'
import { useGameStore } from '../../store'

/** 秒级时钟订阅，避免引擎每个 tick 都重渲染任务栏。 */
export function Taskbar() {
  const clock = useGameStore((s) => formatFuseClock(s.fuseRemaining))
  const unread = useDesktopStore((s) => s.unread.boss + s.unread.hr + s.unread.wang)
  const chatOpen = useDesktopStore((s) => s.chatOpen)

  return (
    <div className="desktop-taskbar">
      <div className="tb-start" aria-hidden="true">⊞</div>
      <div className="tb-app tb-on" title={getTooltip('egg_taskbar_xl')}>
        <img className="tb-icon" src={spreadsheetIcon} alt="" draggable={false} />
        <span className="tb-dot" />
      </div>
      <button
        type="button"
        className={`tb-app${chatOpen ? ' tb-on' : ''}`}
        aria-label="企业微信"
        aria-pressed={chatOpen}
        title={getTooltip('egg_taskbar_chat')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => useDesktopStore.getState().toggleChat()}
      >
        <img className="tb-icon" src={workplaceChatIcon} alt="" draggable={false} />
        {unread > 0 && <span className="tb-unread">{unread > 99 ? '99+' : unread}</span>}
      </button>
      <div className="tb-app" aria-hidden="true">📁</div>
      <div className="tb-clock">
        <b>{clock}</b>
        <small>2026/10/24 周五</small>
      </div>
    </div>
  )
}
