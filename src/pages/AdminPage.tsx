import { useState } from 'react'
import { errorMessage } from '../api/client'
import {
  ACCOUNT_STATE,
  PERMISSION,
  REPORT_RESOLUTION,
  TEXTURE_STATE,
  accountStateLabel,
  accountStateTone,
  auditActionLabel,
  auditResultLabel,
  auditResultTone,
  permissionLabel,
  permissionTone,
  reportStateLabel,
  reportStateTone,
} from '../api/enums'
import {
  ADMIN_PAGE_SIZE,
  fetchAudit,
  fetchReports,
  fetchUsers,
  resolveReport,
  updateUser,
} from '../api/resources'
import type { Account, Report } from '../api/types'
import { AdminSitePanel } from './AdminSitePanel'
import { useAuth } from '../components/AuthProvider'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Notice,
  Tabs,
  useToast,
} from '../components/UI'
import { t } from '../i18n/zh-CN'
import { formatDate, formatDateTime, shortId } from '../lib/format'
import { href, navigate, type AdminTab } from '../lib/router'
import { useAsync, useSubmit } from '../lib/useAsync'

export function AdminPage({ tab }: { tab: AdminTab }) {
  const auth = useAuth()
  const tabs = [
    { value: 'users' as const, label: t('admin.tab.users') },
    { value: 'reports' as const, label: t('admin.tab.reports') },
    { value: 'audit' as const, label: t('admin.tab.audit') },
    ...(auth.isOwner ? [{ value: 'site' as const, label: t('admin.tab.site') }] : []),
  ]

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t('admin.title')}</h1>
            <p className="page__sub">{t('admin.sub')}</p>
          </div>
        </div>
        <Tabs
          label={t('admin.title')}
          value={tab}
          onChange={(value) => navigate(`/admin/${value}`, { replace: true })}
          tabs={tabs}
        />
        {tab === 'users' ? (
          <UsersPanel />
        ) : tab === 'reports' ? (
          <ReportsPanel />
        ) : tab === 'audit' ? (
          <AuditPanel />
        ) : (
          <AdminSitePanel />
        )}
      </div>
    </div>
  )
}

function AdminPager({
  offset,
  count,
  onChange,
}: {
  offset: number
  count: number
  onChange: (offset: number) => void
}) {
  return (
    <div className="pager">
      <button
        type="button"
        className="pager__btn"
        disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - ADMIN_PAGE_SIZE))}
      >
        {t('common.prev')}
      </button>
      <span className="pager__info">{Math.floor(offset / ADMIN_PAGE_SIZE) + 1}</span>
      <button
        type="button"
        className="pager__btn"
        disabled={count < ADMIN_PAGE_SIZE}
        onClick={() => onChange(offset + ADMIN_PAGE_SIZE)}
      >
        {t('common.next')}
      </button>
    </div>
  )
}

function UsersPanel() {
  const auth = useAuth()
  const { notify } = useToast()
  const [offset, setOffset] = useState(0)
  const [pending, setPending] = useState<string | null>(null)
  const list = useAsync((signal) => fetchUsers(offset, signal), [offset])

  async function patch(user: Account, input: { state: 0 | 1; permission: 0 | 1 }): Promise<void> {
    setPending(user.id)
    try {
      await updateUser(user.id, input)
      notify('ok', t('admin.users.updated'))
      list.reload()
    } catch (error) {
      notify('error', errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  const items = list.data ?? []

  return (
    <div className="stack">
      {!auth.isOwner ? <Notice tone="warn">{t('admin.users.ownerOnly')}</Notice> : null}
      {list.loading ? (
        <EmptyState title={t('common.loading')} />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyState title={t('admin.empty')} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.users.email')}</th>
                  <th>{t('admin.users.state')}</th>
                  <th>{t('admin.users.permission')}</th>
                  <th>{t('admin.users.created')}</th>
                  <th>{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const isSelf = user.id === auth.account?.id
                  const manageable =
                    !isSelf &&
                    user.state !== ACCOUNT_STATE.DELETED &&
                    user.permission < PERMISSION.OWNER &&
                    (auth.isOwner || user.permission === PERMISSION.USER)
                  const banned = user.state === ACCOUNT_STATE.BANNED
                  return (
                    <tr key={user.id}>
                      <td>
                        <div>{user.email}</div>
                        <div className="mono dim">{shortId(user.id, 12)}</div>
                      </td>
                      <td>
                        <Badge tone={accountStateTone(user.state)}>
                          {accountStateLabel(user.state)}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={permissionTone(user.permission)}>
                          {permissionLabel(user.permission)}
                        </Badge>
                      </td>
                      <td className="small">{formatDate(user.createdAt)}</td>
                      <td className="table__actions">
                        {isSelf ? (
                          <span className="small dim">{t('admin.users.self')}</span>
                        ) : manageable ? (
                          <>
                            <Button
                              size="sm"
                              variant={banned ? 'primary' : 'danger'}
                              disabled={pending === user.id}
                              onClick={() =>
                                void patch(user, {
                                  state: banned ? 0 : 1,
                                  permission: user.permission === PERMISSION.ADMIN ? 1 : 0,
                                })
                              }
                            >
                              {banned ? t('admin.users.unban') : t('admin.users.ban')}
                            </Button>
                            {auth.isOwner && user.state !== ACCOUNT_STATE.BANNED ? (
                              <Button
                                size="sm"
                                disabled={pending === user.id}
                                onClick={() =>
                                  void patch(user, {
                                    state: 0,
                                    permission: user.permission === PERMISSION.ADMIN ? 0 : 1,
                                  })
                                }
                              >
                                {user.permission === PERMISSION.ADMIN
                                  ? t('admin.users.revoke')
                                  : t('admin.users.grant')}
                              </Button>
                            ) : null}
                          </>
                        ) : (
                          <span className="small dim">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <AdminPager offset={offset} count={items.length} onChange={setOffset} />
        </>
      )}
    </div>
  )
}

function ReportsPanel() {
  const [offset, setOffset] = useState(0)
  const [decision, setDecision] = useState<{ report: Report; resolution: 1 | 2 } | null>(null)
  const list = useAsync((signal) => fetchReports(offset, signal), [offset])
  const { notify } = useToast()
  const items = list.data ?? []

  function done(): void {
    setDecision(null)
    notify('ok', t('admin.reports.handled'))
    list.reload()
  }

  return (
    <div className="stack">
      {list.loading ? (
        <EmptyState title={t('common.loading')} />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyState title={t('admin.empty')} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.reports.texture')}</th>
                  <th>{t('admin.reports.reason')}</th>
                  <th>{t('admin.reports.state')}</th>
                  <th>{t('admin.reports.reporter')}</th>
                  <th>{t('admin.reports.created')}</th>
                  <th>{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <a href={href(`/texture/${report.texture}`)} className="mono">
                        {shortId(report.texture, 12)}
                      </a>
                    </td>
                    <td style={{ minWidth: 200 }} title={report.reason}>
                      {report.reason.length > 80 ? `${report.reason.slice(0, 80)}…` : report.reason}
                      {report.note ? <div className="small dim">{report.note}</div> : null}
                    </td>
                    <td>
                      <Badge tone={reportStateTone(report.state)}>
                        {reportStateLabel(report.state)}
                      </Badge>
                    </td>
                    <td className="mono dim">{shortId(report.reporter, 8)}</td>
                    <td className="small">{formatDateTime(report.createdAt)}</td>
                    <td className="table__actions">
                      {report.state === 0 ? (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDecision({ report, resolution: REPORT_RESOLUTION.HIDE })}
                          >
                            {t('admin.reports.resolve')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setDecision({ report, resolution: REPORT_RESOLUTION.REJECT })}
                          >
                            {t('admin.reports.reject')}
                          </Button>
                        </>
                      ) : (
                        <span className="small dim">{formatDate(report.handledAt)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPager offset={offset} count={items.length} onChange={setOffset} />
        </>
      )}

      {decision ? (
        <ReportDecisionDialog
          report={decision.report}
          resolution={decision.resolution}
          onClose={() => setDecision(null)}
          onDone={done}
        />
      ) : null}
    </div>
  )
}

function ReportDecisionDialog({
  report,
  resolution,
  onClose,
  onDone,
}: {
  report: Report
  resolution: 1 | 2
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState('')
  const submit = useSubmit()
  const hide = resolution === REPORT_RESOLUTION.HIDE

  return (
    <Dialog
      open
      title={hide ? t('admin.reports.resolveTitle') : t('admin.reports.rejectTitle')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant={hide ? 'danger' : 'primary'}
            disabled={submit.busy}
            onClick={() =>
              void submit.run(async () => {
                await resolveReport(
                  report.id,
                  hide
                    ? { resolution: REPORT_RESOLUTION.HIDE, state: TEXTURE_STATE.HIDDEN, note }
                    : { resolution: REPORT_RESOLUTION.REJECT, note },
                )
                onDone()
              })
            }
          >
            {submit.busy
              ? t('common.submitting')
              : hide
                ? t('admin.reports.resolve')
                : t('admin.reports.reject')}
          </Button>
        </>
      }
    >
      <p className="muted">
        {t('admin.reports.texture')}：<span className="mono">{report.texture}</span>
      </p>
      <p>{report.reason}</p>
      <Field label={t('admin.reports.note')} htmlFor="report-decision-note" hint={t('admin.reports.noteHint')}>
        <textarea
          id="report-decision-note"
          className="textarea"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}

function AuditPanel() {
  const [offset, setOffset] = useState(0)
  const list = useAsync((signal) => fetchAudit(offset, signal), [offset])
  const items = list.data ?? []

  if (list.loading) return <EmptyState title={t('common.loading')} />
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />
  if (items.length === 0) return <EmptyState title={t('admin.empty')} />

  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.audit.created')}</th>
              <th>{t('admin.audit.action')}</th>
              <th>{t('admin.audit.result')}</th>
              <th>{t('admin.audit.actor')}</th>
              <th>{t('admin.audit.target')}</th>
              <th>{t('admin.audit.state')}</th>
              <th>{t('admin.audit.requestId')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((event) => (
              <tr key={event.id}>
                <td className="small">{formatDateTime(event.createdAt)}</td>
                <td>{auditActionLabel(event.action)}</td>
                <td>
                  <Badge tone={auditResultTone(event.result)}>{auditResultLabel(event.result)}</Badge>
                </td>
                <td className="mono dim">{event.actor ? shortId(event.actor, 8) : '—'}</td>
                <td className="mono dim">{event.target ? shortId(event.target, 8) : '—'}</td>
                <td className="small">
                  {event.targetState} / {event.targetPermission}
                </td>
                <td className="mono dim">{event.requestId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager offset={offset} count={items.length} onChange={setOffset} />
    </div>
  )
}
