import { useState, type FormEvent } from 'react'
import { api } from '../api/resources'
import type { Account, Audit, Page, Report } from '../api/types'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'
import { useAction } from '../lib/useAction'
import { date } from '../lib/format'
import { accountStateLabel, actionLabel, permissionLabel, reportStateLabel } from '../api/enums'
import { setQuery } from '../lib/router'
import { Badge, Button, Dialog, EmptyState, ErrorState, Field, Pagination, Skeleton } from '../components/UI'
import { t } from '../i18n/zh-CN'

type Change = { kind: 'texture'
  id: string
  state: number } | { kind: 'user'
  user: Account
  state: number
  permission: number } | { kind: 'report'
  report: Report
  resolution: number }
export function Admin({ mode, params }: { mode: 'users' | 'reports' | 'audit'
  params: URLSearchParams }) {
  const auth = useAuth()
  const offset = Math.max(0, Number(params.get('offset')) || 0)
  const allowed = !!auth.account && auth.account.permission >= 1
  const list = useAsync<Page<Account | Report | Audit>>(signal => allowed ? api[mode](offset, signal) : Promise.resolve({ items: [], total: 0, limit: 50, next: false }), [mode, offset, allowed])
  const action = useAction()
  const [change, setChange] = useState<Change | null>(null)
  if (!allowed) return <ErrorState message={t('forbidden')} />
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!change) return
    void action.run(signal => change.kind === 'texture' ? api.moderate(change.id, change.state, signal) : change.kind === 'user' ? api.manageUser(change.user.id, change.state, change.permission, signal) : api.resolve(change.report.id, change.resolution, String(data.get('note') || ''), signal), t('success'), () => { setChange(null)
    list.reload() }) }
  return <><div className="page-heading"><div><p className="eyebrow">{t('englishAdmin')}</p><h1>{t(mode)}</h1><p>{t(mode === 'users' ? 'usersSubtitle' : mode === 'reports' ? 'reportsSubtitle' : 'auditSubtitle')}</p></div><Badge>{permissionLabel(auth.account!.permission)}</Badge></div>{mode === 'reports' && <form className="panel moderation-toolbar" onSubmit={event => { event.preventDefault()
    const data = new FormData(event.currentTarget)
    setChange({ kind: 'texture', id: String(data.get('texture')), state: Number(data.get('state')) }) }}><Field label={t('textureId')} hint={t('moderationHint')}><input name="texture" defaultValue={params.get('texture') || ''} pattern="[a-fA-F0-9]{32}" required /></Field><Field label={t('state')}><select name="state"><option value={0}>{t('publish')}</option><option value={1}>{t('unpublish')}</option></select></Field><Button type="submit">{t('confirm')}</Button></form>}{list.loading ? <Skeleton /> : list.error ? <ErrorState message={list.error} retry={list.reload} /> : !list.value?.items.length ? <EmptyState title={t(mode === 'reports' ? 'noReports' : mode === 'audit' ? 'noAudit' : 'empty')} text="" /> : <div className="panel table-wrap"><table><thead><tr>{(mode === 'users' ? ['email', 'state', 'permission', 'createdAt', 'action'] : mode === 'reports' ? ['textureId', 'reportReason', 'state', 'createdAt', 'action'] : ['createdAt', 'action', 'actor', 'target', 'result', 'requestId']).map(key => <th key={key}>{t(key as 'email')}</th>)}</tr></thead><tbody>{list.value.items.map(row => {
    if (mode === 'users') { const user = row as Account
      const manageable = user.state !== 2 && user.permission !== 2 && user.id !== auth.account!.id && (auth.account!.permission === 2 || user.permission === 0)
      return <tr key={user.id}><td><strong>{user.email}</strong><small className="mono table-id">{user.id}</small></td><td><Badge tone={user.state ? 'danger' : ''}>{accountStateLabel(user.state)}</Badge></td><td>{permissionLabel(user.permission)}</td><td>{date(user.createdAt)}</td><td>{manageable ? <div className="inline"><Button onClick={() => setChange({ kind: 'user', user, state: user.state ? 0 : 1, permission: user.permission })}>{t(user.state ? 'unban' : 'ban')}</Button>{auth.account!.permission === 2 && <Button onClick={() => setChange({ kind: 'user', user, state: user.state, permission: user.permission ? 0 : 1 })}>{t(user.permission ? 'revokeAdmin' : 'grantAdmin')}</Button>}</div> : <small>{t('noPermissionChanges')}</small>}</td></tr> }
    if (mode === 'reports') { const report = row as Report
      return <tr key={report.id}><td><a className="mono" href={`#/texture/${report.texture}`}>{report.texture.slice(0, 12)}…</a></td><td className="reason-cell">{report.reason}{report.note && <small>{report.note}</small>}</td><td><Badge tone={report.state ? '' : 'gold'}>{reportStateLabel(report.state)}</Badge></td><td>{date(report.createdAt)}</td><td>{report.state === 0 && <div className="inline"><Button variant="danger" onClick={() => setChange({ kind: 'report', report, resolution: 1 })}>{t('resolve')}</Button><Button onClick={() => setChange({ kind: 'report', report, resolution: 2 })}>{t('reject')}</Button></div>}</td></tr> }
    const event = row as Audit
      return <tr key={event.id}><td>{date(event.createdAt)}</td><td>{actionLabel(event.action)}</td><td className="mono">{event.actor.slice(0, 12)}…</td><td className="mono">{event.target.slice(0, 12)}…<small className="table-id">{t('auditDetails', { state: event.targetState, permission: event.targetPermission })}</small></td><td>{t(event.result ? 'dismissed' : 'applied')}</td><td className="mono">{event.requestId}</td></tr>
  })}</tbody></table></div>}{list.value && <Pagination offset={offset} limit={50} total={null} next={list.value.items.length === 50} onChange={offset => setQuery(`/admin/${mode}`, { offset: String(offset) })} />}
    {change && <Dialog title={t('confirm')} onClose={() => !action.busy && setChange(null)}><form className="stack" onSubmit={submit}><strong>{change.kind === 'texture' ? change.id : change.kind === 'user' ? change.user.email : change.report.texture}</strong><p>{t(change.kind === 'user' ? 'manageHint' : 'deleteConfirmText')}</p><Badge>{change.kind === 'texture' ? t(change.state === 0 ? 'publish' : 'unpublish') : change.kind === 'user' ? `${accountStateLabel(change.state)} / ${permissionLabel(change.permission)}` : t(change.resolution === 1 ? 'resolve' : 'reject')}</Badge>{change.kind === 'report' && <Field label={t('moderatorNote')}><textarea name="note" maxLength={1000} /></Field>}{action.error && <p className="field-error" role="alert">{action.error}</p>}<div className="dialog-actions"><Button type="button" onClick={() => setChange(null)} disabled={action.busy}>{t('cancel')}</Button><Button type="submit" variant="primary" busy={action.busy}>{t('confirm')}</Button></div></form></Dialog>}</>
}
