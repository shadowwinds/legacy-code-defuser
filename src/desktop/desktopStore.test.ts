import { expect, test, vi } from 'vitest'

test('A 档投递写入消息、未读和 6 秒 toast，并广播 urgent', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const sound = vi.fn()
  window.addEventListener('lcd:message', sound)

  useDesktopStore.getState().deliver({ id: 't', contact: 'boss', text: '测试' }, 'A')

  const s = useDesktopStore.getState()
  expect(s.inbox).toEqual([{ id: 't', contact: 'boss', text: '测试', tier: 'A', at: Date.now() }])
  expect(s.unread.boss).toBe(1)
  expect(s.toasts).toHaveLength(1)
  expect(s.toasts[0].expiresAt).toBe(Date.now() + 6000)
  expect(s.toastCount).toBe(1)
  expect(s.lastToastAt).toBe(Date.now())
  expect(sound).toHaveBeenCalledOnce()
  expect((sound.mock.calls[0][0] as CustomEvent).detail).toEqual({ sound: 'urgent' })
})

test('B 档忽略 JSON 的旧 interruptible 值，仍投递 4 秒 toast 和 ding', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const { getPushByEvent } = await import('./dialogues')
  const { tierOf } = await import('./tiers')
  const sound = vi.fn()
  window.addEventListener('lcd:message', sound)
  const msg = getPushByEvent('first_manual_switch')!

  useDesktopStore.getState().deliver(msg, tierOf(msg.id))

  expect(useDesktopStore.getState().toasts[0].expiresAt).toBe(Date.now() + 4000)
  expect((sound.mock.calls[0][0] as CustomEvent).detail).toEqual({ sound: 'ding' })
})

test('C 档技能消息以 pacing 为准，只留未读，不沿用 JSON 的 ding', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const { getPushByEvent } = await import('./dialogues')
  const { tierOf } = await import('./tiers')
  const sound = vi.fn()
  window.addEventListener('lcd:message', sound)
  const msg = getPushByEvent('skill_format_brush')!

  useDesktopStore.getState().deliver(msg, tierOf(msg.id))

  const s = useDesktopStore.getState()
  expect(s.inbox).toHaveLength(1)
  expect(s.unread.hr).toBe(1)
  expect(s.toasts).toHaveLength(0)
  expect(s.toastCount).toBe(0)
  expect(sound).not.toHaveBeenCalled()
})

test('打开或切换会话清除该联系人未读，查看中的新消息保持已读', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const s = useDesktopStore.getState()
  s.deliver({ id: 'boss1', contact: 'boss', text: '甲方消息' }, 'C')
  s.deliver({ id: 'hr1', contact: 'hr', text: 'HR 消息' }, 'C')
  s.openChat('boss')
  s.deliver({ id: 'boss2', contact: 'boss', text: '查看中的消息' }, 'C')
  expect(useDesktopStore.getState().unread).toEqual({ boss: 0, hr: 1, wang: 0 })

  s.selectContact('hr')
  expect(useDesktopStore.getState().unread.hr).toBe(0)
  s.closeChat()
  s.deliver({ id: 'hr2', contact: 'hr', text: '关闭后消息' }, 'C')
  expect(useDesktopStore.getState().unread.hr).toBe(1)
  s.toggleChat()
  expect(useDesktopStore.getState().chatOpen).toBe(true)
  expect(useDesktopStore.getState().unread.hr).toBe(0)
  s.toggleChat()
  expect(useDesktopStore.getState().chatOpen).toBe(false)
})

test('系统和玩家消息不创建会话未读，关闭 toast 保留每局预算', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const s = useDesktopStore.getState()
  s.deliver({ id: 'sys', contact: 'system', text: '系统消息' }, 'B')
  s.deliver({ id: 'player', contact: 'player', text: '回忆分镜' }, 'C')
  s.dismissToast(useDesktopStore.getState().toasts[0].key)

  expect(useDesktopStore.getState().unread).toEqual({ boss: 0, hr: 0, wang: 0 })
  expect(useDesktopStore.getState().toasts).toHaveLength(0)
  expect(useDesktopStore.getState().toastCount).toBe(1)
})

test('结局清空 toast 并停止局内投递，结局气泡按序追加且不重复', async () => {
  const { useDesktopStore } = await import('./desktopStore')
  const s = useDesktopStore.getState()
  s.appendEndingBubble('ignored')
  expect(useDesktopStore.getState().endingView).toBeNull()
  s.setIntroSkipped()
  expect(useDesktopStore.getState().introSkipped).toBe(true)
  s.deliver({ id: 'before', contact: 'boss', text: '终局前' }, 'A')
  s.startEndingView('row4')
  const sound = vi.fn()
  window.addEventListener('lcd:message', sound)
  s.deliver({ id: 'after', contact: 'boss', text: '终局后' }, 'A')
  s.appendEndingBubble('ed_row4_01')
  s.appendEndingBubble('ed_row4_01')
  s.appendEndingBubble('ed_row4_02')

  expect(useDesktopStore.getState().toasts).toHaveLength(0)
  expect(useDesktopStore.getState().inbox.map((m) => m.id)).toEqual(['before'])
  expect(useDesktopStore.getState().unread.boss).toBe(1)
  expect(sound).not.toHaveBeenCalled()
  expect(useDesktopStore.getState().endingView).toEqual({ ending: 'row4', shownIds: ['ed_row4_01', 'ed_row4_02'] })
})
