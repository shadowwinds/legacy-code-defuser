import { getRunConfig } from '../../lib/seed'
import { ROW5_RITUAL_LABELS, type Row5Ritual } from '../../rules/modules/row5'
import { useGameStore } from '../../store'
import './row5.css'

/**
 * Row5 拜机房神兽重启仪式（issue #10）：挂载于网格 Row5 F 列（col 6）。
 * normal → 占位「运行中」；stuck → 下拉选仪式执行 performRitual()；
 * 已拆 → 「运行中」（拆除后不再假死）。
 * v2（#54）：F5 报错码随本局，下拉列出 5 种仪式，判定在 row5Slice。
 */
export function Row5Module() {
  const row5Phase = useGameStore((s) => s.row5Phase)
  const defused = useGameStore((s) => s.modules[4]?.defused ?? false)
  const performRitual = useGameStore((s) => s.performRitual)
  const row5Code = useGameStore((s) => s.row5Code)
  const v2 = getRunConfig().v2

  if (row5Phase === 'stuck' && !defused) {
    const rituals: Row5Ritual[] = v2 ? (Object.keys(ROW5_RITUAL_LABELS) as Row5Ritual[]) : ['restart']
    return (
      <select
        className="row5-stuck-select"
        defaultValue=""
        aria-label="重启仪式"
        onChange={(e) => {
          const ritual = e.target.value as Row5Ritual | ''
          e.target.value = ''
          if (ritual) performRitual(ritual)
        }}
      >
        <option value="">{row5Code}</option>
        {rituals.map((r) => (
          <option key={r} value={r}>
            {ROW5_RITUAL_LABELS[r]}
          </option>
        ))}
      </select>
    )
  }
  return <span className="row5-running">运行中</span>
}
