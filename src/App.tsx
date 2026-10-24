import { ExcelShell } from './components/ExcelShell/ExcelShell'
import { EndOverlay } from './components/EndOverlay'
import { useGameEngine } from './lib/useGameEngine'

export default function App() {
  // 引擎 tick 全局唯一入口：App 挂载时启动一次
  useGameEngine()

  return (
    <>
      <ExcelShell />
      <EndOverlay />
    </>
  )
}
