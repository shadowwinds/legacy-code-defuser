import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'

test('开局任务栏与 Excel 同显 16:56:00，聊天收起且无未读红点', async () => {
  const { Taskbar } = await import('./Taskbar')
  const { StatusBar } = await import('../ExcelShell/StatusBar')

  const taskbar = renderToStaticMarkup(<Taskbar />)
  const statusbar = renderToStaticMarkup(<StatusBar />)

  expect(taskbar).toContain('<b>16:56:00</b>')
  expect(statusbar).toContain('16:56:00')
  expect(taskbar).toContain('aria-pressed="false"')
  expect(taskbar).not.toContain('class="tb-unread"')
})
