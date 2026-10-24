import { useEffect, useState } from 'react'
import { useGameStore } from '../../store'
import './systemBroadcast.css'

/** 通知显示时长（ms） */
const TOAST_VISIBLE_MS = 5000
/** 相邻通知出场间隔（ms）：开局 12s 内三条全部亮相 */
const TOAST_STAGGER_MS = 3500

/** GDD 03 §3.4 开场系统通知批注滚动播报（纯氛围，不可交互） */
const BROADCASTS = [
  '【系统提示】2013 年 Flash 登录桥已于 2019 年光荣退休，死于浏览器停服，享年 6 岁。',
  '【系统提示】sleep(5000) 已在上一任手里优化为 sleep(9999)，性能负优化大师后继有人。',
  '【系统提示】正则校验模块匹配第 10 万个字符时 CPU 99%，建议配台上限 99999。',
]

/**
 * 开场系统通知（issue #27）：右下角 Win98 气球逐条弹出自动消失，
 * pointer-events 全程 none 不挡操作；终局后不再出新条。
 */
export function SystemBroadcast() {
  const status = useGameStore((s) => s.status)
  const [idx, setIdx] = useState<number | null>(null)

  useEffect(() => {
    const timers: number[] = []
    for (let i = 0; i < BROADCASTS.length; i++) {
      // 出场前确认仍在对局中（终局/已重开则静默）
      timers.push(
        window.setTimeout(() => {
          if (useGameStore.getState().status !== 'playing') return
          setIdx(i)
        }, TOAST_STAGGER_MS * i),
      )
      timers.push(window.setTimeout(() => setIdx(null), TOAST_STAGGER_MS * i + TOAST_VISIBLE_MS))
    }
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  if (status !== 'playing' || idx === null) return null

  return (
    <div className="sys-broadcast" aria-live="polite">
      <div key={idx} className="sys-toast">
        {BROADCASTS[idx]}
      </div>
    </div>
  )
}
