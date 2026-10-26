import { expect, test } from 'vitest'
import type { EndingKey } from './dialogues'

test('文案加载器按契约返回分镜、结局组及缺失事件', async () => {
  const { getStoryboard, getEndingGroup, getPushByEvent } = await import('./dialogues')

  expect(getStoryboard().map((m) => m.id)).toEqual([
    'sb_01', 'sb_02', 'sb_03', 'sb_04', 'sb_05', 'sb_06', 'sb_07', 'sb_08', 'sb_09', 'sb_10',
  ])
  expect(getEndingGroup('row4').map((m) => m.id)).toEqual([
    'ed_row4_01', 'ed_row4_02', 'ed_row4_03', 'ed_row4_04',
  ])
  expect(getPushByEvent('row5_stuck_repeat')).toBeUndefined()
})

test('时间锚与彩蛋通过同一份文案查询，缺失文案可安全忽略', async () => {
  const { getMessage, getTimeAnchors, getTooltip } = await import('./dialogues')

  expect(getTimeAnchors().map((m) => [m.id, m.trigger.atSec])).toEqual([['ep_time_160', 160]])
  expect(getTooltip('egg_wang_blocked')).toBe('消息已发出,但被对方拒收了。')
  expect(getTooltip('missing')).toBe('')
  expect(getMessage('missing')).toBeUndefined()
})

test.each<[number, EndingKey]>([[1, 'row1'], [2, 'row2'], [3, 'row3'], [4, 'row4'], [5, 'row5']])(
  '第 %i 行归零映射到 %s 结局',
  async (row, ending) => {
    const { endingOf } = await import('./dialogues')
    const { useGameStore } = await import('../store')
    useGameStore.getState().penalizeRow(row, 999)

    expect(endingOf(useGameStore.getState())).toBe(ending)
  },
)

test('结局映射遵循进行中、通关、引信归零的引擎优先级', async () => {
  const { endingOf } = await import('./dialogues')
  const modules = [{ row: 4, remaining: 0, initial: 60, defused: false }]

  expect(endingOf({ status: 'playing', fuseRemaining: 240, modules })).toBeNull()
  expect(endingOf({ status: 'won', fuseRemaining: 0, modules })).toBe('win')
  expect(endingOf({ status: 'exploded', fuseRemaining: 0, modules })).toBe('fuse')
})
