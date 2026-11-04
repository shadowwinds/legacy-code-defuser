/**
 * 碰撞率（GLOSSARY）：照搬上一局某模块的答案、在本局仍然正确的概率。
 * 用连续 n 个种子各开一局，统计相邻两局答案相同的比例（GDD 07 §7.5，验收 ≤ 0.2）。
 * 答案用 JSON 比较，模块可以返回任意可序列化的值。
 */
export function collisionRate<T>(answerFor: (seed: string) => T, n = 1000): number {
  let same = 0
  let prev = JSON.stringify(answerFor('C0'))
  for (let i = 1; i < n; i++) {
    const cur = JSON.stringify(answerFor(`C${i}`))
    if (cur === prev) same += 1
    prev = cur
  }
  return same / (n - 1)
}
