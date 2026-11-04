import type { ReactNode } from 'react'
import { ROW1_CODES, ROW1_OPTION_LABELS, ROW1_TABLE } from '../../rules/modules/row1'
import { ROW2_GUARDS } from '../../rules/modules/row2'
import { PASSCODES_V2 } from '../../rules/modules/row3'
import { row4Target } from '../../rules/modules/row4'
import { ROW5_CODES, ROW5_RITUAL_LABELS, ROW5_TABLE } from '../../rules/modules/row5'
import { PREDICATE_MANUAL, createSituation } from '../../rules/situation'
import './manualSheet.css'

/** 选项标签去掉下拉里的方括号 */
const strip = (label: string) => label.replace(/^\[|\]$/g, '')
const question = (p: string) => PREDICATE_MANUAL[p as keyof typeof PREDICATE_MANUAL].question

/** 平账目标表：直接问引擎（只读场景的周末/深夜两个开关） */
const BASE = createSituation('MANUAL')
const targetAt = (weekend: boolean, night: boolean) => row4Target({ ...BASE, scene: { ...BASE.scene, weekend, night } })

/** 吸顶目录：Tab 切过来时游戏照跑，最常查的几节一键跳过去（只滚手册容器，不改地址栏） */
const TOC: [string, string][] = [
  ['m-1-1', '1.1 合并'],
  ['m-1-2', '1.2 网关'],
  ['m-1-3', '1.3 口令'],
  ['m-1-4', '1.4 平账'],
  ['m-1-5', '1.5 重启'],
  ['m-app-a', '附录A 口令表'],
  ['m-app-c', '附录C 去哪找'],
]

function Toc() {
  return (
    <nav className="manual-toc" aria-label="手册目录">
      {TOC.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className="manual-toc-btn"
          onClick={() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

function Section({ no, title, lead, children }: { no: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section className="manual-module" id={`m-${no.replace('.', '-')}`}>
      <h3 className="manual-h3">
        <span className="manual-no">{no}</span>
        {title}
      </h3>
      <p className="manual-lead">{lead}</p>
      {children}
    </section>
  )
}

const HALF = Math.ceil(PASSCODES_V2.length / 2)

function PasscodeCells({ e, split = false }: { e: (typeof PASSCODES_V2)[number]; split?: boolean }) {
  return (
    <>
      <td className={`manual-mono${split ? ' manual-split' : ''}`}>{e.serial.toFixed(1)}</td>
      <td className="manual-mono">{e.date}</td>
      <td>
        <code>{e.passcode}</code>
      </td>
    </>
  )
}

function SwitchTable({ head, rows }: { head: string; rows: [string, string, string, string][] }) {
  return (
    <table className="manual-table">
      <thead>
        <tr>
          <th>{head}</th>
          <th>看什么</th>
          <th>否 → 选</th>
          <th>是 → 选</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b, c, d]) => (
          <tr key={a}>
            <td>
              <code>{a}</code>
            </td>
            <td>{b}</td>
            <td>{c}</td>
            <td>{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Sheet2 · v2 手册《离职交接文档》（#57，定稿 docs/gdd/08-v2-manual.md）。
 * 规则表全部由引擎的规则数据渲染（rules/modules/row*.ts、PREDICATE_MANUAL），手册与判定不可能漂移；
 * 散文部分逐字来自定稿稿。
 */
export function ManualSheetV2() {
  return (
    <div className="manual manual--v2">
      <Toc />
      <article className="manual-paper">
        <h1 className="manual-title">离职交接文档_v4_真真最终版_这次真的不改了</h1>
        <div className="manual-meta">作者：老王 · 最后修改：离职当天 17:59</div>

        <h2 className="manual-h2">前言</h2>
        <blockquote className="manual-quote">
          <p>接手的兄弟，对不住。这表连着生产环境，宏是 2013 年写的，我改不动也不想改。</p>
          <p>
            这表每次打开都不一样——版本号、日期、报错全看心情。所以下面每条规则都是「先看它报什么，再看一个开关」。开关去哪看，翻到最后的
            <strong>附录 C</strong>。
          </p>
          <p>按我说的做，别发挥。Sheet1 是唯一真数据源，底部那两个「最终版」标签是考古现场，别点。</p>
          <p className="manual-sign">——老王</p>
        </blockquote>

        <h2 className="manual-h2">第 1 节 · 逐模块拆解</h2>

        <Section no="1.1" title="跨部门汇总合并单元格（第 1 行）" lead="颗粒度对不齐它就报错。报什么错，就按什么拆。">
          <p className="manual-item-text">
            看 <strong>A1 的报错</strong>，在 F1 下拉里选：
          </p>
          <SwitchTable
            head="A1 报错"
            rows={ROW1_CODES.map((code) => {
              const r = ROW1_TABLE[code]
              return [code, question(r.when), strip(ROW1_OPTION_LABELS[r.no]), strip(ROW1_OPTION_LABELS[r.yes])]
            })}
          />
          <ul className="manual-list manual-list--plain">
            <li className="manual-item">选错：本行扣 20 秒。</li>
            <li className="manual-item">
              <strong>任何时候都别选【合并后居中】</strong>：每一行都扣 15 秒。2014 年有人选过，这表才长这样。
            </li>
          </ul>
        </Section>

        <Section no="1.2" title="防欠薪定时自爆网关（第 2 行）" lead="外包埋的。只要它觉得被欠薪就炸。骗它。">
          <p className="manual-item-text">
            选中第 2 行，看 <strong>fx 栏公式 <code>IF(</code> 后面那个词</strong>（守卫），把引号里的值改成下表的值，回车：
          </p>
          <table className="manual-table">
            <thead>
              <tr>
                <th>守卫</th>
                <th>公式里的值</th>
                <th>平日改成</th>
                <th>周末改成</th>
              </tr>
            </thead>
            <tbody>
              {ROW2_GUARDS.map((g) => (
                <tr key={g.guard}>
                  <td className="manual-mono">{g.guard}</td>
                  <td className="manual-mono">"{g.danger}"</td>
                  <td className="manual-mono">"{g.weekday}"</td>
                  <td className="manual-mono">"{g.weekend}"</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="manual-list manual-list--plain">
            <li className="manual-item">只改引号里的值，别的不动。大小写、单双引号都行。</li>
            <li className="manual-item">改错：本行扣 10 秒。</li>
          </ul>
        </Section>

        <Section no="1.3" title="乱码考古·口令验证（第 3 行）" lead="D 列那串井号不是坏了，是窄了。">
          <ol className="manual-steps">
            <li>拖宽 D 列（拖 D 和 E 之间的分界线），#### 变成一个数。</li>
            <li>公式栏最右边的格式下拉（平时显示「常规」）切到「短日期」，数变成日期。</li>
            <li>在附录 A 找到这个日期，抄下口令。</li>
            <li>
              <strong>版本号末位单数 → 填 F3；双数 → 填 H3</strong>。回车。
            </li>
          </ol>
          <ul className="manual-list manual-list--plain">
            <li className="manual-item">口令填错或格子填错：本行直接锁到剩 5 秒，填对才解锁。</li>
          </ul>
        </Section>

        <Section no="1.4" title="财务对账平账脚本_勿动（第 4 行）" lead="千万别改代码。凑数。凑数就行。">
          <p className="manual-item-text">
            看 <strong>左下角状态栏显示的是「求和」还是「平均值」</strong>，在 G 列改数，让它等于下表的目标：
          </p>
          <table className="manual-table manual-table--compact">
            <thead>
              <tr>
                <th />
                <th>白天</th>
                <th>深夜</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>平日</th>
                <td>{targetAt(false, false)}</td>
                <td>{targetAt(false, true)}</td>
              </tr>
              <tr>
                <th>周末</th>
                <td>{targetAt(true, false)}</td>
                <td>{targetAt(true, true)}</td>
              </tr>
            </tbody>
          </table>
          <ul className="manual-list manual-list--plain">
            <li className="manual-item">
              先把 <code>#DIV/0!</code> 那格清空，不然状态栏算不出数。
            </li>
            <li className="manual-item">平均值不算空格。</li>
            <li className="manual-item">第 8 行那格别碰（见第 2 节）。</li>
            <li className="manual-item">账没平超过 10 秒会冲下游，见第 4 节。</li>
          </ul>
        </Section>

        <Section no="1.5" title="拜机房神兽重启仪式（第 5 行）" lead="它会假死。真死我们叫爆炸。">
          <p className="manual-item-text">
            假死时 F5 会报错，<strong>15 秒内</strong>在下拉里选对仪式：
          </p>
          <SwitchTable
            head="F5 报错"
            rows={ROW5_CODES.map((code) => {
              const r = ROW5_TABLE[code]
              return [code, question(r.when), strip(ROW5_RITUAL_LABELS[r.no]), strip(ROW5_RITUAL_LABELS[r.yes])]
            })}
          />
          <ul className="manual-list manual-list--plain">
            <li className="manual-item">选错：本行扣 10 秒，还能接着选。</li>
            <li className="manual-item">15 秒内没选对：当场爆炸。</li>
          </ul>
        </Section>

        <h2 className="manual-h2">第 2 节 · 常见报错黑话对照</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item">
            <code>#DEADLOCK!</code>：不是锁死，是谈崩了。
          </li>
          <li className="manual-item">
            <code>#VALUE!</code>：你填的东西它不认，多半是你没看附录。
          </li>
          <li className="manual-item">
            <code>#DIV/0!</code>：分母跑路了。
          </li>
          <li className="manual-item">第 8 行「别动它能跑」：点一下全表扣 30 秒。它能跑，别动它。</li>
        </ul>

        <h2 className="manual-h2">第 3 节 · 技能使用守则</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item">
            <strong>格式刷</strong>：能骗过监控，骗不过倒计时。选中的那行假绿 10 秒，倒计时照走。冷却 30 秒。
          </li>
          <li className="manual-item">
            <strong>冻结窗格</strong>：前 4 行倒计时停 8 秒。冷却 45 秒。别指望它，指望它的人都炸了。
          </li>
        </ul>

        <h2 className="manual-h2">第 4 节 · 依赖关系声明</h2>
        <ul className="manual-list manual-list--numbered">
          <li className="manual-item">
            <span className="manual-no">4.1</span>
            <p className="manual-item-text">对账脚本（1.4）账没平超过 10 秒，脏数据流进 1.2 和 1.3，各扣 15 秒，之后每 10 秒再来一次。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">4.2</span>
            <p className="manual-item-text">重启仪式（1.5）成功会反噬一个还没拆的模块，扣 5 秒。祖师爷显灵，概不负责。</p>
          </li>
        </ul>

        <h2 className="manual-h2" id="m-app-a">
          附录A · 乱码对照表<span className="manual-h2-note">（每次只有一行是真的）</span>
        </h2>
        {/* 12 行左右各半，省一半高度 */}
        <table className="manual-table manual-table--wide">
          <thead>
            <tr>
              <th>日期序列值</th>
              <th>短日期</th>
              <th>口令</th>
              <th className="manual-split">日期序列值</th>
              <th>短日期</th>
              <th>口令</th>
            </tr>
          </thead>
          <tbody>
            {PASSCODES_V2.slice(0, HALF).map((left, i) => {
              const right = PASSCODES_V2[i + HALF]
              return (
                <tr key={left.date}>
                  <PasscodeCells e={left} />
                  {right ? <PasscodeCells e={right} split /> : null}
                </tr>
              )
            })}
          </tbody>
        </table>

        <h2 className="manual-h2">附录B · 杂谈</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item">
            外包张三在网关里给自己留了后门：<strong>有宏警告条，并且文件作者是「外包-张三」</strong>
            的时候，在整条公式外面套一层 <code>=IFERROR(原公式, "200 OK")</code> 也能过。别的时候套了，算你改错。作者在【文件 → 信息】里看。
          </li>
          <li className="manual-item">
            平账的时候状态栏要是「求和」，可以偷懒：在 G 列随便一格（第 8 行除外）写 <code>=目标-SUM(G2:G9)</code>，比如{' '}
            <code>=996-SUM(G2:G9)</code>。「平均值」的时候别试，试了就是 <code>#VALUE!</code>。
          </li>
          <li className="manual-item">想看我黑历史的同学请移步 G28。（G28 写着：没有黑历史，都是被人陷害的。）</li>
        </ul>

        <h2 className="manual-h2" id="m-app-c">
          附录C · 去哪找
        </h2>
        <table className="manual-table">
          <thead>
            <tr>
              <th>规则里问的</th>
              <th>去哪看</th>
              <th>怎么算「是」</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(PREDICATE_MANUAL).map((p) => (
              <tr key={p.question}>
                <td>{p.question}</td>
                <td>{p.where}</td>
                <td>{p.yes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="manual-item-text">
          【文件 → 信息】里还有大小、修订次数、上次修改、公司、标记……正文的规则一个都不用，别在那儿浪费时间。
        </p>
      </article>
    </div>
  )
}
