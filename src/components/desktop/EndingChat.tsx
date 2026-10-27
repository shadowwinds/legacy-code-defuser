import { useLayoutEffect, useRef } from 'react'
import { useDesktopStore } from '../../desktop/desktopStore'
import { CONTACT_META, getMessage } from '../../desktop/dialogues'
import { ChatBubble } from './ChatBubble'
import { ContactAvatar } from './ContactAvatar'
import './endingChat.css'

/**
 * 终局只读结局视图（T6）：本组结局消息按吐入顺序合并成一条时间线（不按会话拆，
 * fuse 组 4 条分属 4 个联系人，弹窗下不能切会话）。pointer-events none——可回看不可交互。
 * 结局气泡无声（不走 deliver）；老王的消息照常显示，无拒收条。
 */
export function EndingChat() {
  const endingView = useDesktopStore((s) => s.endingView)
  const msgsRef = useRef<HTMLDivElement>(null)

  // 新气泡吐入 / 视图建立时滚到底
  useLayoutEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [endingView])

  if (!endingView) return null

  return (
    <div className="ending-chat">
      <div className="ending-chat-titlebar">企业微信 · 下班前最后的消息</div>
      <div ref={msgsRef} className="ending-chat-msgs">
        {endingView.shownIds.map((id) => {
          const m = getMessage(id)
          if (!m) return null
          if (m.contact === 'system') return <ChatBubble key={id} contact={m.contact} text={m.text} />
          const meta = CONTACT_META[m.contact]
          return (
            <div key={id} className={`ending-chat-item${m.contact === 'player' ? ' ending-chat-item-me' : ''}`}>
              <span className="ending-chat-who">
                <ContactAvatar contact={m.contact} className="ending-chat-av" />
                {meta.name}
              </span>
              <ChatBubble contact={m.contact} text={m.text} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
