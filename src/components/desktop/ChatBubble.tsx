import type { Contact } from '../../desktop/dialogues'
import './chat.css'

/**
 * 单条气泡（不含头像/名字，由调用方排版）：system 居中灰条，
 * player 靠右绿底，其余靠左白底。T6 结局视图只读复用。
 */
export function ChatBubble({ contact, text }: { contact: Contact; text: string }) {
  if (contact === 'system') return <div className="chat-sysline">{text}</div>
  return <div className={`chat-bubble${contact === 'player' ? ' chat-bubble-me' : ''}`}>{text}</div>
}
