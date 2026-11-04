// 端到端冒烟（#59）：像玩家一样，只看界面和 Sheet2 手册，玩完一整局 v2 并通关。
//
// 规矩：只能读 DOM 上玩家看得见的东西（标题栏、宏警告条、任务栏时钟、单元格、手册表格），
// 不准 import store / 规则模块拿答案——否则就测不出「手册和界面对不上」。
// 唯一写死的是附录 C 的「读法」（READINGS）：问题怎么从界面上判断。手册措辞一改，这里会先报错提醒同步。
//
// 用法：
//   npm run e2e                     起 vite，跑默认种子（覆盖每张规则表的每个分支）
//   npm run e2e -- E2E7 FOO         只跑指定种子（不做覆盖检查）
//   E2E_URL=https://… npm run e2e   不起 vite，直接打已部署的站点（部署冒烟，#60）
//   E2E_JOBS=1 npm run e2e          并发局数（默认 3）
// 失败截图存到 e2e/artifacts/<种子>.png。
//
// 本机没装浏览器时先跑：npx playwright install chromium

import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ARTIFACTS = fileURLToPath(new URL('./artifacts/', import.meta.url))

/** 默认种子：贪心挑出来的 11 个，合起来覆盖 4 个时间场景、宏警告条有/无、版本号单/双、
 * 过没过 15 号、求和/平均值、F3/H3，以及 Row1/Row2/Row5 每一行规则的「否」「是」两个分支。
 * 种子派生改了以后覆盖可能变少，跑完会检查（见 coverage）。 */
const DEFAULT_SEEDS = ['E2E1', 'E2E8', 'E2E2', 'E2E20', 'E2E6', 'E2E7', 'E2E46', 'E2E49', 'E2E125', 'E2E122', 'E2E104']

/** 附录 C 的读法：问题 → 手册里「怎么算是」的原文 + 从界面读出的判断 */
const READINGS = {
  '版本号末位单数？': { yes: '末位是 1、3、5、7、9', read: (s) => s.version % 2 === 1 },
  '有宏警告条？': { yes: '有这条就是', read: (s) => s.macro },
  '周末？': { yes: '周六、周日', read: (s) => s.weekday === '周六' || s.weekday === '周日' },
  '深夜？': { yes: '晚上 9 点以后（含 0 点）', read: (s) => s.hour >= 21 || s.hour === 0 },
  '过了 15 号？': { yes: '16 号及以后', read: (s) => s.day >= 16 },
}

/** 正文里照着做、但不在表格里的几句话；措辞变了就得回来看看机器人的打法还对不对 */
const MANUAL_SENTENCES = [
  '版本号末位单数 → 填 F3；双数 → 填 H3',
  '先把 #DIV/0! 那格清空',
  '第 8 行那格别碰',
  '平均值不算空格',
]

class StepError extends Error {}

const args = process.argv.slice(2)
const seeds = args.length ? args : DEFAULT_SEEDS
const jobs = Math.max(1, Number(process.env.E2E_JOBS) || 3)

let server
let baseUrl = process.env.E2E_URL
if (!baseUrl) {
  const { createServer } = await import('vite')
  server = await createServer({ root: ROOT, logLevel: 'warn', server: { host: '127.0.0.1', port: 5299 } })
  await server.listen()
  baseUrl = server.resolvedUrls.local[0]
}

const browser = await chromium.launch()
const results = []
const queue = [...seeds]
await Promise.all(
  Array.from({ length: Math.min(jobs, seeds.length) }, async () => {
    while (queue.length) results.push(await playOne(queue.shift()))
  }),
)
await browser.close()
await server?.close()

// ── 汇总 ──
results.sort((a, b) => seeds.indexOf(a.seed) - seeds.indexOf(b.seed))
for (const r of results) console.log(r.report)
const failed = results.filter((r) => !r.ok)
let coverageOk = true
if (!args.length && failed.length === 0) coverageOk = checkCoverage(results)
console.log(`\n通关 ${results.length - failed.length}/${results.length}${coverageOk ? '' : '，覆盖不全'}`)
process.exit(failed.length || !coverageOk ? 1 : 0)

// ────────────────────────────────────────────────────────────────

async function playOne(seed) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const log = []
  let step = '开局'
  const features = new Set()
  let ruleRows = null
  try {
    await page.clock.install()
    const url = new URL(baseUrl)
    url.searchParams.set('v2', '1')
    url.searchParams.set('seed', seed)
    await page.goto(url.href)
    // 开场动画由假时钟驱动，跨过去直到第 1 行下拉出现
    await runUntil(page, () => page.locator('.row1-select').count(), 60, '开场动画结束')

    step = '读手册'
    const manual = await readManual(page)
    // 表头一行不算
    ruleRows = { 'r1:': manual.r1.length - 1, 'r2:': manual.r2.length - 1, 'r5:': manual.r5.length - 1 }
    step = '读外壳'
    const shell = await readShell(page)
    const sw = Object.fromEntries(Object.entries(READINGS).map(([q, r]) => [q, r.read(shell)]))
    log.push(`v${shell.version} ${shell.macro ? '宏有' : '宏无'} ${shell.date} ${shell.clock}`)
    features.add(`scene:${sw['周末？']}${sw['深夜？']}`).add(`macro:${sw['有宏警告条？']}`)
    features.add(`odd:${sw['版本号末位单数？']}`).add(`pay:${sw['过了 15 号？']}`)

    /** 「看什么 / 否 / 是」四列表：按报错码查一行，再按开关取答案 */
    const branch = (table, code, what) => {
      const row = table.find((r) => r[0] === code)
      if (!row) throw new StepError(`手册${what}表里没有「${code}」`)
      if (!(row[1] in sw)) throw new StepError(`手册${what}表问了「${row[1]}」，附录 C 没教怎么看`)
      return { answer: sw[row[1]] ? row[3] : row[2], yes: sw[row[1]] }
    }

    // ── 第 4 行（最急，先拆）──
    step = '第 4 行 平账'
    const statusText = () => page.locator('.statusbar-left div').first().textContent()
    const mode = (await statusText()).startsWith('平均值') ? 'avg' : 'sum'
    features.add(`mode:${mode}`)
    const targetRow = manual.r4.find((r) => r[0] === (sw['周末？'] ? '周末' : '平日'))
    const target = Number(sw['深夜？'] ? targetRow[2] : targetRow[1])
    const cells = page.locator('.row4-g-cell')
    const texts = (await cells.allTextContents()).map((t) => t.trim())
    // G 列 8 格对应第 1–8 行；第 8 行那格别碰，它的数只能算进去
    const keep = Number(texts[7]) || 0
    const kept = texts[7] === '' ? 0 : 1
    const editCell = async (idx, value) => {
      await cells.nth(idx).click()
      await page.locator('.row4-g-edit').fill(value)
      await page.keyboard.press('Enter')
    }
    // 先清 #DIV/0!，再清其它杂数，留第 1 行那格填答案
    const order = texts.map((t, i) => i).filter((i) => i < 7 && texts[i] !== '')
    order.sort((a, b) => Number(texts[b].startsWith('#')) - Number(texts[a].startsWith('#')))
    for (const i of order) if (i !== 0) await editCell(i, '')
    const answer4 = mode === 'sum' ? target - keep : target * (kept + 1) - keep
    await editCell(0, String(answer4))
    await expectDefused(page, 4)
    log.push(`R4 ${mode === 'sum' ? '求和' : '平均值'}→${target}`)

    // ── 第 2 行 ──
    step = '第 2 行 改守卫'
    await page.locator('.rh[data-row="2"]').click()
    const formula = (await page.locator('.fx-input').textContent()).trim()
    const guard = formula.match(/IF\((\w+)=/)?.[1]
    const g = manual.r2.find((r) => r[0] === guard)
    if (!g) throw new StepError(`fx 栏「${formula}」的守卫在手册 1.2 里查不到`)
    if (!formula.includes(g[1])) throw new StepError(`fx 栏「${formula}」里没有手册说的 ${g[1]}`)
    const value = sw['周末？'] ? g[3] : g[2]
    features.add(`r2:${guard}${sw['周末？']}`)
    await page.locator('.fx-input').click()
    await page.locator('.fx-editing').fill(formula.replace(g[1], value))
    await page.keyboard.press('Enter')
    await expectDefused(page, 2)
    log.push(`R2 ${guard}→${value}`)

    // ── 第 1 行 ──
    step = '第 1 行 合并单元格'
    const code1 = (await page.locator('.row1-select option').first().textContent()).trim()
    const r1 = branch(manual.r1, code1, ' 1.1 ')
    features.add(`r1:${code1}${r1.yes}`)
    await page.locator('.row1-select').selectOption({ label: `[${r1.answer}]` })
    await expectDefused(page, 1)
    log.push(`R1 ${code1}→${r1.answer}`)

    // ── 第 3 行 ──
    step = '第 3 行 拖宽 D 列'
    // 像玩家一样：在列标题里抓 D/E 分界线往右拖
    const grip = await page.locator('.d-col-resizer').boundingBox()
    const headerY = (await page.locator('.grid-wrap').boundingBox()).y + 10
    await page.mouse.move(grip.x + grip.width / 2, headerY)
    await page.mouse.down()
    await page.mouse.move(grip.x + 120, headerY, { steps: 4 })
    await page.mouse.up()
    if ((await page.locator('.d3-value').textContent()).includes('#'))
      throw new StepError('拖过 D/E 分界线后 D3 还是 ####')
    step = '第 3 行 切短日期'
    await page.locator('.format-select-btn').click()
    await page.locator('.format-select-item', { hasText: '短日期' }).click()
    const date3 = (await page.locator('.d3-value').textContent()).trim()
    step = '第 3 行 填口令'
    const flat = manual.appA.flat()
    const at = flat.indexOf(date3)
    if (at < 0) throw new StepError(`D3 显示 ${date3}，附录 A 里查不到`)
    const passcode = flat[at + 1]
    const cell3 = sw['版本号末位单数？'] ? 'F3' : 'H3'
    features.add(`cell:${cell3}`)
    const input = page.getByLabel(`${cell3} 口令输入`)
    await input.fill(passcode)
    await input.press('Enter')
    await expectDefused(page, 3)
    log.push(`R3 ${date3}→${passcode}@${cell3}`)

    // ── 第 5 行：等它假死 ──
    step = '第 5 行 等假死'
    await runUntil(page, () => page.locator('.row5-stuck-select').count(), 70, '第 5 行假死')
    step = '第 5 行 重启仪式'
    const code5 = (await page.locator('.row5-stuck-select option').first().textContent()).trim()
    const r5 = branch(manual.r5, code5, ' 1.5 ')
    features.add(`r5:${code5}${r5.yes}`)
    await page.locator('.row5-stuck-select').selectOption({ label: `[${r5.answer}]` })
    await expectDefused(page, 5)
    log.push(`R5 ${code5}→${r5.answer}`)

    step = '结局'
    await runUntil(page, () => page.locator('.end-overlay').count(), 10, '结局弹窗')
    const endClass = await page.locator('.end-overlay').getAttribute('class')
    if (!endClass.includes('won')) throw new StepError(`结局不是通关：${endClass}`)
    if (errors.length) throw new StepError(`页面报错：${errors.join(' / ')}`)
    return { seed, ok: true, features, ruleRows, report: `✓ ${seed}  ${log.join(' | ')}` }
  } catch (e) {
    await mkdir(ARTIFACTS, { recursive: true })
    const shot = `${ARTIFACTS}${seed}.png`
    await page.screenshot({ path: shot }).catch(() => {})
    const why = e instanceof StepError ? e.message : e.message.split('\n')[0]
    return {
      seed,
      ok: false,
      features,
      report: `✗ ${seed}  卡在【${step}】：${why}\n    已走：${log.join(' | ') || '（无）'}\n    截图：${shot}`,
    }
  } finally {
    await page.close()
  }
}

/** 推进假时钟（每次 1 秒，最多 maxSec 秒）直到条件成立 */
async function runUntil(page, cond, maxSec, what) {
  for (let i = 0; i <= maxSec; i++) {
    if (await cond()) return
    await page.clock.runFor(1000)
  }
  throw new StepError(`等了 ${maxSec} 秒游戏时间还没等到${what}`)
}

/** 拆除的那一刻会扫过「已拆 ✓」盖章（玩家看得见的反馈），以它为准 */
async function expectDefused(page, row) {
  for (let i = 0; i < 10; i++) {
    if (await page.locator(`.lv-sweep[data-row="${row}"]`).count()) return
    await page.clock.runFor(100)
  }
  throw new StepError(`操作完第 ${row} 行没出现「已拆 ✓」`)
}

/** 切到 Sheet2 读手册：五节规则表 + 附录 A/C；顺带核对附录 C 的读法和几句关键原文 */
async function readManual(page) {
  await page.locator('.sheet-tab', { hasText: 'Sheet2' }).click()
  await page.clock.runFor(100)
  const manual = await page.evaluate(() => {
    const rows = (t) => (t ? [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => c.textContent.trim())) : null)
    const inSection = (id) => rows(document.querySelector(`#${id} table`))
    const after = (id) => {
      let el = document.getElementById(id)
      while (el && el.tagName !== 'TABLE') el = el.nextElementSibling
      return rows(el)
    }
    return {
      r1: inSection('m-1-1'),
      r2: inSection('m-1-2'),
      r4: inSection('m-1-4'),
      r5: inSection('m-1-5'),
      appA: after('m-app-a'),
      appC: after('m-app-c'),
      text: document.querySelector('.manual--v2')?.textContent ?? '',
    }
  })
  await page.locator('.sheet-tab', { hasText: 'Sheet1' }).click()
  await page.clock.runFor(100)

  for (const [k, v] of Object.entries(manual)) if (!v) throw new StepError(`手册里找不到 ${k}（节 id 或表格变了？）`)
  for (const [q, r] of Object.entries(READINGS)) {
    const row = manual.appC.find((x) => x[0] === q)
    if (!row) throw new StepError(`附录 C 没有「${q}」`)
    if (row[2] !== r.yes) throw new StepError(`附录 C「${q}」改成了「${row[2]}」，更新 e2e 的 READINGS`)
  }
  for (const s of MANUAL_SENTENCES)
    if (!manual.text.replace(/\s+/g, ' ').includes(s)) throw new StepError(`手册里找不到「${s}」，检查机器人打法`)
  return manual
}

/** 外壳：全部来自玩家看得见的地方（标题栏、宏警告条、任务栏时钟） */
async function readShell(page) {
  const raw = await page.evaluate(() => ({
    title: document.querySelector('.titlebar .title')?.textContent ?? '',
    macro: !!document.querySelector('.macro-bar'),
    date: document.querySelector('.tb-clock small')?.textContent ?? '',
    clock: document.querySelector('.tb-clock b')?.textContent ?? '',
  }))
  const version = raw.title.match(/_v(\d+)\.xlsx/)?.[1]
  const date = raw.date.match(/\d+\/\d+\/(\d+) (周.)/)
  const hour = raw.clock.match(/^(\d+):/)?.[1]
  if (!version || !date || !hour) throw new StepError(`外壳读不出来：${JSON.stringify(raw)}`)
  return {
    ...raw,
    version: Number(version),
    day: Number(date[1]),
    weekday: date[2],
    hour: Number(hour),
  }
}

/** 默认种子必须覆盖每个开关的两面、每行规则的两个分支（数量从手册表格算） */
function checkCoverage(rs) {
  const seen = new Set(rs.flatMap((r) => [...r.features]))
  const has = (prefix) => [...seen].filter((f) => f.startsWith(prefix)).length
  const need = { 'scene:': 4, 'macro:': 2, 'odd:': 2, 'pay:': 2, 'mode:': 2, 'cell:': 2 }
  // 规则表每行两个分支（Row2 是平日/周末两列），行数从手册读
  for (const [p, n] of Object.entries(rs[0].ruleRows)) need[p] = n * 2
  const missing = Object.entries(need).filter(([p, n]) => has(p) < n)
  for (const [p, n] of missing) console.log(`覆盖不全：${p} 只见到 ${has(p)}/${n} 种`)
  return missing.length === 0
}
