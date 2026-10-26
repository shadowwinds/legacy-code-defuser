import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import spreadsheetIcon from '../../assets/icons/spreadsheet.png'
import { CONTACT_META, getStoryboard } from '../../desktop/dialogues'
import { useDesktopStore } from '../../desktop/desktopStore'
import { buildIntroTimeline, INTRO_FLASH_IN_MS, INTRO_FLASH_OUT_MS, INTRO_MAX_MS } from '../../desktop/introTimeline'
import { useGameStore } from '../../store'
import './intro.css'

const timeline = buildIntroTimeline(getStoryboard())
type Phase = 'intro' | 'covering' | 'revealing' | 'playing'

function shouldPlayIntro(): boolean {
  try {
    const seen = localStorage.getItem('lcd:introSeen') === '1'
    return new URLSearchParams(location.search).get('intro') === '1' || !seen
  } catch {
    // 存储不可用时直接开局，避免每次进站都被动画拦住。
    return false
  }
}

/** 白层与游戏并列，换掉分镜时仍完整覆盖游戏的首次挂载。 */
export function IntroGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => shouldPlayIntro() ? 'intro' : 'playing')
  const [step, setStep] = useState(timeline[0])
  const beganAt = useRef(performance.now())
  const finishing = useRef(false)
  const started = useRef(false)

  const startGame = useCallback(() => {
    if (started.current) return
    started.current = true
    useGameStore.getState().startGame()
  }, [])

  const finishIntro = useCallback((skipped: boolean) => {
    if (finishing.current) return
    finishing.current = true
    if (skipped) useDesktopStore.getState().setIntroSkipped()
    try {
      localStorage.setItem('lcd:introSeen', '1')
    } catch {
      // 写失败也继续转场，不能阻止玩家进入游戏。
    }
    setPhase('covering')
  }, [])

  useEffect(() => {
    if (phase === 'playing') startGame()
    if (phase !== 'intro') return
    const elapsed = performance.now() - beganAt.current
    const timers = timeline.slice(1).map((next) => window.setTimeout(() => setStep(next), Math.max(0, next.atMs - elapsed)))
    // 25 秒包含白闪，另留 200ms 给浏览器绘制和 animationend 调度。
    timers.push(window.setTimeout(() => finishIntro(false), Math.max(0, INTRO_MAX_MS - INTRO_FLASH_IN_MS - INTRO_FLASH_OUT_MS - 200 - elapsed)))
    return () => timers.forEach(window.clearTimeout)
  }, [phase, startGame, finishIntro])

  useEffect(() => {
    if (phase !== 'intro') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!['Escape', ' ', 'Enter'].includes(event.key)) return
      event.preventDefault()
      finishIntro(step.frame < 3)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, step.frame, finishIntro])

  return (
    <>
      {(phase === 'intro' || phase === 'covering') && (
        <div className="intro-root" onPointerDown={() => finishIntro(step.frame < 3)}>
          <div key={step.frame} className={`intro-frame${step.fadingOut ? ' intro-frame-out' : ''}`}>
            {step.frame === 0 && <p className="intro-t">{step.messages[0].text}</p>}
            {step.frame === 1 && (
              <div className="intro-chat-mock" aria-live="polite">
                {step.messages.map((message) => {
                  if (message.id === 'sb_07') return <p key={message.id} className="intro-blocked">{message.text}</p>
                  if (message.contact === 'system') return <p key={message.id} className="intro-system">{message.text}</p>
                  const player = message.contact === 'player'
                  return (
                    <div key={message.id} className={`intro-row${player ? ' intro-row-player' : ''}`}>
                      <div className="intro-who" aria-label={CONTACT_META[message.contact].name}>{player ? CONTACT_META.player.avatar : '王'}</div>
                      <div className="intro-bubble">{message.text}</div>
                    </div>
                  )
                })}
              </div>
            )}
            {step.frame === 2 && step.messages.map((message) => (
              <p key={message.id} className={message.id === 'sb_09' ? 'intro-big' : 'intro-sub'}>{message.text}</p>
            ))}
            {step.frame === 3 && (
              <>
                <button type="button" className="intro-xl-icon" aria-label="打开 Excel" onDoubleClick={() => finishIntro(false)}>
                  <img src={spreadsheetIcon} alt="" draggable={false} />
                </button>
                <p className="intro-sub">{step.messages[0].text}</p>
              </>
            )}
          </div>
          {/* T8 a11y：纯装饰进度点，div 上 aria-label 违反 ARIA 规范（Lighthouse aria-prohibited-attr） */}
          <div className="intro-frame-bar" aria-hidden="true">
            {[0, 1, 2, 3].map((frame) => <i key={frame} className={frame === step.frame ? 'intro-dot-on' : ''} />)}
          </div>
          <p className="intro-skip-hint">{step.frame < 3 ? '点击任意处跳过' : '双击图标打开'}</p>
        </div>
      )}
      {(phase === 'revealing' || phase === 'playing') && children}
      {(phase === 'covering' || phase === 'revealing') && (
        <div
          className={`intro-flash intro-flash-${phase}`}
          style={{ animationDuration: `${phase === 'covering' ? INTRO_FLASH_IN_MS : INTRO_FLASH_OUT_MS}ms` }}
          onAnimationEnd={() => {
            if (phase === 'covering') {
              startGame()
              setPhase('revealing')
            } else {
              setPhase('playing')
            }
          }}
        />
      )}
    </>
  )
}
