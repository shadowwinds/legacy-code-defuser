import { create } from 'zustand'
import { isChatContact } from './dialogues'
import type { ChatContact, Contact, DialogueMessage, EndingKey } from './dialogues'
import { decideTier } from './throttle'
import { MESSAGE_SOUND_EVENT, TIER_SPEC } from './tiers'
import type { InterruptTier, MessageSoundDetail } from './tiers'

/** 已投递消息（聊天流数据源） */
export interface InboxItem {
  id: string
  contact: Contact
  text: string
  /** 节流后的实际档位 */
  tier: InterruptTier
  /** 投递时刻（epoch ms） */
  at: number
}

export interface ToastItem {
  /** 自增唯一键（同一消息不会重复投递，但 key 与 id 解耦便于 React 列表） */
  key: number
  messageId: string
  contact: Contact
  text: string
  tier: Exclude<InterruptTier, 'C'>
  /** 自动消失时刻（epoch ms） */
  expiresAt: number
}

/** 终局只读结局视图：本组消息 id 按吐入顺序累积 */
export interface EndingView {
  ending: EndingKey
  shownIds: string[]
}

export interface DesktopState {
  inbox: InboxItem[]
  unread: Record<ChatContact, number>
  chatOpen: boolean
  activeContact: ChatContact
  toasts: ToastItem[]
  toastCount: number
  lastToastAt: number | null
  /** 本局开场动画是否被玩家跳过（跳过补位条判据，pacing §5） */
  introSkipped: boolean
  endingView: EndingView | null
  /**
   * 投递一条消息：经 decideTier 节流判档 → 进 inbox → 非当前查看会话 +1 未读
   * → A/B 档入 toast 队列并广播提示音事件。终局后（endingView 非空）忽略。
   */
  deliver: (msg: Pick<DialogueMessage, 'id' | 'contact' | 'text'>, baseTier: InterruptTier) => void
  /** 打开聊天浮层（可指定会话，缺省保持当前会话），清该会话未读 */
  openChat: (contact?: ChatContact) => void
  closeChat: () => void
  toggleChat: () => void
  /** 切换会话并清其未读 */
  selectContact: (contact: ChatContact) => void
  dismissToast: (key: number) => void
  setIntroSkipped: () => void
  /** 进入结局视图：清空 toast，之后由 appendEndingBubble 逐条吐入 */
  startEndingView: (ending: EndingKey) => void
  appendEndingBubble: (id: string) => void
}

let toastSeq = 0

/**
 * 桌面壳状态（独立于游戏 RootState 的第二个 store）：只读订阅游戏 store，
 * 游戏 store 不感知桌面壳——引擎 100ms tick 不会因聊天/toast 变化重渲染。
 */
export const useDesktopStore = create<DesktopState>()((set, get) => ({
  inbox: [],
  unread: { boss: 0, hr: 0, wang: 0 },
  chatOpen: false,
  activeContact: 'boss',
  toasts: [],
  toastCount: 0,
  lastToastAt: null,
  introSkipped: false,
  endingView: null,

  deliver: (msg, baseTier) => {
    const s = get()
    if (s.endingView) return
    const now = Date.now()
    const tier = decideTier(baseTier, now, s)
    const viewing = s.chatOpen && s.activeContact === msg.contact
    const next: Partial<DesktopState> = {
      inbox: [...s.inbox, { id: msg.id, contact: msg.contact, text: msg.text, tier, at: now }],
    }
    if (isChatContact(msg.contact) && !viewing) {
      next.unread = { ...s.unread, [msg.contact]: s.unread[msg.contact] + 1 }
    }
    if (tier !== 'C') {
      next.toasts = [
        ...s.toasts,
        { key: ++toastSeq, messageId: msg.id, contact: msg.contact, text: msg.text, tier, expiresAt: now + TIER_SPEC[tier].toastMs },
      ]
      next.toastCount = s.toastCount + 1
      next.lastToastAt = now
    }
    set(next)
    const sound = TIER_SPEC[tier].sound
    if (sound) {
      window.dispatchEvent(new CustomEvent<MessageSoundDetail>(MESSAGE_SOUND_EVENT, { detail: { sound } }))
    }
  },

  openChat: (contact) => {
    const c = contact ?? get().activeContact
    set({ chatOpen: true, activeContact: c, unread: { ...get().unread, [c]: 0 } })
  },
  closeChat: () => set({ chatOpen: false }),
  toggleChat: () => (get().chatOpen ? get().closeChat() : get().openChat()),
  selectContact: (contact) => set({ activeContact: contact, unread: { ...get().unread, [contact]: 0 } }),
  dismissToast: (key) => set({ toasts: get().toasts.filter((t) => t.key !== key) }),
  setIntroSkipped: () => set({ introSkipped: true }),
  startEndingView: (ending) => set({ endingView: { ending, shownIds: [] }, toasts: [] }),
  appendEndingBubble: (id) => {
    const v = get().endingView
    if (!v || v.shownIds.includes(id)) return
    set({ endingView: { ...v, shownIds: [...v.shownIds, id] } })
  },
}))
