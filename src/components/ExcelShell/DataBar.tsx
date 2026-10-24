/**
 * E 列倒计时数据条（独立组件，便于并行票合流）。
 * 宽度 = remaining/initial；颜色按 GDD §2.1 三档：
 * >60s 绿 / 20~60s 黄 / <20s 红（复刻 Excel 条件格式）。
 * 终局后 remaining 不再变化，数据条自然定格。
 */
interface DataBarProps {
  remainingSec: number
  initialSec: number
}

export function DataBar({ remainingSec, initialSec }: DataBarProps) {
  const ratio = initialSec > 0 ? Math.min(1, Math.max(0, remainingSec / initialSec)) : 0
  const background =
    remainingSec > 60
      ? 'var(--xlsx-ok-bg)'
      : remainingSec >= 20
        ? 'var(--xlsx-warn-bg)'
        : 'var(--xlsx-err-bg)'

  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${ratio * 100}%`, background, opacity: 1 }} />
    </div>
  )
}
