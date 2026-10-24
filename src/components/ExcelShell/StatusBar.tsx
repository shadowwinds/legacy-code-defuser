import { useGameStore } from '../../store'
import { formatFuseClock } from '../../lib/clock'

/** 底部状态栏：左侧求和占位 + 全局引信时钟，右侧就绪占位 */
export function StatusBar() {
  // 格式化收敛为秒级字符串：同一秒内引用相等，避免每 tick 重渲染
  const clock = useGameStore((s) => formatFuseClock(s.fuseRemaining))

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div>求和: 0</div>
        <div className="fuse-clock">{clock}</div>
      </div>
      <div>就绪</div>
    </div>
  )
}
