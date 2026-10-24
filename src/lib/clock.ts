import { FUSE_INITIAL_SEC } from '../store/engineSlice'

/** 引信满（240s）对应的一天内秒数：16:56:00 */
const CLOCK_START_SEC = 16 * 3600 + 56 * 60

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 剩余引信秒数 → HH:MM:SS 时钟文本（240 ↔ 16:56:00，每走 1s +1，归零 ↔ 17:00:00） */
export function formatFuseClock(fuseRemaining: number): string {
  const elapsed = Math.min(FUSE_INITIAL_SEC, Math.max(0, FUSE_INITIAL_SEC - fuseRemaining))
  const total = CLOCK_START_SEC + Math.floor(elapsed + 1e-9)
  return `${pad2(Math.floor(total / 3600) % 24)}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`
}
