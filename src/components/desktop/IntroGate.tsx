import { useEffect, type ReactNode } from 'react'
import { useGameStore } from '../../store'

/**
 * 开场动画闸门：动画期间不渲染游戏，结束后 startGame() 开局并渲染 children。
 * T0 桩：直接开局（行为与桌面化前一致）；T1 实装回忆杀。
 */
export function IntroGate({ children }: { children: ReactNode }) {
  const startGame = useGameStore((s) => s.startGame)
  useEffect(() => {
    startGame()
  }, [startGame])
  return <>{children}</>
}
