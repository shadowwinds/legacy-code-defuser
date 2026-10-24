import { useGameStore } from '../../store'
import './row5.css'

/**
 * Row5 拜机房神兽重启仪式（issue #10）：挂载于网格 Row5 F 列（col 6）。
 * normal → 占位「运行中」；stuck → 下拉选 [重启服务] 执行 performRitual()；
 * 已拆 → 「运行中」（拆除后不再假死）。
 */
export function Row5Module() {
  const row5Phase = useGameStore((s) => s.row5Phase)
  const defused = useGameStore((s) => s.modules[4]?.defused ?? false)
  const performRitual = useGameStore((s) => s.performRitual)

  if (row5Phase === 'stuck' && !defused) {
    return (
      <select
        className="row5-stuck-select"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value === 'ritual') performRitual()
          e.target.value = ''
        }}
      >
        <option value="">#STUCK!</option>
        <option value="ritual">[重启服务]</option>
      </select>
    )
  }
  return <span className="row5-running">运行中</span>
}
