import bossAvatar from '../../assets/avatars/boss.webp'
import hrAvatar from '../../assets/avatars/hr.webp'
import wangAvatar from '../../assets/avatars/wang.webp'
import playerAvatar from '../../assets/avatars/player.webp'
import { CONTACT_META, type Contact } from '../../desktop/dialogues'
import './contactAvatar.css'

const PORTRAITS: Partial<Record<Contact, string>> = {
  boss: bossAvatar,
  hr: hrAvatar,
  wang: wangAvatar,
  player: playerAvatar,
}

/** 所有聊天场景共用人物头像；系统通知保留符号。 */
export function ContactAvatar({ contact, className }: { contact: Contact; className: string }) {
  const meta = CONTACT_META[contact]
  const portrait = PORTRAITS[contact]
  return (
    <span className={`contact-avatar ${className}`} style={{ background: meta.color }} aria-hidden="true">
      {portrait ? <img src={portrait} alt="" draggable={false} /> : meta.avatar}
    </span>
  )
}
