/**
 * 终局结局对话编排：status 离开 playing → 结局组气泡按 400ms 吐入结局视图。
 * T0 桩：空实现；T6 实装（须幂等，App 每次渲染都会调用）。
 */
export function initEndingSequence(): void {}
