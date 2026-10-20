import { requestJSON, requestEmpty } from './client'
import { record, num, date, isArrayOf } from './validate'

export interface SetupStatus {
  required: boolean
  available: boolean
  running: boolean
}
export interface Source {
  driver: string
  dsn: string
  prefix: string
  texturesDir: string
  timeZone: string
  passwordMethod: string
  uuidOverrides: Record<string, string>
  importSettings: boolean
}
export interface ImportReport {
  counts: Record<string, number>
  skipped: Record<string, number>
  blocking: number
  issues: { table: string; id: string; code: string }[]
  players: { pid: string; name: string; uuid: string }[]
  omitted: string[]
}
export interface ImportRun {
  id: string
  dryRun: boolean
  state: 0 | 1 | 2 | 3
  stage: string
  processed: number
  report: ImportReport
  createdAt: string
  completedAt: string | null
}
export interface RunKey {
  ID: string
  RunKey: string
}
export const isSetupStatus = (v: unknown): v is SetupStatus =>
  record(v) &&
  typeof v.required === 'boolean' &&
  typeof v.available === 'boolean' &&
  typeof v.running === 'boolean'
const counts = (v: unknown) => record(v) && Object.values(v).every((n) => num(n) && n >= 0)
export const isImportReport = (v: unknown): v is ImportReport =>
  record(v) &&
  counts(v.counts) &&
  counts(v.skipped) &&
  num(v.blocking) &&
  v.blocking >= 0 &&
  isArrayOf(
    (i): i is ImportReport['issues'][number] =>
      record(i) && ['table', 'id', 'code'].every((k) => typeof i[k] === 'string'),
  )(v.issues) &&
  isArrayOf(
    (p): p is ImportReport['players'][number] =>
      record(p) && ['pid', 'name', 'uuid'].every((k) => typeof p[k] === 'string'),
  )(v.players) &&
  Array.isArray(v.omitted) &&
  v.omitted.every((s) => typeof s === 'string')
export const isImportRun = (v: unknown): v is ImportRun =>
  record(v) &&
  typeof v.id === 'string' &&
  typeof v.dryRun === 'boolean' &&
  num(v.state) &&
  [0, 1, 2, 3].includes(v.state) &&
  typeof v.stage === 'string' &&
  num(v.processed) &&
  v.processed >= 0 &&
  isImportReport(v.report) &&
  date(v.createdAt) &&
  (v.completedAt === null || date(v.completedAt))
export const getSetup = (signal?: AbortSignal) =>
  requestJSON('/api/setup', isSetupStatus, { signal, authenticated: false })
export const verifySetup = (code: string) =>
  requestEmpty('/api/setup/verify', { method: 'POST', body: { code }, authenticated: false })
export const createSite = (body: {
  code: string
  name: string
  email: string
  password: string
  player: string
}) => requestEmpty('/api/setup', { method: 'POST', body, authenticated: false })
export const startImport = (
  entry: 'setup' | 'admin',
  source: Source,
  dryRun: boolean,
  code: string,
  previewId: string,
) =>
  requestJSON(
    '/api/' + entry + '/import',
    (v): v is RunKey => record(v) && typeof v.ID === 'string' && typeof v.RunKey === 'string',
    {
      method: 'POST',
      body: { source, dryRun, code, confirm: !dryRun, previewId },
      authenticated: entry === 'admin',
    },
  )
export const importStatus = (key: RunKey, signal?: AbortSignal) =>
  requestJSON('/api/import/status', isImportRun, {
    method: 'POST',
    body: key,
    signal,
    authenticated: false,
  })
export const cancelImport = (key: RunKey) =>
  requestJSON('/api/import/cancel', isImportRun, {
    method: 'POST',
    body: key,
    authenticated: false,
  })
export const importHistory = (signal?: AbortSignal) =>
  requestJSON('/api/admin/import/history', isArrayOf(isImportRun), { signal })
