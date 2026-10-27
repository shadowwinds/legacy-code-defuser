// 启动 Vite 后访问 /tests/browser/chat-scroll.html；使用真实 DOM 验证滚动，无需额外测试依赖。
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatOverlay } from '../../src/components/desktop/ChatOverlay'
import { useDesktopStore } from '../../src/desktop/desktopStore'
import { MESSAGES } from '../../src/desktop/dialogues'
import '../../src/styles/global.css'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const output = document.getElementById('result')!
const results: string[] = []

async function update(action: () => void) {
  await act(async () => { action() })
}

function expectBottom(scenario: string) {
  const el = document.querySelector<HTMLDivElement>('.chat-msgs')!
  const bottom = el.scrollHeight - el.clientHeight
  if (bottom <= 0) throw new Error(`${scenario}: 测试消息不足以产生滚动`)
  if (Math.abs(el.scrollTop - bottom) > 1) {
    throw new Error(`${scenario}: scrollTop=${el.scrollTop}, 预期=${bottom}`)
  }
  results.push(`PASS ${scenario}: scrollTop=${el.scrollTop}, bottom=${bottom}`)
}

async function run() {
  await update(() => createRoot(document.getElementById('root')!).render(<ChatOverlay />))
  await update(() => {
    MESSAGES.filter(m => m.category === 'push' && m.contact === 'boss')
      .forEach(m => useDesktopStore.getState().deliver(m, 'C'))
  })
  await update(() => useDesktopStore.getState().openChat('boss'))
  expectBottom('关闭期间收消息，首次打开同一会话')

  await update(() => useDesktopStore.getState().closeChat())
  await update(() => useDesktopStore.getState().openChat('boss'))
  expectBottom('无新消息时关闭再打开')

  await update(() => useDesktopStore.getState().closeChat())
  await update(() => useDesktopStore.getState().deliver({
    id: 'scroll-regression-closed', contact: 'boss', text: '关闭聊天期间收到的新消息。',
  }, 'C'))
  await update(() => useDesktopStore.getState().openChat('boss'))
  expectBottom('再次关闭期间收到新消息后重开')

  await update(() => useDesktopStore.getState().deliver({
    id: 'scroll-regression-open', contact: 'boss', text: '聊天打开期间收到的新消息。',
  }, 'C'))
  expectBottom('会话打开期间收到新消息')

  await update(() => useDesktopStore.getState().selectContact('hr'))
  await update(() => useDesktopStore.getState().selectContact('boss'))
  expectBottom('切换会话后返回')
  output.dataset.status = 'passed'
}

run().catch(error => {
  output.dataset.status = 'failed'
  results.push(`FAIL ${error.message}`)
}).finally(() => { output.textContent = results.join('\n') })
