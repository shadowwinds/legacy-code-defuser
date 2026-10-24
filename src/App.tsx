import { initTickEngine } from './audio/tick'
import { ExcelShell } from './components/ExcelShell/ExcelShell'
import { EndOverlay } from './components/EndOverlay'
import { useGameEngine } from './lib/useGameEngine'

export default function App() {
  // 引擎 tick 全局唯一入口：App 挂载时启动一次
  useGameEngine()
  // 嘀嗒声引擎：幂等初始化（内部等首次交互才建 AudioContext）
  initTickEngine()

  return (
    <>
      <ExcelShell />
      <EndOverlay />
    </>
  )
}
