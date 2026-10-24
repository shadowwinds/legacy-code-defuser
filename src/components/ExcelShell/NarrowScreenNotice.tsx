import { useEffect, useState } from 'react'
import './narrowScreen.css'

/** PC Web 专用（ADR-0001 不做移动端）：低于该宽度显示降级提示层 */
const MIN_WIDTH_QUERY = '(max-width: 899px)'

/**
 * 窄屏降级提示（issue #28，GDD 05 M5）：非 PC 尺寸下盖全屏说明层，
 * 拦截交互;回宽屏自动消失。引擎照跑（计时压迫感保留,回来接着拆）。
 */
export function NarrowScreenNotice() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(MIN_WIDTH_QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(MIN_WIDTH_QUERY)
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!narrow) return null

  return (
    <div className="narrow-screen" role="alert">
      <div className="narrow-screen-card">
        <div className="narrow-screen-icon" aria-hidden="true">🖥️</div>
        <h1 className="narrow-screen-title">屏幕尺寸不达标</h1>
        <p className="narrow-screen-text">
          本表是 Excel 2016 仿真，仅面向 PC Web（宽度 ≥ 900px）。
          <br />
          请用电脑浏览器打开，别用手机拆弹——祖传代码配小屏幕，两个都会炸。
        </p>
        <p className="narrow-screen-note">把窗口拉宽后本提示会自动消失，炸弹可不会等你。</p>
      </div>
    </div>
  )
}
