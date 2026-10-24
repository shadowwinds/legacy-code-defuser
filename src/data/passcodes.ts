/**
 * 乱码考古·口令验证（Row3）的口令附录（GDD §2.3 / §2.7）。
 * 每局从 5 行中随机选 1 行生效：serial 为 D3 单元格显示的日期序列值，
 * date 为切「短日期」格式后还原出的口令提示，passcode 为应填回的口令。
 */
export interface PasscodeEntry {
  /** Excel 日期序列值 */
  serial: number
  /** 序列值对应的日期（口令提示） */
  date: string
  /** 口令 */
  passcode: string
}

export const PASSCODES: PasscodeEntry[] = [
  { serial: 42005.0, date: '2015-01-05', passcode: 'Q3_OKR_别问' },
  { serial: 42441.5, date: '2016-03-14', passcode: 'left_pad_同款' },
  { serial: 42736.0, date: '2017-01-03', passcode: '老板生日快乐' },
  { serial: 43101.0, date: '2018-01-03', passcode: '跑路勿念' },
  { serial: 43466.5, date: '2019-01-03', passcode: '锟斤拷烫烫烫' },
]
