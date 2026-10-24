/**
 * Sheet2：《离职交接文档》手册空壳（issue #3）。
 * 手册正文由后续票填充；本组件与 Sheet1 网格常驻挂载，由 CSS 显隐切换。
 */
export function ManualSheet() {
  return (
    <div className="manual">
      <h1 className="manual-title">离职交接文档_v3_真最终版_打死不改</h1>
      <div className="manual-meta">
        作者：已跑路的前同事 ｜ 最后修改：2016-04-06 ｜ 可信度：约等于评论区
      </div>
      <p>
        本文档由前任维护者在离职前一晚赶工完成。其中 30% 的内容是复制粘贴，60%
        是过期的截图，剩下 10% 是道歉。
      </p>
      <p>第一章（待补充）：模块启动顺序——反正不是本文档里写的那个顺序。</p>
      <p>第二章（待补充）：口令验证绕过技巧——作者本人也表示不知道它为什么能跑。</p>
      <p>（以下内容丢失于一次忘记 pop 的 git stash。）</p>
    </div>
  )
}
