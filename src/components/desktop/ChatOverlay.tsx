import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDesktopStore } from '../../desktop/desktopStore'
import { CHAT_CONTACTS, CONTACT_META, getMessage, getTooltip } from '../../desktop/dialogues'
import type { ChatContact, Contact } from '../../desktop/dialogues'
import { ChatBubble } from './ChatBubble'
import './chat.css'

/** 气泡流最小行数据：inbox 条目与分镜消息都归一到这个形状 */
interface ChatLine {
  id: string
  contact: Contact
  text: string
}

/** 老王会话的固定历史（开场回忆杀留在聊天记录里的那几条，双时间轴衔接点） */
const WANG_HISTORY_IDS = ['sb_02', 'sb_03', 'sb_04', 'sb_05', 'sb_06'] as const
/** sb_06 下方渲染成红色回执（拒收条的上文） */
const WANG_RECEIPT_ID = 'sb_07'
/** 最后一条消息到达后「对方正在输入…」的存活时长 */
const TYPING_MS = 1500

function getWangHistory(): ChatLine[] {
  return WANG_HISTORY_IDS.map((id) => getMessage(id)).filter((m): m is NonNullable<typeof m> => m !== undefined)
}

/** 单行消息：头像 + 气泡（system 无头像，ChatBubble 自己渲染成灰条） */
function ChatRow({ msg }: { msg: ChatLine }) {
  if (msg.contact === 'system') return <ChatBubble contact={msg.contact} text={msg.text} />
  const meta = CONTACT_META[msg.contact]
  return (
    <div className={`chat-msg${msg.contact === 'player' ? ' chat-msg-me' : ''}`}>
      <span className="chat-av" style={{ background: meta.color }}>
        {meta.avatar}
      </span>
      <ChatBubble contact={msg.contact} text={msg.text} />
    </div>
  )
}

/** 聊天浮层：会话列表 + 气泡流 + 底部状态条。只渲染，不触发（T5）；终局后让位 EndingChat（T6）。 */
export function ChatOverlay() {
  const chatOpen = useDesktopStore((s) => s.chatOpen)
  const endingOpen = useDesktopStore((s) => s.endingView !== null)
  const activeContact = useDesktopStore((s) => s.activeContact)
  const unread = useDesktopStore((s) => s.unread)
  const inbox = useDesktopStore((s) => s.inbox)

  // inbox 本身按投递时间追加，过滤后天然升序
  const conv = useMemo(
    () => (activeContact === 'wang' ? getWangHistory() : inbox.filter((m) => m.contact === activeContact)),
    [inbox, activeContact],
  )
  // boss/hr 会话才有「对方正在输入…」与「已读」（玩家不产生文本，契约 §4.5）
  const lastAt = useMemo(() => {
    if (activeContact === 'wang') return 0
    const list = inbox.filter((m) => m.contact === activeContact)
    return list[list.length - 1]?.at ?? 0
  }, [inbox, activeContact])

  const msgsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [inbox, activeContact])

  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (lastAt === 0) {
      setTyping(false)
      return
    }
    const remain = TYPING_MS - (Date.now() - lastAt)
    if (remain <= 0) {
      setTyping(false)
      return
    }
    setTyping(true)
    const t = window.setTimeout(() => setTyping(false), remain)
    return () => window.clearTimeout(t)
  }, [lastAt])

  if (!chatOpen || endingOpen) return null

  const meta = CONTACT_META[activeContact]

  return (
    <div className="chat-win">
      <div className="chat-titlebar" title={getTooltip('egg_chat_title')}>
        <span className="chat-appname">企业微信</span>
        <span className="chat-winbtns">
          <button
            type="button"
            className="chat-winbtn"
            aria-label="收起"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => useDesktopStore.getState().closeChat()}
          >
            —
          </button>
          <span className="chat-winbtn chat-winbtn-disabled" aria-hidden="true">□</span>
          <button
            type="button"
            className="chat-winbtn"
            aria-label="关闭"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => useDesktopStore.getState().closeChat()}
          >
            ✕
          </button>
        </span>
      </div>
      <div className="chat-body">
        <div className="chat-list">
          {CHAT_CONTACTS.map((c: ChatContact) => {
            const m = CONTACT_META[c]
            return (
              <div
                key={c}
                className={`chat-item${c === activeContact ? ' chat-item-on' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => useDesktopStore.getState().selectContact(c)}
              >
                <span className="chat-item-av" style={{ background: m.color }}>
                  {m.avatar}
                </span>
                <span className="chat-item-n">
                  {m.name}
                  <small>{m.subtitle}</small>
                </span>
                {unread[c] > 0 && <span className="chat-item-red">{unread[c]}</span>}
              </div>
            )
          })}
        </div>
        <div className="chat-flow">
          <div className="chat-head">
            {meta.name} · {meta.subtitle}
          </div>
          {conv.length === 0 ? (
            <div className="chat-empty">暂无消息</div>
          ) : (
            <div ref={msgsRef} className="chat-msgs">
              {conv.map((m) => (
                <ChatRow key={m.id} msg={m} />
              ))}
              {activeContact === 'wang' && getMessage(WANG_RECEIPT_ID) && (
                <div className="chat-receipt">{getMessage(WANG_RECEIPT_ID)!.text}</div>
              )}
              {activeContact !== 'wang' && conv.length > 0 && <div className="chat-read">已读</div>}
            </div>
          )}
          {activeContact === 'wang' ? (
            <div className="chat-blocked">{getTooltip('egg_wang_blocked')}</div>
          ) : (
            <div className="chat-statusbar">{typing ? '对方正在输入…' : ''}</div>
          )}
        </div>
      </div>
    </div>
  )
}
