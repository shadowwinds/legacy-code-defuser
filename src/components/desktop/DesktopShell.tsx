import type { ReactNode } from 'react'

/** 桌面壳：壁纸 + 桌面图标 + 任务栏，children = Excel 窗口。T0 桩：原样透传；T2 实装。 */
export function DesktopShell({ children }: { children: ReactNode }) {
  return <>{children}</>
}
