import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { useGameStore } from './store'
import { useDesktopStore } from './desktop/desktopStore'

// DEV 冒烟钩子：console 可调 __lcd.getState().penalizeRow(4, 60) 触发爆炸；
// __lcdDesktop 为桌面壳 store（生产 build 不挂）
if (import.meta.env.DEV) {
  ;(window as unknown as { __lcd?: typeof useGameStore }).__lcd = useGameStore
  ;(window as unknown as { __lcdDesktop?: typeof useDesktopStore }).__lcdDesktop = useDesktopStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
