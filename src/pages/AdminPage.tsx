import { useEffect, useState, type FormEvent } from 'react'
import { listAudit, listReports, listUsers, resolveReport } from '../api/admin'
import type { Account, AuditEvent, Report } from '../api/types'
import { Button, Dialog, EmptyState, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import { ReportsView } from './ReportsView'
import { UsersTable } from './UsersTable'
import { errorMessage } from '../api/client'
import { AdminEditor } from './AdminEditor'
import { AuditTable } from './AuditTable'
import { TextureImage } from '../components/TextureImage'
import { TextureModeration } from './TextureModeration'
import styles from './Admin.module.css'

type Section = 'users' | 'reports' | 'audit'
const pageSize = 50

export function AdminPage({ section, account }: { section: Section; account: Account }) {
  return <AdminSection key={section} section={section} account={account} />
}

function AdminSection({ section, account }: { section: Section; account: Account }) {
  const [users, setUsers] = useState<Account[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [offset, setOffset] = useState(0)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<Account | null>(null)
  const [selected, setSelected] = useState<Report | null>(null)
  const [processing, setProcessing] = useState<Report | null>(null)
  const [note, setNote] = useState('')
  const [resolution, setResolution] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setBusy(true)
    setError('')
    async function load() {
      try {
        if (section === 'users') {
          const data = await listUsers(offset, controller.signal)
          if (!controller.signal.aborted) setUsers(data)
        } else if (section === 'reports') {
          const data = await listReports(offset, controller.signal)
          if (!controller.signal.aborted) setReports(data)
        } else {
          const data = await listAudit(offset, controller.signal)
          if (!controller.signal.aborted) setEvents(data)
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(errorMessage(error))
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }
    void load()
    return () => {
      controller.abort()
    }
  }, [section, offset, version])

  function saved() {
    setMessage(t('admin.saved'))
    setEditing(null)
    setProcessing(null)
    setVersion((value) => value + 1)
  }
  function openReport(report: Report) {
    setProcessing(report)
    setNote('')
    setResolution(1)
    setSaveError('')
  }
  async function processReport(event: FormEvent) {
    event.preventDefault()
    if (!processing) return
    setSaving(true)
    setSaveError('')
    try {
      await resolveReport(
        processing.id,
        resolution === 1 ? { resolution: 1, state: 1, note } : { resolution: 2, note },
      )
      saved()
    } catch (error) {
      setSaveError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }
  const count =
    section === 'users' ? users.length : section === 'reports' ? reports.length : events.length
  const footer = (
    <div className={styles.footer}>
      <nav className={styles.actions} aria-label={t('common.pagination')}>
        <Button
          variant="secondary"
          disabled={offset === 0}
          onClick={() => setOffset((value) => Math.max(0, value - pageSize))}
        >
          {t('common.previous')}
        </Button>
        <span className={styles.pageNumber} aria-current="page">
          {t('admin.page', { page: Math.floor(offset / pageSize) + 1 })}
        </span>
        <Button
          variant="secondary"
          disabled={count < pageSize}
          onClick={() => setOffset((value) => value + pageSize)}
        >
          {t('common.next')}
        </Button>
      </nav>
    </div>
  )
  const empty = <EmptyState title={t('admin.empty')} description={t('admin.emptyHelp')} />

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>{t(`admin.${section}`)}</h1>
        <small>{t('admin.pageNote')}</small>
      </div>
      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <div className={section === 'reports' ? styles.reportLayout : undefined}>
        <section className={styles.card} aria-busy={busy}>
          <header className={styles.cardHeader}>
            <h2>{t(`admin.${section}`)}</h2>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setVersion((value) => value + 1)}
            >
              {t('admin.refresh')}
            </Button>
          </header>
          {busy ? (
            <div className={styles.body} role="status">
              {t('admin.loading')}
            </div>
          ) : error ? (
            <div className={styles.body}>{empty}</div>
          ) : count === 0 ? (
            empty
          ) : (
            <>
              {section === 'users' && (
                <UsersTable users={users} account={account} onEdit={setEditing} />
              )}
              {section === 'audit' && (
                <>
                  <div className={styles.body}>
                    <span className={styles.muted}>{t('admin.readOnly')}</span>
                  </div>
                  <AuditTable events={events} />
                </>
              )}
              {section === 'reports' && (
                <ReportsView
                  reports={reports}
                  selected={selected}
                  onSelect={setSelected}
                  onProcess={openReport}
                />
              )}
            </>
          )}
          {!busy && !error && footer}
        </section>
        {section === 'reports' && (
          <aside className={styles.card}>
            <header className={styles.cardHeader}>
              <h2>{t('admin.preview')}</h2>
            </header>
            {selected ? (
              <>
                <div className={styles.preview}>
                  <TextureImage
                    key={`${selected.texture}-${version}`}
                    id={selected.texture}
                    name={t('admin.preview')}
                    size={256}
                  />
                </div>
                <div className={styles.body}>
                  <p className={styles.mono}>{selected.texture}</p>
                  <TextureModeration
                    key={selected.texture}
                    textureId={selected.texture}
                    onChanged={saved}
                  />
                </div>
              </>
            ) : (
              <EmptyState title={t('admin.previewHelp')} />
            )}
          </aside>
        )}
      </div>
      {editing && (
        <AdminEditor
          key={editing.id}
          target={editing}
          account={account}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      <Dialog
        open={processing !== null}
        title={t('admin.handleReport')}
        onClose={() => {
          if (!saving) setProcessing(null)
        }}
      >
        <form onSubmit={processReport}>
          <p className={styles.summary}>{processing?.reason}</p>
          {saveError && <Notice tone="error">{saveError}</Notice>}
          <Field label={t('admin.actions')}>
            <select
              value={resolution}
              disabled={saving}
              onChange={(event) => setResolution(Number(event.target.value) as 1 | 2)}
            >
              <option value={1}>{t('admin.hideAndResolve')}</option>
              <option value={2}>{t('admin.reject')}</option>
            </select>
          </Field>
          {resolution === 1 && <Notice>{t('admin.reportWarning')}</Notice>}
          <Field label={t('admin.note')} help={t('admin.noteHelp')}>
            <textarea
              rows={3}
              maxLength={1000}
              value={note}
              disabled={saving}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setProcessing(null)}
            >
              {t('admin.cancel')}
            </Button>
            <Button
              type="submit"
              variant={resolution === 1 ? 'danger' : 'primary'}
              disabled={saving}
            >
              {t(saving ? 'admin.saving' : 'admin.confirm')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
