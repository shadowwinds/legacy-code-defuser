import { FUSE_INITIAL_SEC } from '../store/engineSlice'


const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * 剩余引信秒数 → HH:MM:SS 时钟文本：归零 ↔ 截止钟点整点，引信满 ↔ 往前 240 秒。
 * v1 截止 17 点（16:56:00 → 17:00:00）；v2 按时间场景（#55），24 点显示为 00:00:00。
 */
export function formatFuseClock(fuseRemaining: number, deadlineHour = 17): string {
  const elapsed = Math.min(FUSE_INITIAL_SEC, Math.max(0, FUSE_INITIAL_SEC - fuseRemaining))
  const total = deadlineHour * 3600 - FUSE_INITIAL_SEC + Math.floor(elapsed + 1e-9)
  return `${pad2(Math.floor(total / 3600) % 24)}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`
}
