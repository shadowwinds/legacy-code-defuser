import { useEffect, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useGameStore } from '../../store'
import {
  EDGE_A_SEC,
  EDGE_A_THRESHOLD_MS,
  LAZY_EGG_MS,
  LAZY_FORMULA,
  type GCellValue,
} from '../../store/row4Slice'
import './row4.css'

/** G 列 = 第 7 列（1-based，A–H）；G 列 8 格即彩蛋公式 SUM(G2:G9) 引用的数据区 */
const G_COL = 7

interface EditingState {
  idx: number
  draft: string
}

function displayOf(v: GCellValue): { text: string; kind: 'num' | 'err' | 'formula' | 'empty' } {
  if (v === null) return { text: '', kind: 'empty' }
  if (typeof v === 'number') return { text: String(v), kind: 'num' }
  if (v === 'LAZY') return { text: LAZY_FORMULA, kind: 'formula' }
  return { text: v, kind: 'err' }
}

/**
 * Row4 财务对账平账模块（issue #7 / GDD 02 §2.3 MOD_RECON + §2.5 Edge A）。
 * 以绝对定位覆盖层接管 G 列 8 格（G2:G9 拟真数据区），不改动 Grid 渲染循环：
 * - 点击格 → 选中 + 行内编辑（填数/删数/偷懒公式），状态栏实时显示求和；
 * - 求和凑到 1024 → defuseModule(4) 过关；`=1024-SUM(G2:G9)` 彩蛋直接过关弹批注；
 * - Edge A：失衡（≠1024）每持续满 10s → Row2/Row3 各 -15s（经惩罚管线，周期连坐）；
 * - Row8 的 G 格 pointer-events:none——「别动它能跑」禁操行，点击穿透给底层单元格。
 * 选中 Row4 + 失衡时的红色追踪箭头由既有 TrackerOverlay 消费 row4Imbalanced 渲染。
 */
export function Row4GOverlay() {
  const gCells = useGameStore((s) => s.gCells)
  const gBalanced = useGameStore((s) => s.gBalanced)
  const setGCell = useGameStore((s) => s.setGCell)
  const selectCell = useGameStore((s) => s.selectCell)
  const setImbalance = useGameStore((s) => s.setImbalance)
  const row4Imbalanced = useGameStore((s) => s.row4Imbalanced)
  const imbalanceSince = useGameStore((s) => s.imbalanceSince)
  const lazyEggSeq = useGameStore((s) => s.lazyEggSeq)
  const lazyEggCell = useGameStore((s) => s.lazyEggCell)

  const [editing, setEditing] = useState<EditingState | null>(null)
  const [eggVisible, setEggVisible] = useState(false)

  // 失衡状态同步：未账平即失衡（开局 #DIV/0! 就是失衡起点），账平/过关后解除
  useEffect(() => {
    setImbalance(!gBalanced)
  }, [gBalanced, setImbalance])

  // Edge A 周期连坐：失衡每满 10s → Row2/Row3 各 -15s（一次性 setTimeout 链，
  // 由 imbalanceSince 变化重排；非引擎 tick，不违反「组件禁止自开 interval」）
  useEffect(() => {
    if (!row4Imbalanced || imbalanceSince === null) return
    const delay = Math.max(0, imbalanceSince + EDGE_A_THRESHOLD_MS - Date.now())
    const id = window.setTimeout(() => {
      const st = useGameStore.getState()
      if (st.status !== 'playing' || !st.row4Imbalanced) return
      st.applyPenalty({ row: 2, sec: EDGE_A_SEC, source: 'edge-a' })
      st.applyPenalty({ row: 3, sec: EDGE_A_SEC, source: 'edge-a' })
      st.setImbalance(true) // 重置失衡起点 → 下一轮 10s
    }, delay)
    return () => window.clearTimeout(id)
  }, [row4Imbalanced, imbalanceSince])

  // 偷懒彩蛋批注泡：触发后 4s 自动消失
  useEffect(() => {
    if (lazyEggSeq === 0) return
    setEggVisible(true)
    const id = window.setTimeout(() => setEggVisible(false), LAZY_EGG_MS)
    return () => window.clearTimeout(id)
  }, [lazyEggSeq])

  const openEditor = (idx: number) => {
    const st = useGameStore.getState()
    if (st.status !== 'playing' || st.gBalanced) return
    const v = st.gCells[idx]
    setEditing({ idx, draft: typeof v === 'number' ? String(v) : '' })
  }

  const commit = () => {
    if (!editing) return
    setGCell(editing.idx, editing.draft)
    setEditing(null)
  }

  const onEditorKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation() // Tab 键勿冒泡到 ExcelShell 的切 Sheet 快捷键
      commit()
    } else if (e.key === 'Escape') {
      setEditing(null)
    }
  }

  const containerStyle: CSSProperties = {
    left: `calc(var(--row-header-w) + var(--col-w) * ${G_COL - 1})`,
    top: 'var(--row-h)',
    width: 'var(--col-w)',
    height: `calc(var(--row-h) * 8)`,
  }

  return (
    <div className="row4-g-overlay" style={containerStyle}>
      {gCells.map((v, idx) => {
        const row = idx + 1
        const d = displayOf(v)
        const isEditing = editing?.idx === idx
        // Row8 = 禁操行（issue #12）：不拦截点击，穿透给底层网格单元格
        const inert = row === 8
        return (
          <div
            key={row}
            className={`row4-g-cell${gBalanced ? ' balanced' : ''}${inert ? ' inert' : ''}`}
            style={{ top: `calc(var(--row-h) * ${idx})` }}
            onClick={
              inert
                ? undefined
                : () => {
                    if (isEditing) return
                    selectCell(row, G_COL)
                    openEditor(idx)
                  }
            }
          >
            {isEditing ? (
              <input
                className="row4-g-edit"
                value={editing.draft}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onEditorKeyDown}
                onBlur={commit}
                onChange={(e) => setEditing({ idx, draft: e.target.value })}
              />
            ) : (
              d.kind !== 'empty' && (
                <span
                  className={`row4-g-val ${d.kind}`}
                  title={d.kind === 'formula' ? LAZY_FORMULA : undefined}
                >
                  {d.text}
                </span>
              )
            )}
            {eggVisible && lazyEggCell === idx && (
              <span className="row4-egg">外包本人吧？</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
