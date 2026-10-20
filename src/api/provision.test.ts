import { describe, it, expect } from 'vitest'
import { parseBSEnv } from '../lib/bs-env'
import { isImportReport, isImportRun, isSetupStatus } from './provision'
describe('初始化和迁移契约', () => {
  it('解析 BS 环境但不保留全站盐或无关密钥', () => {
    const parsed = parseBSEnv(
      'DB_CONNECTION=mysql\nDB_DATABASE=bs\nDB_USERNAME=user\nDB_PASSWORD="pass@word"\nDB_PREFIX=bs_\nSALT=private\nAPP_KEY=hidden',
    )
    expect(parsed.dsn).toBe('user:pass@word@tcp(127.0.0.1:3306)/bs')
    expect(parsed.prefix).toBe('bs_')
    expect(JSON.stringify(parsed)).not.toContain('private')
    expect(JSON.stringify(parsed)).not.toContain('hidden')
  })
  it('不将远程对象存储误认为本地材质目录', () => {
    expect(() =>
      parseBSEnv('DB_CONNECTION=mysql\nDB_DATABASE=bs\nDB_USERNAME=u\nFS_DRIVER=s3'),
    ).toThrow()
  })
  it('没有完整状态和报告时不能展示可执行试跑', () => {
    const report = {
      counts: { users: 1 },
      skipped: {},
      issues: [],
      blocking: 0,
      players: [],
      omitted: [],
    }
    expect(isImportReport(report)).toBe(true)
    expect(isImportReport({ ...report, blocking: -1 })).toBe(false)
    expect(
      isImportRun({
        id: 'run',
        dryRun: true,
        state: 1,
        stage: 'complete',
        processed: 1,
        report,
        createdAt: '2026-10-18T00:00:00Z',
        completedAt: null,
      }),
    ).toBe(true)
    expect(isImportRun({ state: 1, report })).toBe(false)
    expect(isSetupStatus({ required: true })).toBe(false)
  })
})
