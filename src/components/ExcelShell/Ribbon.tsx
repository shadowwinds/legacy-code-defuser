import type { ReactNode } from 'react'
import { useGameStore } from '../../store'
import '../modules/skills.css'

const TABS = ['文件', '开始', '插入', '页面布局', '公式', '数据', '审阅', '视图', '帮助']

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-items">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  )
}

/** CD 剩余秒（向上取整）；未在 CD 返回 0 */
const cdRemainingSec = (cdUntil: number) => Math.max(0, Math.ceil((cdUntil - Date.now()) / 1000))

/** Ribbon：技能组为格式刷/冻结窗格（issue #12），其余为灰色占位组填充氛围 */
export function Ribbon() {
  const status = useGameStore((s) => s.status)
  const useSkill = useGameStore((s) => s.useSkill)
  const formatBrush = useGameStore((s) => s.formatBrush)
  const freezePane = useGameStore((s) => s.freezePane)
  const frozenRowsUntil = useGameStore((s) => s.frozenRowsUntil)
  // 引擎 100ms tick 持续更新 fuseRemaining → 订阅其 0.1s 级值驱动重渲染，
  // CD 剩余秒与效果高亮随之刷新（组件禁止自开 interval；值本身仅作 tick 信号）
  const fuseTick = useGameStore((s) => Math.round(s.fuseRemaining * 10))
  void fuseTick

  const playing = status === 'playing'
  const fbCdSec = playing ? cdRemainingSec(formatBrush.cdUntil) : 0
  const fpCdSec = playing ? cdRemainingSec(freezePane.cdUntil) : 0
  const fbActive = playing && formatBrush.activeUntil > Date.now()
  // 冻结效果期间：Row1–4 任一仍在引擎冻结中
  const fpActive =
    playing && [1, 2, 3, 4].some((row) => (frozenRowsUntil[row] ?? 0) > Date.now())

  return (
    <div className="ribbon">
      <div className="ribbon-tabs">
        {TABS.map((tab) => (
          <div key={tab} className={`ribbon-tab${tab === '开始' ? ' active' : ''}`}>
            {tab}
          </div>
        ))}
      </div>
      <div className="ribbon-body">
        <RibbonGroup label="技能">
          <button
            type="button"
            className={`ribbon-btn${fbCdSec > 0 ? ' skill-cd' : ''}${fbActive ? ' skill-active' : ''}`}
            title="格式刷：选中行数据条强刷假绿 10s（倒计时照跑，掩耳盗铃）；CD 30s"
            disabled={fbCdSec > 0}
            onClick={() => useSkill('formatBrush')}
          >
            {fbCdSec > 0 ? `🖌️ ${fbCdSec}s` : '🖌️ 格式刷'}
          </button>
          <button
            type="button"
            className={`ribbon-btn${fpCdSec > 0 ? ' skill-cd' : ''}${fpActive ? ' skill-active' : ''}`}
            title="冻结窗格：Row1–4 倒计时冻结 8s；CD 45s"
            disabled={fpCdSec > 0}
            onClick={() => useSkill('freezePane')}
          >
            {fpCdSec > 0 ? `❄️ ${fpCdSec}s` : '❄️ 冻结窗格'}
          </button>
        </RibbonGroup>
        <RibbonGroup label="剪贴板">
          <div className="ph-block tall" />
          <div className="ph-block" />
          <div className="ph-block tall" />
        </RibbonGroup>
        <RibbonGroup label="字体">
          <div className="ph-block wide" />
          <div className="ph-block" />
          <div className="ph-block" />
          <div className="ph-block wide" />
        </RibbonGroup>
        <RibbonGroup label="对齐方式">
          <div className="ph-block" />
          <div className="ph-block tall" />
          <div className="ph-block" />
        </RibbonGroup>
        <RibbonGroup label="数字">
          <div className="ph-block wide" />
          <div className="ph-block" />
        </RibbonGroup>
        <RibbonGroup label="样式">
          <div className="ph-block" />
          <div className="ph-block tall" />
          <div className="ph-block wide" />
        </RibbonGroup>
        <RibbonGroup label="编辑">
          <div className="ph-block" />
          <div className="ph-block wide" />
        </RibbonGroup>
      </div>
    </div>
  )
}
