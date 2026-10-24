import { useGameStore } from '../store'

/**
 * 全局引信嘀嗒声引擎（issue #13）——纯 Web Audio API 合成，零音频文件。
 *
 * 机制定位：切到 Sheet2 查手册时看不到任何倒计时，嘀嗒声是唯一时间线索。
 * 节奏随 fuseRemaining 三级加急：
 *   >90s 每秒 1 响 / 90–30s 每秒 2 响 / <30s 每秒 4 响。
 *
 * AudioContext 须在用户首次交互后创建/resume（浏览器自动播放策略），
 * 交互前完全静默。App 挂载时调用一次 initTickEngine()，全站共享本模块
 * 的 AudioContext 单例（后续音效票直接 import getAudioContext 使用）。
 */

/** 节奏分档：下标 = 档位，interval 为两响间隔毫秒 */
const TIER_INTERVAL_MS = [1000, 500, 250] as const

export function scheduleTierOf(fuseRemaining: number): number {
  if (fuseRemaining > 90) return 0
  if (fuseRemaining > 30) return 1
  return 2
}

// ---- AudioContext 单例（首次交互后创建） ----
let ctx: AudioContext | null = null
let unlocked = false

/** 全站共享的 AudioContext（未解锁时为 null）；顺带 resume 挂起态 */
export function getAudioContext(): AudioContext | null {
  if (!unlocked) return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// ---- 静音开关（纯模块内状态，不动 store） ----
let muted = false

export function isMuted(): boolean {
  return muted
}

export function toggleMute(): boolean {
  muted = !muted
  if (muted) {
    stopLoop()
  } else if (useGameStore.getState().status === 'playing') {
    startLoop()
  }
  return muted
}

// ---- 咔哒合成：高频短促方波 blip + 噪声 burst 过带通，双层快衰减 ----
let noiseBuffer: AudioBuffer | null = null

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = Math.floor(c.sampleRate * 0.03)
    noiseBuffer = c.createBuffer(1, len, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/** 单声咔哒：accent 交替高低两层，模拟机械钟「咔—哒」 */
function playClick(c: AudioContext, accent: boolean): void {
  const t = c.currentTime
  const stop = t + 0.03

  // 层1：短促高频方波 blip
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.value = accent ? 3200 : 2500
  const oscGain = c.createGain()
  oscGain.gain.setValueAtTime(0.001, t)
  oscGain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.35, t + 0.002)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02)
  osc.connect(oscGain).connect(c.destination)
  osc.start(t)
  osc.stop(stop)

  // 层2：噪声 burst 过带通（机械质感）
  const src = c.createBufferSource()
  src.buffer = getNoiseBuffer(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = accent ? 4200 : 3300
  bp.Q.value = 1.2
  const nGain = c.createGain()
  nGain.gain.setValueAtTime(0.45, t)
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025)
  src.connect(bp).connect(nGain).connect(c.destination)
  src.start(t)
  src.stop(stop)
}

/** 爆炸：短促低音蜂鸣下扫 */
function playExplosion(c: AudioContext): void {
  const t = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.5)
  const g = c.createGain()
  g.gain.setValueAtTime(0.4, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.6)
}

/** 通关：XP Chord 式上扬四音琶音（#25，复刻开机曲「神似」不追采样） */
function playWin(c: AudioContext): void {
  const t = c.currentTime
  // B♭4 → E♭5 → G5 → B♭5，末音延音带五度和声
  const notes: Array<{ f: number; at: number; dur: number; gain: number }> = [
    { f: 466.16, at: 0, dur: 0.5, gain: 0.3 },
    { f: 622.25, at: 0.18, dur: 0.5, gain: 0.3 },
    { f: 783.99, at: 0.36, dur: 0.5, gain: 0.3 },
    { f: 932.33, at: 0.54, dur: 1.2, gain: 0.32 },
    { f: 1174.66, at: 0.54, dur: 1.2, gain: 0.18 },
  ]
  for (const { f, at, dur, gain } of notes) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const g = c.createGain()
    const start = t + at
    g.gain.setValueAtTime(0.001, start)
    g.gain.exponentialRampToValueAtTime(gain, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, start + dur)
    osc.connect(g).connect(c.destination)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }
}

/** 错误：Windows 式低双音（G4→D#4 方波短促），失败反馈（#25） */
function playError(c: AudioContext): void {
  const t = c.currentTime
  const notes = [392.0, 311.13]
  notes.forEach((f, i) => {
    const start = t + i * 0.12
    const osc = c.createOscillator()
    osc.type = 'square'
    osc.frequency.value = f
    const g = c.createGain()
    g.gain.setValueAtTime(0.001, start)
    g.gain.exponentialRampToValueAtTime(0.18, start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
    osc.connect(g).connect(c.destination)
    osc.start(start)
    osc.stop(start + 0.2)
  })
}

// ---- 惩罚 Error 音：penaltySlice 统一入口广播事件，此处订阅（避免 audio↔store 循环依赖） ----
let lastErrorAt = 0

function onPenaltyEvent(): void {
  if (muted) return
  const c = getAudioContext()
  if (!c) return
  // Edge A 一轮扣两行 = 连续两次事件，100ms 内只播一声
  const now = Date.now()
  if (now - lastErrorAt < 100) return
  lastErrorAt = now
  playError(c)
}

// ---- setTimeout 链驱动（嘀嗒对时序精度不敏感） ----
let timer: number | null = null
let beat = 0

function stopLoop(): void {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

function startLoop(): void {
  stopLoop()
  runBeat()
}

function runBeat(): void {
  timer = null
  const store = useGameStore.getState()
  if (muted || store.status !== 'playing') return

  const c = getAudioContext()
  if (!c) return

  playClick(c, beat % 2 === 0)
  beat += 1

  // 每拍重读档位，加急切换即时生效
  const interval = TIER_INTERVAL_MS[scheduleTierOf(store.fuseRemaining)]
  timer = window.setTimeout(runBeat, interval)
}

// ---- 初始化：订阅 store + 首次交互解锁（幂等） ----
let started = false

export function initTickEngine(): void {
  if (started) return
  started = true

  // 首次交互解锁 AudioContext（自动播放策略），此前完全静默
  const unlock = (): void => {
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
    unlocked = true
    if (useGameStore.getState().status === 'playing') startLoop()
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)

  // 终局：停嘀嗒 + 终局音；新局：恢复嘀嗒
  useGameStore.subscribe((state, prev) => {
    if (state.status === prev.status) return
    if (state.status === 'playing') {
      if (unlocked) startLoop()
      return
    }
    stopLoop()
    if (!muted) {
      const c = getAudioContext()
      if (!c) return
      if (state.status === 'exploded') playExplosion(c)
      else if (state.status === 'won') playWin(c)
    }
  })

  // 惩罚 Error 音：统一入口 penaltySlice 广播 window 事件（#25）
  window.addEventListener('lcd:penalty', onPenaltyEvent)

  // DEV 调试句柄：browser_evaluate 用
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__lcdAudio = {
      get ctx() {
        return ctx
      },
      isMuted: () => muted,
      toggleMute,
      scheduleTier: () => scheduleTierOf(useGameStore.getState().fuseRemaining),
      beats: () => beat,
    }
  }
}
