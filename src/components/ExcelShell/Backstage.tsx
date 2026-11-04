import { useEffect, useState } from 'react'
import { replaySearch } from '../../lib/seed'
import { useGameStore } from '../../store'
import './backstage.css'

const MENU = ['信息', '新建', '打开', '保存', '另存为', '打印', '共享', '导出', '关闭']

/**
 * 【文件 → 信息】后台视图（Excel 2016 Backstage 拟真，地图 #39 已钉决策 5、7）。
 * 打开时游戏照跑（同 Sheet2）。当前只展示本局种子；外壳变量清单定稿后往「属性」里填。
 */
export function Backstage() {
  const open = useGameStore((s) => s.backstageOpen)
  const setBackstage = useGameStore((s) => s.setBackstage)
  const seed = useGameStore((s) => s.seed)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBackstage(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setBackstage])

  if (!open) return null

  const replayUrl = `${location.origin}${location.pathname}${replaySearch(location.search, seed)}`
  const copy = () => {
    void navigator.clipboard?.writeText(replayUrl).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  return (
    <div className="backstage" role="dialog" aria-label="文件 信息">
      <nav className="backstage-nav">
        <button type="button" className="backstage-back" aria-label="返回" onClick={() => setBackstage(false)}>
          ←
        </button>
        {MENU.map((item) => (
          <div key={item} className={`backstage-item${item === '信息' ? ' active' : ''}`}>
            {item}
          </div>
        ))}
      </nav>
      <main className="backstage-main">
        <h1>信息</h1>
        <div className="backstage-file">核心业务_最终版_打死勿动.xlsx</div>
        <div className="backstage-cols">
          <section className="backstage-card">
            <div className="backstage-card-icon" aria-hidden="true">🔒</div>
            <div>
              <h2>保护工作簿</h2>
              <p>此工作簿连着生产环境。谁打开谁负责。</p>
            </div>
          </section>
          <aside className="backstage-props">
            <h2>属性 ▾</h2>
            <dl>
              <dt>本局编号</dt>
              <dd className="backstage-seed">{seed}</dd>
            </dl>
            <p className="backstage-hint">同一编号 = 同一颗炸弹。</p>
            <button type="button" className="backstage-copy" onClick={copy}>
              {copied ? '已复制本局链接' : '复制本局链接'}
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
