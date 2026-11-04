import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // agent 并行开发用的 git worktree 不参与本仓测试
    exclude: [...configDefaults.exclude, '.claude/**'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
