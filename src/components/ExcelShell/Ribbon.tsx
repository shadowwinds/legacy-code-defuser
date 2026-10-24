import type { ReactNode } from 'react'

const TABS = ['文件', '开始', '插入', '页面布局', '公式', '数据', '审阅', '视图', '帮助']

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-items">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  )
}

/** Ribbon 占位（issue #2 纯静态）：两个技能按钮位 + 灰色占位组填充氛围 */
export function Ribbon() {
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
          {/* 技能按钮位：纯占位，无功能 */}
          <button type="button" className="ribbon-btn" title="技能位：格式刷">
            🖌️ 格式刷
          </button>
          <button type="button" className="ribbon-btn" title="技能位：冻结窗格">
            ❄️ 冻结窗格
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
