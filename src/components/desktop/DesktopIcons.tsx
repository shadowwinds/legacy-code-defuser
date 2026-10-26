import spreadsheetIcon from '../../assets/icons/spreadsheet.png'
import workplaceChatIcon from '../../assets/icons/workplace-chat.png'
import { getTooltip } from '../../desktop/dialogues'

/** 桌面图标仅作开窗时的背景，不参与游戏交互。 */
export function DesktopIcons() {
  return (
    <div className="desktop-icons">
      <div className="desktop-icon" title={getTooltip('egg_taskbar_xl')}>
        <img className="desktop-glyph" src={spreadsheetIcon} alt="" draggable={false} />
        核心业务<br />最终版_打死勿动<small>.xlsx</small>
      </div>
      <div className="desktop-icon" title={getTooltip('egg_taskbar_chat')}>
        <img className="desktop-glyph" src={workplaceChatIcon} alt="" draggable={false} />
        企业微信
      </div>
      <div className="desktop-icon" title={getTooltip('egg_recycle')}>
        <div className="desktop-glyph desktop-glyph-recycle">🗑️</div>
        回收站
      </div>
    </div>
  )
}
