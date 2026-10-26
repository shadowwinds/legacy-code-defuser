import { initTickEngine } from './audio/tick'
import { ExcelShell } from './components/ExcelShell/ExcelShell'
import { EndOverlay } from './components/EndOverlay'
import { ChatOverlay } from './components/desktop/ChatOverlay'
import { DesktopShell } from './components/desktop/DesktopShell'
import { EndingChat } from './components/desktop/EndingChat'
import { IntroGate } from './components/desktop/IntroGate'
import { ToastLayer } from './components/desktop/ToastLayer'
import { initDesktopAnchors } from './desktop/anchors'
import { initEndingSequence } from './desktop/endingSequence'
import { useGameEngine } from './lib/useGameEngine'

export default function App() {
  // 引擎 tick 全局唯一入口：App 挂载时启动一次（开局前 tick 空转，见 startGame）
  useGameEngine()
  // 嘀嗒声引擎：幂等初始化（内部等首次交互才建 AudioContext）
  initTickEngine()
  // 桌面壳编排：局内推送接线 + 结局对话（均幂等）
  initDesktopAnchors()
  initEndingSequence()

  // 层级（v1.1 桌面化，挂载点固定；各票只改自己的组件文件，不改本文件）
  return (
    <IntroGate>
      <DesktopShell>
        <ExcelShell />
      </DesktopShell>
      <ChatOverlay />
      <ToastLayer />
      <EndingChat />
      <EndOverlay />
    </IntroGate>
  )
}
