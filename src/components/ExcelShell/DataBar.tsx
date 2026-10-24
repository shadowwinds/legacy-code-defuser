export interface DataBarProps {
  /** 剩余秒数 */
  remainingSec: number
  /** 初始秒数，决定满条宽度 */
  initialSec: number
}

/**
 * E 列数据条（Excel 条件格式三色数据条）。
 * 配色档位（GDD 02 §2.1）：>60s 绿 / 20–60s 黄 / <20s 红；
 * 宽度 = remainingSec / initialSec，0.1s linear 过渡；终局后数值定格。
 */
export function DataBar({ remainingSec, initialSec }: DataBarProps) {
  const pct = initialSec > 0 ? Math.max(0, Math.min(100, (remainingSec / initialSec) * 100)) : 0
  const tier = remainingSec > 60 ? 'ok' : remainingSec >= 20 ? 'warn' : 'err'
  return (
    <span className="data-bar" data-tier={tier}>
      <span className="data-bar-fill" style={{ width: `${pct}%` }} />
      <span className="data-bar-text">{remainingSec}s</span>
    </span>
  )
}
