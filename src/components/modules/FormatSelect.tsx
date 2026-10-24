import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store'
import type { Row3FormatMode } from '../../store/row3Slice'

const OPTIONS: { value: Row3FormatMode; label: string }[] = [
  { value: 'general', label: '常规' },
  { value: 'shortDate', label: '短日期' },
]

/**
 * 数字格式下拉（Row3 阶段②交互面，GDD 02 §2.3）：
 * 挂载在公式栏行最右端，当前值「常规」，点开可切「短日期」。
 * 选择写入 row3Slice.formatMode（revealed 态切短日期 → D3 显形日期）。
 */
export function FormatSelect() {
  const formatMode = useGameStore((s) => s.formatMode)
  const setFormatMode = useGameStore((s) => s.setFormatMode)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  const current = OPTIONS.find((o) => o.value === formatMode) ?? OPTIONS[0]

  return (
    <div className="format-select" ref={rootRef}>
      <button
        type="button"
        className="format-select-btn"
        onPointerDown={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {current.label}
        <span className="format-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="format-select-menu" role="listbox">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === formatMode}
              className={`format-select-item${o.value === formatMode ? ' checked' : ''}`}
              onClick={() => {
                setFormatMode(o.value)
                setOpen(false)
              }}
            >
              <span className="format-select-check" aria-hidden="true">
                {o.value === formatMode ? '✓' : ''}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
