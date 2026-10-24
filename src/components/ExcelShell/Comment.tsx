/** 单元格批注：右上角红三角标记，hover 弹出米黄批注框（拟 Excel 批注样式） */
export function Comment({ text }: { text: string }) {
  return (
    <span className="comment">
      <span className="comment-tri" />
      <span className="comment-pop">{text}</span>
    </span>
  )
}
