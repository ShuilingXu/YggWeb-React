import { useEffect, useState, type FormEvent } from 'react'
import * as api from '../api/provision'
import type { Source, ImportRun, RunKey } from '../api/provision'
import { ApiError, errorMessage } from '../api/client'
import { Button, Field, Notice } from '../components/UI'
import { useResource } from '../lib/useResource'
import { parseBSEnv } from '../lib/bs-env'
import { t } from '../i18n/zh-CN'
import { formatDate } from '../lib/format'
import styles from './Operations.module.css'

export function SetupPage({
  available,
  onComplete,
}: {
  available: boolean
  onComplete: () => void
}) {
  const [code, setCode] = useState(''),
    [verified, setVerified] = useState(false),
    [path, setPath] = useState('choose')
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (!verified) {
        await api.verifySetup(code)
        setVerified(true)
      } else {
        await api.createSite({
          code,
          name: String(form.get('name')),
          email: String(form.get('email')),
          password: String(form.get('password')),
          player: String(form.get('player')),
        })
        setCode('')
        onComplete()
      }
    } catch (cause) {
      setError(
        !verified && cause instanceof ApiError && cause.status === 403
          ? t('setup.badCode')
          : errorMessage(cause),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack">
      <header>
        <h1>{t('setup.title')}</h1>
        <p>{t('setup.intro')}</p>
      </header>
      {error && <Notice tone="error">{error}</Notice>}
      {!available ? (
        <Notice tone="error">{t('setup.unavailable')}</Notice>
      ) : !verified ? (
        <form className="panel stack" onSubmit={submit}>
          <Field label={t('setup.code')} help={t('setup.codeHelp')}>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="off"
              maxLength={128}
            />
          </Field>
          <Button disabled={busy}>{t('setup.verify')}</Button>
        </form>
      ) : path === 'choose' ? (
        <div className={styles.fields}>
          <section className="panel stack">
            <h2>{t('setup.new')}</h2>
            <p>{t('setup.newHelp')}</p>
            <Button onClick={() => setPath('new')}>{t('setup.new')}</Button>
          </section>
          <section className="panel stack">
            <h2>{t('import.title')}</h2>
            <p>{t('import.intro')}</p>
            <Button onClick={() => setPath('import')}>{t('import.title')}</Button>
          </section>
        </div>
      ) : path === 'new' ? (
        <form className="panel stack" onSubmit={submit}>
          <h2>{t('setup.new')}</h2>
          <Field label={t('ops.name')}>
            <input name="name" required maxLength={100} />
          </Field>
          <Field label={t('setup.origin')} help={t('setup.originHelp')}>
            <input value={location.origin} readOnly />
          </Field>
          <Field label={t('setup.email')}>
            <input name="email" type="email" required maxLength={255} autoComplete="email" />
          </Field>
          <Field label={t('setup.player')}>
            <input name="player" required pattern="[A-Za-z0-9_]{3,16}" maxLength={16} />
          </Field>
          <Field label={t('setup.password')}>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
          </Field>
          <Button disabled={busy}>{t('setup.create')}</Button>
          <Button type="button" variant="secondary" onClick={() => setPath('choose')}>
            {t('setup.changePath')}
          </Button>
        </form>
      ) : (
        <>
          <ImportWizard
            entry="setup"
            code={code}
            onComplete={() => {
              setCode('')
              onComplete()
            }}
          />
          <Button variant="secondary" onClick={() => setPath('choose')}>
            {t('setup.changePath')}
          </Button>
        </>
      )}
    </div>
  )
}

const initial: Source = {
  driver: 'mysql',
  dsn: '',
  prefix: '',
  texturesDir: '',
  timeZone: 'Asia/Shanghai',
  passwordMethod: 'BCRYPT',
  uuidOverrides: {},
  importSettings: false,
}
const states = ['import.running', 'import.success', 'import.failed', 'import.canceled'] as const
function RunReport({ run }: { run: ImportRun }) {
  const text = JSON.stringify(run, null, 2)
  function download() {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' }),
      url = URL.createObjectURL(blob),
      link = document.createElement('a')
    link.href = url
    link.download = `bs-import-${run.id}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <section className="panel stack">
      <h2>{t(run.dryRun ? 'import.previewReport' : 'import.report')}</h2>
      <p role="status">
        {t(states[run.state])} · {t('import.stage.' + run.stage)} · {run.processed}
      </p>
      <p>
        {t('import.blocking')}: {run.report.blocking}
      </p>
      <dl>
        {Object.entries(run.report.counts).map(([table, count]) => (
          <div key={table}>
            <dt>{table}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      {run.report.issues.length > 0 && (
        <div className={styles.result}>
          <table>
            <thead>
              <tr>
                <th>{t('import.table')}</th>
                <th>ID</th>
                <th>{t('import.issue')}</th>
              </tr>
            </thead>
            <tbody>
              {run.report.issues.map((issue, i) => (
                <tr key={i}>
                  <td>{issue.table}</td>
                  <td>{issue.id || '—'}</td>
                  <td>{t('import.issue.' + issue.code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details>
        <summary>{t('import.uuidMap')}</summary>
        <pre className={styles.result}>{JSON.stringify(run.report.players, null, 2)}</pre>
      </details>
      <details>
        <summary>{t('import.omitted')}</summary>
        <pre className={styles.result}>{run.report.omitted.join('\n')}</pre>
      </details>
      <Button type="button" variant="secondary" onClick={download}>
        {t('import.download')}
      </Button>
    </section>
  )
}
export function ImportWizard({
  entry,
  code = '',
  onComplete,
}: {
  entry: 'setup' | 'admin'
  code?: string
  onComplete?: () => void
}) {
  const [source, setSource] = useState(initial),
    [env, setEnv] = useState(''),
    [overrides, setOverrides] = useState('{}')
  const [key, setKey] = useState<RunKey>(),
    [run, setRun] = useState<ImportRun>(),
    [preview, setPreview] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [pollVersion, setPollVersion] = useState(0)
  const running = !!key && (!run || run.state === 0)
  function change(patch: Partial<Source>) {
    setSource({ ...source, ...patch })
    setPreview('')
    setConfirmed(false)
  }
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let canceled = false
    async function poll() {
      try {
        const next = await api.importStatus(key!, controller.signal)
        if (canceled) return
        setRun(next)
        setError('')
        if (next.state === 0) timer = setTimeout(() => void poll(), 1000)
        else if (next.dryRun && next.state === 1 && next.report.blocking === 0) setPreview(next.id)
        else if (!next.dryRun && next.state === 1) {
          setSource(initial)
          setConfirmed(false)
        }
      } catch (cause) {
        if (!canceled) setError(errorMessage(cause))
      }
    }
    void poll()
    return () => {
      canceled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [key, pollVersion])
  async function start(dry: boolean) {
    setError('')
    setBusy(true)
    try {
      const parsed: unknown = JSON.parse(overrides)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        Object.values(parsed).some((v) => typeof v !== 'string')
      )
        throw new Error('overrides')
      const nextSource = { ...source, uuidOverrides: parsed as Record<string, string> }
      const next = await api.startImport(entry, nextSource, dry, code, preview)
      setRun(undefined)
      setPreview('')
      setConfirmed(false)
      setKey(next)
    } catch (cause) {
      setError(
        cause instanceof SyntaxError || (cause instanceof Error && cause.message === 'overrides')
          ? t('import.invalidOverrides')
          : errorMessage(cause),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack">
      <header>
        <h1>{t('import.title')}</h1>
        <p>{t('import.intro')}</p>
      </header>
      <Notice>{t('import.boundary')}</Notice>
      {error && (
        <Notice tone="error">
          {error}
          {key && <Button onClick={() => setPollVersion((v) => v + 1)}>{t('common.retry')}</Button>}
        </Notice>
      )}
      <form
        className="panel stack"
        onSubmit={(e) => {
          e.preventDefault()
          void start(true)
        }}
      >
        <fieldset disabled={busy || running} className="stack">
          <legend>{t('import.connection')}</legend>
          <details>
            <summary>{t('import.parseEnv')}</summary>
            <Field label={t('import.env')}>
              <textarea
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                try {
                  change(parseBSEnv(env))
                  setEnv('')
                  setError('')
                } catch {
                  setError(t('import.invalidEnv'))
                }
              }}
            >
              {t('import.parseEnv')}
            </Button>
          </details>
          <Field label={t('import.driver')}>
            <select
              value={source.driver}
              onChange={(e) => change({ driver: e.target.value, dsn: '' })}
            >
              <option value="mysql">MySQL / MariaDB</option>
              <option value="postgres">PostgreSQL</option>
            </select>
          </Field>
          <Field
            label={t('import.dsn')}
            help={
              source.driver === 'mysql'
                ? 'user:password@tcp(host:3306)/database'
                : 'postgres://user:password@host:5432/database'
            }
          >
            <input
              type="password"
              required
              value={source.dsn}
              onChange={(e) => change({ dsn: e.target.value })}
              autoComplete="off"
            />
          </Field>
          <Field label={t('import.prefix')}>
            <input
              value={source.prefix}
              pattern="[A-Za-z0-9_]{0,48}"
              maxLength={48}
              onChange={(e) => change({ prefix: e.target.value })}
            />
          </Field>
          <Field label={t('import.texturesDir')} help={t('import.texturesHelp')}>
            <input
              required
              value={source.texturesDir}
              onChange={(e) => change({ texturesDir: e.target.value })}
            />
          </Field>
          <Field label={t('import.timeZone')}>
            <input
              required
              value={source.timeZone}
              onChange={(e) => change({ timeZone: e.target.value })}
            />
          </Field>
          <Field label={t('import.passwordMethod')} help={t('import.saltHelp')}>
            <select
              value={source.passwordMethod}
              onChange={(e) => change({ passwordMethod: e.target.value })}
            >
              {[
                'BCRYPT',
                'ARGON2I',
                'PHP_PASSWORD_HASH',
                'MD5',
                'SALTED2MD5',
                'SHA256',
                'SALTED2SHA256',
                'SHA512',
                'SALTED2SHA512',
              ].map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
          <Field label={t('import.overrides')} help={t('import.overridesHelp')}>
            <textarea
              value={overrides}
              onChange={(e) => {
                setOverrides(e.target.value)
                setPreview('')
                setConfirmed(false)
              }}
              spellCheck={false}
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={source.importSettings}
              onChange={(e) => change({ importSettings: e.target.checked })}
            />
            {t('import.settings')}
          </label>
          <Button disabled={busy || running}>{t('import.preview')}</Button>
        </fieldset>
      </form>
      {run && <RunReport run={run} />}
      {running && (
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            if (key) void api.cancelImport(key).catch((cause) => setError(errorMessage(cause)))
          }}
        >
          {t('import.cancel')}
        </Button>
      )}
      {preview && !running && (
        <section className="panel stack">
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {t('import.confirm')}
          </label>
          <Button disabled={!confirmed || busy} onClick={() => void start(false)}>
            {t('import.execute')}
          </Button>
        </section>
      )}
      {run?.state === 1 && !run.dryRun && (
        <Notice tone="success">
          {t('import.completed')}
          <Button onClick={onComplete ?? (() => (location.hash = '/auth/login'))}>
            {t('nav.login')}
          </Button>
        </Notice>
      )}
    </div>
  )
}
export function ImportAdmin() {
  const history = useResource(api.importHistory)
  return (
    <div className="stack">
      <ImportWizard entry="admin" />
      <section className="panel stack">
        <h2>{t('import.history')}</h2>
        <Button variant="secondary" onClick={history.reload}>
          {t('import.refresh')}
        </Button>
        {history.error && <Notice tone="error">{history.error}</Notice>}
        {history.value?.map((run) => (
          <details key={run.id}>
            <summary>
              {formatDate(run.createdAt)} · {t(states[run.state])}
            </summary>
            <RunReport run={run} />
          </details>
        ))}
      </section>
    </div>
  )
}
