/**
 * 时间场景 → 桌面壳文案与时钟（GDD 07 §7.2，#55）。
 * 纯函数：传 null 得到 v1 的原样文案（17:00 下班封网），传局面得到本局场景的文案。
 * 对话文案里的占位符（{deadline} 等）和 sceneText 覆盖在 desktop/dialogues.ts 加载时解析。
 */
import { getRunConfig } from '../lib/seed'
import { row4Target } from './modules/row4'
import { createSituation, workbookName, type SceneId, type Situation } from './situation'

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

/** 对话文案允许的占位符（validate-dialogues.mjs 同步校验） */
export const DIALOGUE_PLACEHOLDERS = ['date', 'weekday', 'introTime', 'deadline', 'workbook', 'row4Target'] as const
export type DialoguePlaceholder = (typeof DIALOGUE_PLACEHOLDERS)[number]

export interface SceneCopy {
  /** v2 场景 id；v1 为 null（对话不取 sceneText 覆盖） */
  sceneId: SceneId | null
  /** 截止钟点（24 = 次日 00:00）；时钟从它往前 4 分钟起跳 */
  deadlineHour: number
  /** 任务栏日期，如 2026/10/24 周五 */
  dateLabel: string
  /** 引信烧完的结局原因 */
  fuseReason: string
  /** 全拆的结局原因 */
  winReason: string
  /** 结局聊天窗标题 */
  chatTitle: string
  /** 对话占位符取值 */
  vars: Record<DialoguePlaceholder, string>
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const hhmm = (minutes: number) => `${pad2(Math.floor(minutes / 60) % 24)}:${pad2(minutes % 60)}`

const V1_WORKBOOK = '核心业务_最终版_打死勿动.xlsx'

/** 每个场景的收尾说法 */
const SCENE_LINES: Record<SceneId, { win: string; chat: string }> = {
  'fri-close': { win: '准点跑路，下班！', chat: '下班前最后的消息' },
  'wed-release': { win: '发版窗口关闭前全绿，打车回家！', chat: '发版窗口关闭前最后的消息' },
  'sat-review': { win: '甲方验收全绿，回去补觉！', chat: '验收结束前最后的消息' },
  'sun-eve': { win: '零点前全绿，明天例会有东西讲了！', chat: '例会前夜最后的消息' },
}

export function sceneCopy(situation: Situation | null): SceneCopy {
  if (situation === null) {
    return {
      sceneId: null,
      deadlineHour: 17,
      dateLabel: '2026/10/24 周五',
      fuseReason: '17:00 了，引信烧完，全表爆炸。',
      winReason: '17:00 准点跑路，下班！',
      chatTitle: '下班前最后的消息',
      vars: {
        date: '2026-10-24',
        weekday: '周五',
        introTime: '16:53',
        deadline: '17:00',
        workbook: V1_WORKBOOK,
        row4Target: '1024',
      },
    }
  }
  const { scene, date } = situation
  const deadline = hhmm(scene.deadlineHour * 60)
  const weekday = WEEKDAY_NAMES[scene.weekday]
  const lines = SCENE_LINES[scene.id]
  return {
    sceneId: scene.id,
    deadlineHour: scene.deadlineHour,
    dateLabel: `${date.year}/${date.month}/${date.day} ${weekday}`,
    fuseReason: `${deadline} 了，引信烧完，全表爆炸。`,
    winReason: `${deadline} ${lines.win}`,
    chatTitle: lines.chat,
    vars: {
      date: `${date.year}-${pad2(date.month)}-${pad2(date.day)}`,
      weekday,
      introTime: hhmm(scene.deadlineHour * 60 - 7),
      deadline,
      workbook: workbookName(situation),
      row4Target: String(row4Target(situation)),
    },
  }
}

/** 解析一条对话文案：有本场景的 sceneText 覆盖就用覆盖，再替换占位符 */
export function resolveDialogueText(
  text: string,
  sceneText: Partial<Record<SceneId, string>> | undefined,
  copy: SceneCopy,
): string {
  const base = (copy.sceneId && sceneText?.[copy.sceneId]) || text
  return base.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in copy.vars ? copy.vars[key as DialoguePlaceholder] : whole,
  )
}

let cached: SceneCopy | null = null
/** 本局场景文案（v2 关闭时为 v1 原样文案），按局缓存 */
export function runSceneCopy(): SceneCopy {
  const { v2, seed } = getRunConfig()
  return (cached ??= sceneCopy(v2 ? createSituation(seed) : null))
}
