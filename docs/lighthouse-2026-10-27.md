# Lighthouse · 2026-10-27(issue #37,T8 收尾)

- **对象**:生产 build(`npm run build` → `vite preview`),桌面 preset,四类全跑。
- **工具**:lighthouse@13.5(Chrome headless,本机 Chrome)。
- **对照基线**:[lighthouse-2026-10-24.md](./lighthouse-2026-10-24.md)。

## 分数对照

| 类别 | 2026-10-24 基线 | 2026-10-27 |
| :--- | ---: | ---: |
| Performance | 100 | **100** |
| Accessibility | 95 | **100** |
| Best Practices | 100 | **100** |
| SEO | 100 | **100** |

核心指标:FCP 0.3s / LCP 0.3s / TBT 0ms / CLS 0 / SI 0.3s。

## 本轮顺手修的项(T8「小修 <20 行」边界,已列入手 #37 报告)

1. **A11y aria-prohibited-attr(T1 引入)**:`IntroGate` 帧进度点的 `<div aria-label>` 改 `aria-hidden="true"`(纯装饰进度点,div 携带 aria-label 违反 ARIA 规范)。
2. **A11y color-contrast(T1 引入)**:`.intro-skip-hint` #666 on #000(≈2.8:1)→ #a0a0a0(≈5.3:1),过 WCAG AA。

## 记录但不修的项(豁免理由沿用基线)

- 数据条黄档字色、Sheet 废标签灰化:Excel 原厂拟真/故意彩蛋,同基线豁免。
- **包体偏离(非 Lighthouse 项,已知)**:T2 收尾提交 fd8dfa6 引入两张原创 PNG 图标(spreadsheet 1.19MB / workplace-chat 1.27MB,未压缩)。与 GDD 06 §6.7-6「零美术资产」冲突,属用户在 T2 关票后的明确决策,本票不回退;建议后续压缩(预计可减 90%+)或回退为 CSS 字形,另开 issue 处理。

## 复跑方式

```bash
npm run build && npx vite preview --port 4173 &
CHROME_PATH="/path/to/chrome" npx lighthouse http://127.0.0.1:4173/ \
  --preset=desktop --output=json --output-path=/tmp/lh.json \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu"
```
