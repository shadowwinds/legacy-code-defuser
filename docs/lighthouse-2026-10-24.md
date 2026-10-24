# Lighthouse 基线 · 2026-10-24(issue #28,GDD 05 M5)

- **对象**:生产 build(`npm run build` → `vite preview`),桌面 preset,四类全跑。
- **工具**:lighthouse@12(Chrome headless,本机 Chrome 141)。

## 基线分数

| 类别 | 修复前 | 顺手修后 |
| :--- | ---: | ---: |
| Performance | 100 | 100 |
| Accessibility | 89 | **95** |
| Best Practices | 100 | 100 |
| SEO | 82 | **100** |

## 顺手修的项(低成本)

1. **SEO meta-description**:index.html 补游戏简介 meta(→ SEO 100)。
2. **SEO robots.txt**:新增 public/robots.txt(Pages 部署后同样生效)。
3. **A11y aria-prohibited-attr**:D 列宽拖拽 div 补 `role="separator"` + `aria-orientation`。
4. **A11y color-contrast(Ribbon 组标签)**:#8a8886 → #767676(白底 4.54:1,过 WCAG AA)。

## 记录但不修的项(豁免理由)

- **A11y color-contrast × 3(4.08:1 / 2.35:1)**:
  - 数据条黄档字色 #9C6500 on #FFEB9C——**Excel 条件格式原厂配色**,是本作「1:1 高仿 Excel」核心拟真语言的一部分,改色即破坏视觉保真(GDD 01 M1);
  - Sheet 标签「最终版_勿用 / 真最终版(2)」灰化——**故意的废标签彩蛋**(Row7 考古区拟真)。
- **Performance unused-javascript / render-blocking**:纯静态单页,JS gzip 60.3KB,桌面分数已 100;SPA 入口全量加载是 Vite 默认产物,拆包收益不抵复杂度。

## 复跑方式

```bash
npm run build && npx vite preview --port 4173 &
CHROME_PATH="/path/to/chrome" npx lighthouse http://127.0.0.1:4173/ \
  --preset=desktop --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/lighthouse.json --chrome-flags="--headless=new"
```
