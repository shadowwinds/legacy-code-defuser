import { getTooltip } from '../../desktop/dialogues'

/** 桌面图标仅作开窗时的背景，不参与游戏交互。 */
export function DesktopIcons() {
  return (
    <div className="desktop-icons">
      <div className="desktop-icon" title={getTooltip('egg_taskbar_xl')}>
        <div className="desktop-glyph desktop-glyph-excel">X</div>
        核心业务<br />最终版_打死勿动<small>.xlsx</small>
      </div>
      <div className="desktop-icon" title={getTooltip('egg_taskbar_chat')}>
        <div className="desktop-glyph desktop-glyph-chat">💬</div>
        企业微信
      </div>
      <div className="desktop-icon" title={getTooltip('egg_recycle')}>
        <div className="desktop-glyph desktop-glyph-recycle">🗑️</div>
        回收站
      </div>
    </div>
  )
}
