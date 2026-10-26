import type { ReactNode } from 'react'
import { DesktopIcons } from './DesktopIcons'
import { Taskbar } from './Taskbar'
import './desktop.css'

/** Excel 独占任务栏以上区域，容器不建立定位或层叠上下文。 */
export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-root">
      <div className="desktop-wallpaper" aria-hidden="true">
        <DesktopIcons />
      </div>
      <div className="desktop-excel-window">{children}</div>
      <Taskbar />
    </div>
  )
}
