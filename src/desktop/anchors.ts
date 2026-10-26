/**
 * 局内推送接线：订阅游戏 store / lcd:penalty → 事件锚 → desktopStore.deliver。
 * T0 桩：空实现；T5 实装（须幂等，App 每次渲染都会调用）。
 */
export function initDesktopAnchors(): void {}
