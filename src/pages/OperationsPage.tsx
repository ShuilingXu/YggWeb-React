import { useEffect, useState, type FormEvent } from 'react'
import * as api from '../api/site'
import { ApiError, errorMessage } from '../api/client'
import { pointKindKeys } from '../api/enums'
import type { PluginInfo, SiteSettings } from '../api/types'
import { useResource } from '../lib/useResource'
import { formatDate } from '../lib/format'
import { Button, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Operations.module.css'

const groups: { title: string; fields: (keyof SiteSettings)[] }[] = [
  {
    title: 'ops.site',
    fields: [
      'name',
      'description',
      'announcement',
      'registration',
      'emailMode',
      'emailDomains',
      'skinDomains',
      'maxPlayers',
      'singleSession',
    ],
  },
  {
    title: 'ops.points',
    fields: [
      'signEnabled',
      'signHours',
      'signMin',
      'signMax',
      'initialPoints',
      'playerCost',
      'uploadCost',
      'privateUploadCost',
      'closetCost',
    ],
  },
  { title: 'ops.oauthClients', fields: ['oauthEnabled'] },
  {
    title: 'ops.externalBinding',
    fields: ['oidcEnabled', 'oidcIssuer', 'oidcClientId', 'oidcName'],
  },
]
const toggles = new Set([
  'registration',
  'singleSession',
  'signEnabled',
  'oauthEnabled',
  'oidcEnabled',
])
const textFields = new Set([
  'name',
  'description',
  'announcement',
  'emailDomains',
  'skinDomains',
  'oidcIssuer',
  'oidcClientId',
  'oidcName',
])

export function SiteAdmin({ site, onSaved }: { site: SiteSettings; onSaved: () => void }) {
  const clients = useResource(api.listClients)
  const [draft, setDraft] = useState<SiteSettings>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const value = draft ?? site
  async function perform(action: () => Promise<unknown>, success: () => void) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      success()
      setMessage(t('common.success'))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  function save(event: FormEvent) {
    event.preventDefault()
    if (value.signMax < value.signMin || value.privateUploadCost < value.uploadCost) {
      setError(t('ops.invalidRanges'))
      return
    }
    void perform(() => api.saveSite(value), onSaved)
  }
  return (
    <div className="stack">
      <div className="page-heading">
        <h1>{t('ops.site')}</h1>
      </div>
      <Notice>{t('ops.settingsHint')}</Notice>
      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <form className="stack" onSubmit={save}>
        {groups.map((group) => (
          <section className="panel stack" key={group.title}>
            <h2 className="panel-header">{t(group.title)}</h2>
            {group.title === 'ops.externalBinding' && (
              <>
                <p>{t('ops.oidcHint')}</p>
                <p>{t('ops.externalPassword')}</p>
              </>
            )}
            <div className={styles.fields}>
              {group.fields.map((key) => (
                <div
                  key={key}
                  className={key === 'announcement' || key === 'description' ? styles.wide : ''}
                >
                  <Field label={t('ops.' + key)}>
                    {toggles.has(key) || key === 'emailMode' ? (
                      <select
                        value={value[key]}
                        onChange={(e) => setDraft({ ...value, [key]: Number(e.target.value) })}
                      >
                        {(key === 'emailMode'
                          ? ['ops.unrestricted', 'ops.allow', 'ops.deny']
                          : ['ops.disabled', 'ops.enabled']
                        ).map((label, index) => (
                          <option key={index} value={index}>
                            {t(label)}
                          </option>
                        ))}
                      </select>
                    ) : key === 'announcement' || key === 'description' ? (
                      <textarea
                        value={value[key]}
                        maxLength={key === 'announcement' ? 4000 : 1000}
                        rows={3}
                        onChange={(e) => setDraft({ ...value, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        value={value[key]}
                        type={textFields.has(key) ? 'text' : 'number'}
                        required={!textFields.has(key) || key === 'name'}
                        min={key === 'maxPlayers' || key === 'signHours' ? 1 : 0}
                        max={
                          textFields.has(key)
                            ? undefined
                            : key === 'maxPlayers'
                              ? 100
                              : key === 'signHours'
                                ? 8760
                                : 1000000
                        }
                        step={1}
                        maxLength={key === 'name' || key === 'oidcName' ? 100 : 2000}
                        onChange={(e) =>
                          setDraft({
                            ...value,
                            [key]: textFields.has(key) ? e.target.value : Number(e.target.value),
                          })
                        }
                      />
                    )}
                  </Field>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div>
          <Button disabled={busy}>{t(busy ? 'common.working' : 'common.save')}</Button>
        </div>
      </form>
      <section className="panel stack">
        <h2 className="panel-header">{t('ops.oauthClients')}</h2>
        <p>{t('ops.oauthHint')}</p>
        {clients.loading && <p>{t('common.loading')}</p>}
        {clients.error && (
          <Notice tone="error">
            {clients.error}
            <Button variant="secondary" onClick={clients.reload}>
              {t('common.retry')}
            </Button>
          </Notice>
        )}
        {clients.value?.length === 0 && <p>{t('common.empty')}</p>}
        {clients.value?.map((client) => (
          <div className={`${styles.item} stack`} key={client.id}>
            <h3>{client.name}</h3>
            <p>
              {t('ops.clientId')}: <code>{client.id}</code>
            </p>
            <p>{client.redirectUri}</p>
            <div>
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => void perform(() => api.deleteClient(client.id), clients.reload)}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        ))}
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            void perform(
              () => api.createClient(String(data.get('name')), String(data.get('redirectUri'))),
              () => {
                form.reset()
                clients.reload()
              },
            )
          }}
        >
          <Field label={t('ops.clientName')}>
            <input name="name" maxLength={100} required />
          </Field>
          <Field label={t('ops.redirect')}>
            <input name="redirectUri" type="url" maxLength={2000} required />
          </Field>
          <div>
            <Button disabled={busy}>{t('ops.createClient')}</Button>
          </div>
        </form>
      </section>
      <PluginsPanel />
    </div>
  )
}

function PluginsPanel() {
  const plugins = useResource(api.listPlugins)
  return (
    <section className="panel stack">
      <h2 className="panel-header">{t('ops.plugins')}</h2>
      <p>{t('ops.pluginsHint')}</p>
      {plugins.loading && <p>{t('common.loading')}</p>}
      {plugins.error && (
        <Notice tone="error">
          {plugins.error}
          <Button variant="secondary" onClick={plugins.reload}>
            {t('common.retry')}
          </Button>
        </Notice>
      )}
      {plugins.value?.length === 0 && <p>{t('common.empty')}</p>}
      {plugins.value?.map((info) => (
        <PluginCard info={info} key={info.id} />
      ))}
    </section>
  )
}
function PluginCard({ info }: { info: PluginInfo }) {
  const [result, setResult] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  async function query(path: string) {
    setBusy(true)
    setError('')
    try {
      setResult(JSON.stringify(await api.queryPlugin(info.id, path), null, 2))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={`${styles.item} stack`}>
      <h3>
        {info.id} · {t(info.enabled ? 'ops.enabled' : 'ops.disabled')}
      </h3>
      <p>{info.description}</p>
      <p>
        {t('ops.version')}: {info.version} · {t('ops.apiVersion')}: {info.apiVersion}
      </p>
      <p>
        {t('ops.hooks')}: {info.actions.join(' · ')}
      </p>
      <p>
        {[info.before && t('ops.before'), info.after && t('ops.after')].filter(Boolean).join(' · ')}
      </p>
      {info.enabled === 1 && (
        <div className="actions">
          {info.endpoints.map((path) => (
            <Button key={path} type="button" disabled={busy} onClick={() => void query(path)}>
              {t('ops.query', { path })}
            </Button>
          ))}
        </div>
      )}
      {result && <pre className={styles.result}>{result}</pre>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}

export function CostRules({ site }: { site: SiteSettings }) {
  return (
    <p>
      {t('ops.costRules', {
        upload: site.uploadCost,
        private: site.privateUploadCost,
        closet: site.closetCost,
      })}
    </p>
  )
}

export function PointsPage({ site }: { site: SiteSettings }) {
  const wallet = useResource(api.getWallet)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [now, setNow] = useState(Date.now())
  const next = wallet.value?.nextSignAt
  useEffect(() => {
    if (!next) return
    const wait = new Date(next).getTime() - Date.now()
    if (wait <= 0) return
    const timer = setTimeout(() => setNow(Date.now()), Math.min(wait + 100, 2147483647))
    return () => clearTimeout(timer)
  }, [next, now])
  async function checkIn() {
    setBusy(true)
    setError('')
    try {
      await api.sign()
      wallet.reload()
    } catch (cause) {
      setError(errorMessage(cause))
      if (cause instanceof ApiError && cause.kind === 'alreadySigned') wallet.reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack">
      <div className="page-heading">
        <h1>{t('ops.points')}</h1>
      </div>
      {wallet.loading && <p>{t('common.loading')}</p>}
      {wallet.error && (
        <Notice tone="error">
          {wallet.error}
          <Button onClick={wallet.reload}>{t('common.retry')}</Button>
        </Notice>
      )}
      <section className="panel stack">
        <h2>
          {t('ops.balance')}: {wallet.value?.balance ?? '—'}
        </h2>
        <p>
          {t('ops.pointRules', {
            hours: site.signHours,
            min: site.signMin,
            max: site.signMax,
            initial: site.initialPoints,
            cost: site.playerCost,
          })}
        </p>
        <CostRules site={site} />
        {next && <p>{t('ops.nextSign', { time: formatDate(next) })}</p>}
        <div>
          <Button
            disabled={
              busy ||
              wallet.loading ||
              !wallet.value ||
              !site.signEnabled ||
              (!!next && new Date(next).getTime() > now)
            }
            onClick={() => void checkIn()}
          >
            {t('ops.sign')}
          </Button>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
      </section>
      <section className="panel stack">
        <h2 className="panel-header">{t('ops.ledger')}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('ops.time')}</th>
                <th>{t('ops.source')}</th>
                <th>{t('ops.change')}</th>
              </tr>
            </thead>
            <tbody>
              {wallet.value?.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{t(pointKindKeys[entry.kind])}</td>
                  <td>
                    {entry.delta > 0 ? '+' : ''}
                    {entry.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {wallet.value?.entries.length === 0 && <p>{t('common.empty')}</p>}
      </section>
    </div>
  )
}
