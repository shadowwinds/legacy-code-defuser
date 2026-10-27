import { useEffect, useState } from 'react'
import { useDesktopStore } from '../../desktop/desktopStore'
import type { ToastItem } from '../../desktop/desktopStore'
import { CONTACT_META, isChatContact } from '../../desktop/dialogues'
import { ENTER_ANIM_MS } from '../../desktop/tiers'
import { useGameStore } from '../../store'
import { ContactAvatar } from './ContactAvatar'
import './toast.css'

/** 离场淡出时长 = 入场时长，同一节奏预算 */
const EXIT_ANIM_MS = ENTER_ANIM_MS

/**
 * 单条 toast：挂载时按 expiresAt 定时离场（淡出后再从 store 移除）。
 * 定时器挂在自己的 effect 里，卸载即清理，不碰引擎约束。
 */
function ToastRow({ t }: { t: ToastItem }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setLeaving(true), Math.max(0, t.expiresAt - Date.now()))
    return () => window.clearTimeout(id)
  }, [t.expiresAt])

  useEffect(() => {
    if (!leaving) return
    const id = window.setTimeout(() => useDesktopStore.getState().dismissToast(t.key), EXIT_ANIM_MS)
    return () => window.clearTimeout(id)
  }, [leaving, t.key])

  const meta = CONTACT_META[t.contact]
  const onClick = () => {
    if (leaving) return
    if (isChatContact(t.contact)) useDesktopStore.getState().openChat(t.contact)
    setLeaving(true)
  }

  return (
    <div
      className={`toast-item${t.tier === 'A' ? ' toast-item-a' : ''}${leaving ? ' toast-item-leaving' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <ContactAvatar contact={t.contact} className="toast-avatar" />
      <span className="toast-tx">
        <b>{meta.name}</b>
        <span>{t.text}</span>
        <small>刚刚 · 点击打开聊天</small>
      </span>
    </div>
  )
}

/** 右上角 toast 层：只在 playing 中显示，节流后同屏理论上仅 1 条（slice(-2) 兜底）。 */
export function ToastLayer() {
  const toasts = useDesktopStore((s) => s.toasts)
  const status = useGameStore((s) => s.status)
  if (status !== 'playing') return null

  return (
    <div className="toast-layer">
      {toasts.slice(-2).map((t) => (
        <ToastRow key={t.key} t={t} />
      ))}
    </div>
  )
}
