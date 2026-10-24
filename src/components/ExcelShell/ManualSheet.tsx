import './manualSheet.css'

/**
 * Sheet2：《离职交接文档》全文渲染（issue #6）。
 * 内容逐字来自 docs/gdd/03-story-gameplay.md §3.3，仅做拟物化呈现，不改写。
 * 与 Sheet1 常驻挂载，由外层 .sheet-pane 的 CSS 显隐切换；根节点即滚动容器。
 */

/** 附录A · 乱码对照表（每局随机 1 行生效；data-idx 为后续生效行高亮的样式钩子） */
const PASSCODE_ROWS = [
  { idx: 0, serial: '42005.0', date: '2015-01-05', passcode: 'Q3_OKR_别问' },
  { idx: 1, serial: '42441.5', date: '2016-03-14', passcode: 'left_pad_同款' },
  { idx: 2, serial: '42736.0', date: '2017-01-03', passcode: '老板生日快乐' },
  { idx: 3, serial: '43101.0', date: '2018-01-03', passcode: '跑路勿念' },
  { idx: 4, serial: '43466.5', date: '2019-01-03', passcode: '锟斤拷烫烫烫' },
]

export function ManualSheet() {
  return (
    <div className="manual">
      <article className="manual-paper">
        <h1 className="manual-title">离职交接文档_v3_真最终版_打死不改</h1>
        <div className="manual-meta">作者：老王 · 最后修改：离职当天 17:59</div>

        <h2 className="manual-h2">前言</h2>
        <blockquote className="manual-quote">
          <p>接手的兄弟，对不住。这表连着生产环境，宏是 2013 年写的，我改不动也不想改。规则我全写在下面了，按我说的做，别发挥。另外：Sheet1 是唯一真数据源，底部那两个「最终版」标签是考古现场，别点。</p>
          <p className="manual-sign">——老王</p>
        </blockquote>

        <h2 className="manual-h2">第 1 节 · 逐模块拆解</h2>
        <ul className="manual-list manual-list--numbered">
          <li className="manual-item">
            <span className="manual-no">1.1</span>
            <p className="manual-item-text"><strong>合并单元格</strong>：若 1.2 号网关还在自爆待解除，先对 1.1 执行【拆分并填充值】对齐颗粒度；否则【保留合并强行写入】即可闭环。别的选项别碰，尤其别居中。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">1.2</span>
            <p className="manual-item-text"><strong>防欠薪网关</strong>：外包那帮孙子在网关里埋了防赖账逻辑，只有觉得被欠薪才炸。你要是动不了它，说明它觉得你欠薪。把环境改成 LOCALHOST，骗它说你在本地测——外包最信本地。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">1.3</span>
            <p className="manual-item-text"><strong>乱码考古</strong>：D 列那串井号不是坏了，是窄了。拉宽了看，是个数。数不是数，是日期。格式切一下看。对照附录A，把口令填回去。别问为什么，Excel 1900 年没有 2 月 29 日，这事没人能解释。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">1.4</span>
            <p className="manual-item-text"><strong>平账脚本</strong>：千万别改代码！凑数！G 列凑到右下角求和 1024，它就认为账平了。别问，问就是祖传浮点精度。失衡超 10 秒会冲下游，见第 4 节。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">1.5</span>
            <p className="manual-item-text"><strong>重启仪式</strong>：每逢假死，上香重启（下拉选【重启服务】），15 秒内必须完成。重启必反噬，砸谁看祖师爷心情。心要诚，手要快。</p>
          </li>
        </ul>

        <h2 className="manual-h2">第 2 节 · 常见报错黑话对照</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item"><p className="manual-item-text"><code>#DEADLOCK!</code>：不是锁死，是谈崩了。</p></li>
          <li className="manual-item"><p className="manual-item-text"><code>#VALUE!</code>：你填的东西它不认，多半是你没看附录。</p></li>
          <li className="manual-item"><p className="manual-item-text"><code>#DIV/0!</code>：分母跑路了。</p></li>
          <li className="manual-item"><p className="manual-item-text"><code>#STUCK!</code>：假死。真死我们叫爆炸。</p></li>
        </ul>

        <h2 className="manual-h2">第 3 节 · 技能使用守则</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item"><p className="manual-item-text"><strong>格式刷</strong>：能骗过监控，骗不过倒计时。绿 10 秒，纯买时间用。</p></li>
          <li className="manual-item"><p className="manual-item-text"><strong>冻结窗格</strong>：物理降温 8 秒，前 4 行有效。别指望它，指望它的人都炸了。</p></li>
        </ul>

        <h2 className="manual-h2">第 4 节 · 依赖关系声明</h2>
        <ul className="manual-list manual-list--numbered">
          <li className="manual-item">
            <span className="manual-no">4.1</span>
            <p className="manual-item-text">对账脚本（1.4）失衡超 10 秒，脏数据流进 1.2 和 1.3，各扣 15 秒。</p>
          </li>
          <li className="manual-item">
            <span className="manual-no">4.2</span>
            <p className="manual-item-text">重启仪式（1.5）成功会反噬一个还没拆的模块，扣 5 秒。祖师爷显灵，概不负责。</p>
          </li>
        </ul>

        <h2 className="manual-h2">附录A · 乱码对照表<span className="manual-h2-note">（每局随机 1 行生效）</span></h2>
        <table className="manual-table">
          <thead>
            <tr><th>日期序列值</th><th>短日期还原</th><th>口令</th></tr>
          </thead>
          <tbody>
            {PASSCODE_ROWS.map((row) => (
              <tr key={row.idx} data-idx={row.idx}>
                <td className="manual-mono">{row.serial}</td>
                <td className="manual-mono">{row.date}</td>
                <td><code>{row.passcode}</code></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="manual-h2">附录B · 杂谈</h2>
        <ul className="manual-list manual-list--plain">
          <li className="manual-item"><p className="manual-item-text">想看我黑历史的同学请移步 G28。</p></li>
          <li className="manual-item"><p className="manual-item-text">（G28 写着）：没有黑历史，都是被人陷害的。</p></li>
        </ul>
      </article>
    </div>
  )
}
