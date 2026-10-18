import { useState } from 'react'
import { ApiError } from '../api/client'
import { adminApi, textureApi } from '../api/resources'
import { AccountState, Permission, ReportState } from '../api/enums'
import { useAuth } from '../lib/auth'
import { Link } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { formatDateTime, shortHash } from '../lib/format'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureImage } from '../components/TextureImage'
import { Badge, Button, Dialog, EmptyState, ErrorState, Field, Skeleton, Tabs, Textarea, useToast } from '../components/ui'

const PAGE = 50

type AdminTab = 'users' | 'reports' | 'audit'

export function AdminPage({ initialTab }: { initialTab: AdminTab }) {
  const { isAdmin, status } = useAuth()
  const [tab, setTab] = useState<AdminTab>(initialTab)

  if (status !== 'authenticated') {
    return (
      <>
        <PageHeader title={t('admin.title')} />
        <div className="notice">
          {t('upload.needLogin')} <Link to={`/login?next=${encodeURIComponent('/admin')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader title={t('admin.title')} />
        <ErrorState message={t('admin.noPermission')} />
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('admin.title')} />
      <Tabs
        label={t('admin.title')}
        items={[
          { value: 'users', label: t('admin.users') },
          { value: 'reports', label: t('admin.reports') },
          { value: 'audit', label: t('admin.audit') },
        ]}
        value={tab}
        onChange={(value) => setTab(value as AdminTab)}
      />
      {tab === 'users' ? <UsersPanel /> : null}
      {tab === 'reports' ? <ReportsPanel /> : null}
      {tab === 'audit' ? <AuditPanel /> : null}
    </>
  )
}

function UsersPanel() {
  const toast = useToast()
  const [offset, setOffset] = useState(0)
  const [busyId, setBusyId] = useState('')
  const users = useAsync((signal) => adminApi.users(offset, signal), [offset])

  const update = async (id: string, body: { state: number; permission: number }, message: string) => {
    setBusyId(id)
    try {
      await adminApi.updateUser(id, body)
      toast.push(message, 'success')
      users.reload()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section>
      {users.loading ? <Skeleton height={160} /> : null}
      {users.error ? <ErrorState message={t('common.errorGeneric')} onRetry={users.reload} /> : null}
      {!users.loading && !users.error && users.data ? (
        users.data.length === 0 ? (
          <EmptyState title={t('admin.userList')} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.email')}</th>
                    <th>{t('profile.accountId')}</th>
                    <th>{t('admin.state')}</th>
                    <th>{t('admin.permission')}</th>
                    <th>{t('admin.createdAt')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => {
                    const isOwner = user.permission === Permission.Owner
                    return (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td className="mono-hash">{shortHash(user.id)}</td>
                        <td>
                          <Badge tone={user.state === AccountState.Active ? 'success' : 'danger'}>
                            {user.state === AccountState.Active ? t('common.stateActive') : t('common.stateBanned')}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={user.permission >= 1 ? 'accent' : 'default'}>
                            {user.permission === Permission.Owner
                              ? t('common.permissionOwner')
                              : user.permission === Permission.Admin
                                ? t('common.permissionAdmin')
                                : t('common.permissionUser')}
                          </Badge>
                        </td>
                        <td className="nowrap">{formatDateTime(user.createdAt)}</td>
                        <td>
                          {isOwner ? (
                            <span className="muted">—</span>
                          ) : (
                            <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              <Button
                                size="sm"
                                loading={busyId === user.id}
                                onClick={() =>
                                  update(
                                    user.id,
                                    {
                                      state: user.state === AccountState.Active ? AccountState.Banned : AccountState.Active,
                                      permission: user.permission,
                                    },
                                    user.state === AccountState.Active ? t('admin.banSuccess') : t('admin.unbanSuccess'),
                                  )
                                }
                              >
                                {user.state === AccountState.Active ? t('admin.ban') : t('admin.unban')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  update(
                                    user.id,
                                    {
                                      state: user.state,
                                      permission: user.permission === Permission.Admin ? Permission.User : Permission.Admin,
                                    },
                                    user.permission === Permission.Admin ? t('admin.revokeSuccess') : t('admin.grantSuccess'),
                                  )
                                }
                              >
                                {user.permission === Permission.Admin ? t('admin.revokeAdmin') : t('admin.grantAdmin')}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t('common.previous')}
              </Button>
              <span className="pagination__status">{t('common.page', { page: Math.floor(offset / PAGE) + 1 })}</span>
              <Button size="sm" disabled={(users.data?.length ?? 0) < PAGE} onClick={() => setOffset(offset + PAGE)}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )
      ) : null}
    </section>
  )
}

function ReportsPanel() {
  const toast = useToast()
  const [offset, setOffset] = useState(0)
  const reports = useAsync((signal) => adminApi.reports(offset, signal), [offset])
  const [target, setTarget] = useState<{ id: string; texture: string; mode: 'takeDown' | 'reject' } | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!target) return
    setBusy(true)
    try {
      if (target.mode === 'takeDown') {
        await adminApi.resolveReport(target.id, { resolution: ReportState.Resolved, state: 1, note })
        toast.push(t('admin.handled'), 'success')
      } else {
        await adminApi.resolveReport(target.id, { resolution: ReportState.Rejected, note })
        toast.push(t('admin.rejected'), 'success')
      }
      reports.reload()
      setTarget(null)
      setNote('')
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const stateLabel = (state: number) =>
    state === ReportState.Pending
      ? t('admin.statePending')
      : state === ReportState.Resolved
        ? t('admin.stateResolved')
        : t('admin.stateRejected')

  return (
    <section>
      {reports.loading ? <Skeleton height={160} /> : null}
      {reports.error ? <ErrorState message={t('common.errorGeneric')} onRetry={reports.reload} /> : null}
      {!reports.loading && !reports.error && reports.data ? (
        reports.data.length === 0 ? (
          <EmptyState title={t('admin.reportList')} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>材质</th>
                    <th>{t('admin.reason')}</th>
                    <th>{t('admin.state')}</th>
                    <th>{t('admin.time')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.data.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className="row" style={{ gap: 'var(--space-2)' }}>
                          <TextureImage
                            src={textureApi.avatarUrl(report.texture, 64)}
                            alt={report.texture}
                            width={40}
                            height={40}
                            checker={false}
                          />
                          <Link to={`/texture/${report.texture}`} className="mono-hash">
                            {shortHash(report.texture)}
                          </Link>
                        </div>
                      </td>
                      <td style={{ maxWidth: 320 }}>{report.reason}</td>
                      <td>
                        <Badge
                          tone={
                            report.state === ReportState.Pending
                              ? 'warning'
                              : report.state === ReportState.Resolved
                                ? 'success'
                                : 'default'
                          }
                        >
                          {stateLabel(report.state)}
                        </Badge>
                      </td>
                      <td className="nowrap">{formatDateTime(report.createdAt)}</td>
                      <td>
                        {report.state === ReportState.Pending ? (
                          <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setTarget({ id: report.id, texture: report.texture, mode: 'takeDown' })
                                setNote('')
                              }}
                            >
                              {t('admin.takeDown')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setTarget({ id: report.id, texture: report.texture, mode: 'reject' })
                                setNote('')
                              }}
                            >
                              {t('admin.reject')}
                            </Button>
                          </div>
                        ) : (
                          <span className="muted">{report.note || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t('common.previous')}
              </Button>
              <Button
                size="sm"
                disabled={(reports.data?.length ?? 0) < PAGE}
                onClick={() => setOffset(offset + PAGE)}
              >
                {t('common.next')}
              </Button>
            </div>
          </>
        )
      ) : null}

      <Dialog
        open={target !== null}
        title={target?.mode === 'takeDown' ? t('admin.takeDown') : t('admin.reject')}
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button onClick={() => setTarget(null)}>{t('common.cancel')}</Button>
            <Button variant={target?.mode === 'takeDown' ? 'danger' : 'primary'} loading={busy} onClick={() => void submit()}>
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <Field label={t('admin.noteLabel')} htmlFor="report-note">
          <Textarea id="report-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} />
        </Field>
      </Dialog>
    </section>
  )
}

function AuditPanel() {
  const [offset, setOffset] = useState(0)
  const events = useAsync((signal) => adminApi.audit(offset, signal), [offset])

  const actionLabel = (action: number) => {
    switch (action) {
      case 0:
        return t('admin.actionUser')
      case 1:
        return t('admin.actionOwner')
      case 2:
        return t('admin.actionTexture')
      case 3:
        return t('admin.actionReport')
      default:
        return String(action)
    }
  }

  const resultLabel = (result: number) =>
    result === 0 ? t('admin.resultApplied') : result === 1 ? t('admin.resultDismissed') : t('admin.resultUnchanged')

  return (
    <section>
      {events.loading ? <Skeleton height={160} /> : null}
      {events.error ? <ErrorState message={t('common.errorGeneric')} onRetry={events.reload} /> : null}
      {!events.loading && !events.error && events.data ? (
        events.data.length === 0 ? (
          <EmptyState title={t('admin.auditEmpty')} />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.action')}</th>
                    <th>{t('admin.result')}</th>
                    <th>{t('admin.actor')}</th>
                    <th>{t('admin.target')}</th>
                    <th>{t('admin.time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {events.data.map((event) => (
                    <tr key={event.id}>
                      <td>{actionLabel(event.action)}</td>
                      <td>{resultLabel(event.result)}</td>
                      <td className="mono-hash">{shortHash(event.actor || 'cli')}</td>
                      <td className="mono-hash">{shortHash(event.target)}</td>
                      <td className="nowrap">{formatDateTime(event.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t('common.previous')}
              </Button>
              <Button size="sm" disabled={(events.data?.length ?? 0) < PAGE} onClick={() => setOffset(offset + PAGE)}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )
      ) : null}
    </section>
  )
}
