export interface DataBarProps {
  /** 剩余秒数 */
  remainingSec: number
  /** 初始秒数，决定满条宽度 */
  initialSec: number
}

/** 剩余文本：≥10s 整数秒（列宽内不裁切），<10s 一位小数（URGENT 压迫感），#24 */
function remainingText(sec: number): string {
  return sec >= 10 ? `${Math.ceil(sec)}s` : `${sec.toFixed(1)}s`
}

/**
 * E 列数据条（Excel 条件格式三色数据条）。
 * 配色档位（GDD 02 §2.1）：>60s 绿 / 20–60s 黄 / <20s 红；
 * 宽度 = remainingSec / initialSec，0.1s linear 过渡；终局后数值定格。
 * 动态表现（GDD 04 §4.4）：黄档慢速闪烁、红档文本变 #URGENT!、<10s 单元格抖动。
 */
export function DataBar({ remainingSec, initialSec }: DataBarProps) {
  const pct = initialSec > 0 ? Math.max(0, Math.min(100, (remainingSec / initialSec) * 100)) : 0
  const tier = remainingSec > 60 ? 'ok' : remainingSec >= 20 ? 'warn' : 'err'
  const urgent = remainingSec < 10
  return (
    <span className="data-bar" data-tier={tier} data-urgent={urgent || undefined}>
      <span className="data-bar-fill" style={{ width: `${pct}%` }} />
      <span className="data-bar-text">{tier === 'err' ? '#URGENT!' : remainingText(remainingSec)}</span>
    </span>
  )
}
