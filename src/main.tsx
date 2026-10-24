import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { useGameStore } from './store'

// DEV 冒烟钩子：console 可调 __lcd.getState().penalizeRow(4, 60) 触发爆炸（生产 build 不挂）
if (import.meta.env.DEV) {
  ;(window as unknown as { __lcd?: typeof useGameStore }).__lcd = useGameStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
