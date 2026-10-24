import { useState } from 'react'
import { useGameStore } from '../../store'
import type { Row1Option } from '../../store/row1Slice'
import './row1.css'

/** 批注泡自动消失时长（ms） */
const TRAP_POP_MS = 4000

/**
 * Row1 跨部门汇总合并单元格（issue #9）：挂载于网格 Row1 F 列（col 6）。
 * 结构损坏中 → 下拉三选项（选对与否随 Row2 状态条件判定，判定在 row1Slice）；
 * 拆解后 → 下拉消失。
 */
export function Row1Module() {
  const structureBroken = useGameStore((s) => s.structureBroken)
  const defused = useGameStore((s) => s.modules[0]?.defused ?? false)
  const chooseOption = useGameStore((s) => s.chooseOption)
  const [trapPopVisible, setTrapPopVisible] = useState(false)

  if (!structureBroken || defused) return null

  return (
    <div className="row1-wrap">
      <select
        className="row1-select"
        defaultValue=""
        aria-label="跨部门汇总处理方式"
        onChange={(e) => {
          const option = e.target.value as Row1Option
          e.target.value = ''
          if (!option) return
          if (chooseOption(option) === 'trap') {
            setTrapPopVisible(true)
            window.setTimeout(() => setTrapPopVisible(false), TRAP_POP_MS)
          }
        }}
      >
        <option value="">#结构损坏!</option>
        <option value="split-fill">[拆分并填充值]</option>
        <option value="force-write">[保留合并强行写入]</option>
        <option value="merge-center">[合并后居中]</option>
      </select>
      {trapPopVisible ? (
        <span className="row1-trap-pop">2014 年有人这么干过，这就是这张表长这样的原因。</span>
      ) : null}
    </div>
  )
}
