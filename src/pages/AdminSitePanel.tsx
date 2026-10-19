import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { EmailMode } from '../api/enums'
import { oauthApi, pluginApi, siteApi } from '../api/resources'
import type { OAuthClient, PluginInfo, SiteSettings } from '../api/types'
import { useAuth } from '../lib/auth'
import { useSite } from '../components/SiteProvider'
import { useAsync } from '../lib/useAsync'
import { isValidOidcIssuer, isValidRedirectUri } from '../lib/validate'
import { t } from '../i18n'
import type { MessageKey } from '../i18n/zh-CN'
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Select,
  Skeleton,
  Textarea,
  TextInput,
  useToast,
} from '../components/ui'

type FieldKind = 'text' | 'number' | 'textarea' | 'flag' | 'emailMode'

type FieldSpec = {
  key: keyof SiteSettings
  label: MessageKey
  kind: FieldKind
  hint?: MessageKey
  min?: number
  max?: number
  maxLength?: number
  wide?: boolean
}

type Group = { title: MessageKey; fields: FieldSpec[] }

const GROUPS: Group[] = [
  {
    title: 'admin.site.groupSite',
    fields: [
      { key: 'name', label: 'admin.site.name', kind: 'text', maxLength: 100 },
      { key: 'description', label: 'admin.site.description', kind: 'textarea', maxLength: 1000, wide: true },
      {
        key: 'announcement',
        label: 'admin.site.announcement',
        kind: 'textarea',
        maxLength: 4000,
        wide: true,
        hint: 'admin.site.announcementHint',
      },
    ],
  },
  {
    title: 'admin.site.groupAccess',
    fields: [
      { key: 'registration', label: 'admin.site.registration', kind: 'flag' },
      { key: 'emailMode', label: 'admin.site.emailMode', kind: 'emailMode' },
      {
        key: 'emailDomains',
        label: 'admin.site.emailDomains',
        kind: 'text',
        maxLength: 2000,
        wide: true,
        hint: 'admin.site.emailDomainsHint',
      },
      {
        key: 'skinDomains',
        label: 'admin.site.skinDomains',
        kind: 'text',
        maxLength: 2000,
        wide: true,
        hint: 'admin.site.skinDomainsHint',
      },
      {
        key: 'maxPlayers',
        label: 'admin.site.maxPlayers',
        kind: 'number',
        min: 1,
        max: 100,
        hint: 'admin.site.maxPlayersHint',
      },
      { key: 'singleSession', label: 'admin.site.singleSession', kind: 'flag', hint: 'admin.site.singleSessionHint' },
    ],
  },
  {
    title: 'admin.site.groupPoints',
    fields: [
      { key: 'signEnabled', label: 'admin.site.signEnabled', kind: 'flag' },
      {
        key: 'signHours',
        label: 'admin.site.signHours',
        kind: 'number',
        min: 1,
        max: 8760,
        hint: 'admin.site.signHoursHint',
      },
      { key: 'signMin', label: 'admin.site.signMin', kind: 'number', min: 0, max: 1000000 },
      {
        key: 'signMax',
        label: 'admin.site.signMax',
        kind: 'number',
        min: 0,
        max: 1000000,
        hint: 'admin.site.signMaxHint',
      },
      { key: 'initialPoints', label: 'admin.site.initialPoints', kind: 'number', min: 0, max: 1000000 },
      { key: 'playerCost', label: 'admin.site.playerCost', kind: 'number', min: 0, max: 1000000 },
      {
        key: 'uploadCost',
        label: 'admin.site.uploadCost',
        kind: 'number',
        min: 0,
        max: 1000000,
        hint: 'admin.site.uploadCostHint',
      },
      {
        key: 'privateUploadCost',
        label: 'admin.site.privateUploadCost',
        kind: 'number',
        min: 0,
        max: 1000000,
        hint: 'admin.site.privateUploadCostHint',
      },
      { key: 'closetCost', label: 'admin.site.closetCost', kind: 'number', min: 0, max: 1000000 },
    ],
  },
  {
    title: 'admin.site.groupOAuth',
    fields: [{ key: 'oauthEnabled', label: 'admin.site.oauthEnabled', kind: 'flag', wide: true }],
  },
  {
    title: 'admin.site.groupOidc',
    fields: [
      { key: 'oidcEnabled', label: 'admin.site.oidcEnabled', kind: 'flag' },
      { key: 'oidcName', label: 'admin.site.oidcName', kind: 'text', maxLength: 100, hint: 'admin.site.oidcNameHint' },
      {
        key: 'oidcIssuer',
        label: 'admin.site.oidcIssuer',
        kind: 'text',
        maxLength: 255,
        wide: true,
        hint: 'admin.site.oidcIssuerHint',
      },
      { key: 'oidcClientId', label: 'admin.site.oidcClientId', kind: 'text', maxLength: 255, wide: true },
    ],
  },
]

const EMAIL_MODE_LABELS: Record<number, MessageKey> = {
  [EmailMode.Unrestricted]: 'admin.site.modeUnrestricted',
  [EmailMode.Allow]: 'admin.site.modeAllow',
  [EmailMode.Deny]: 'admin.site.modeDeny',
}

function settingsProblem(value: SiteSettings): string | null {
  if (!value.name.trim()) return t('admin.site.errorName')
  if (value.name.length > 100 || value.description.length > 1000 || value.announcement.length > 4000) {
    return t('admin.site.errorTextLength')
  }
  if (value.emailDomains.length > 2000 || value.skinDomains.length > 2000) {
    return t('admin.site.errorDomainLength')
  }
  if (value.emailMode !== EmailMode.Unrestricted && !value.emailDomains.trim()) {
    return t('admin.site.errorEmailDomainsRequired')
  }
  if (!Number.isInteger(value.maxPlayers) || value.maxPlayers < 1 || value.maxPlayers > 100) {
    return t('admin.site.errorMaxPlayers')
  }
  if (!Number.isInteger(value.signHours) || value.signHours < 1 || value.signHours > 8760) {
    return t('admin.site.errorSignHours')
  }
  const points = [
    value.signMin,
    value.signMax,
    value.initialPoints,
    value.playerCost,
    value.uploadCost,
    value.privateUploadCost,
    value.closetCost,
  ]
  if (points.some((point) => !Number.isInteger(point) || point < 0 || point > 1000000)) {
    return t('admin.site.errorPoints')
  }
  if (value.signMax < value.signMin) return t('admin.site.errorSignRange')
  if (value.privateUploadCost < value.uploadCost) return t('admin.site.errorCostRange')
  if (value.oidcEnabled === 1) {
    if (!value.oidcName.trim() || !value.oidcClientId.trim()) return t('admin.site.errorOidcRequired')
    if (!isValidOidcIssuer(value.oidcIssuer.trim())) return t('admin.site.errorOidcIssuer')
  }
  return null
}

export function AdminSitePanel() {
  const { isOwner } = useAuth()
  const site = useSite()

  if (!isOwner) return <ErrorState message={t('admin.ownerOnly')} />
  if (site.loading && !site.site) return <Skeleton height={360} />
  if (site.error && !site.site) return <ErrorState message={site.error} onRetry={site.reload} />
  if (!site.site) return <ErrorState message={t('site.loadFailed')} onRetry={site.reload} />

  return (
    <div className="stack">
      <SiteSettingsForm settings={site.site} />
      <OAuthClientsPanel />
      <PluginsPanel />
    </div>
  )
}

function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const site = useSite()
  const toast = useToast()
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const update = (key: keyof SiteSettings, value: string | number) => {
    setDraft((current) => ({ ...current, [key]: value }) as SiteSettings)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const problem = settingsProblem(draft)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setBusy(true)
    try {
      await siteApi.save({
        ...draft,
        name: draft.name.trim(),
        emailDomains: draft.emailDomains.trim(),
        skinDomains: draft.skinDomains.trim(),
        oidcIssuer: draft.oidcIssuer.trim(),
        oidcClientId: draft.oidcClientId.trim(),
        oidcName: draft.oidcName.trim(),
      })
      toast.push(t('admin.site.saved'), 'success')
      site.reload()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const callback =
    typeof window === 'undefined' ? '/oidc/callback' : `${window.location.origin}/oidc/callback`

  return (
    <form className="stack" onSubmit={save} noValidate>
      {error ? <div className="notice notice--danger" role="alert">{error}</div> : null}
      {GROUPS.map((group) => (
        <section className="card" key={group.title}>
          <h2 className="section-title">{t(group.title)}</h2>
          {group.title === 'admin.site.groupOAuth' ? (
            <div className="stack">
              <p className="muted">{t('admin.site.oauthHint')}</p>
              <code className="code-block">
                {`GET ${window.location.origin}/oauth/authorize?response_type=code&client_id=…&redirect_uri=…&scope=User.Read%20Player.Read&state=…&code_challenge=…&code_challenge_method=S256`}
              </code>
            </div>
          ) : null}
          {group.title === 'admin.site.groupOidc' ? (
            <p className="muted">{t('admin.site.oidcCallback', { url: callback })}</p>
          ) : null}
          <div className="form-grid form-grid--two" style={{ marginTop: 'var(--space-4)' }}>
            {group.fields.map((field) => (
              <div key={field.key} className={field.wide ? 'form-grid__wide' : undefined}>
                <Field
                  label={t(field.label)}
                  htmlFor={`site-${field.key}`}
                  hint={field.hint ? t(field.hint) : undefined}
                >
                  {renderInput(field, draft, update)}
                </Field>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={busy}>
          {t('admin.site.save')}
        </Button>
      </div>
    </form>
  )
}

function renderInput(
  field: FieldSpec,
  value: SiteSettings,
  update: (key: keyof SiteSettings, value: string | number) => void,
) {
  const raw = value[field.key]
  const id = `site-${field.key}`

  if (field.kind === 'flag') {
    return (
      <Select id={id} value={String(raw)} onChange={(event) => update(field.key, Number(event.target.value))}>
        <option value="0">{t('common.disabled')}</option>
        <option value="1">{t('common.enabled')}</option>
      </Select>
    )
  }
  if (field.kind === 'emailMode') {
    return (
      <Select id={id} value={String(raw)} onChange={(event) => update(field.key, Number(event.target.value))}>
        {Object.entries(EMAIL_MODE_LABELS).map(([mode, label]) => (
          <option key={mode} value={mode}>
            {t(label)}
          </option>
        ))}
      </Select>
    )
  }
  if (field.kind === 'textarea') {
    return (
      <Textarea
        id={id}
        value={String(raw)}
        maxLength={field.maxLength}
        rows={4}
        onChange={(event) => update(field.key, event.target.value)}
      />
    )
  }
  if (field.kind === 'number') {
    return (
      <TextInput
        id={id}
        type="number"
        value={raw}
        min={field.min}
        max={field.max}
        step={1}
        required
        onChange={(event) =>
          update(field.key, event.target.value === '' ? 0 : Number(event.target.value))
        }
      />
    )
  }
  return (
    <TextInput
      id={id}
      value={String(raw)}
      maxLength={field.maxLength}
      required={field.key === 'name'}
      onChange={(event) => update(field.key, event.target.value)}
    />
  )
}

function OAuthClientsPanel() {
  const toast = useToast()
  const clients = useAsync((signal) => oauthApi.adminClients(signal), [])
  const [name, setName] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<OAuthClient | null>(null)

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setFormError(t('admin.site.errorClientName'))
      return
    }
    if (!isValidRedirectUri(redirectUri.trim())) {
      setFormError(t('admin.site.errorRedirectUri'))
      return
    }
    setFormError('')
    setBusy(true)
    try {
      await oauthApi.createClient(name.trim(), redirectUri.trim())
      setName('')
      setRedirectUri('')
      toast.push(t('admin.site.clientCreated'), 'success')
      clients.reload()
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!target) return
    setBusy(true)
    try {
      await oauthApi.deleteClient(target.id)
      toast.push(t('admin.site.clientDeleted'), 'success')
      setTarget(null)
      clients.reload()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">{t('admin.site.clients')}</h2>
      <p className="muted">{t('admin.site.clientsHint')}</p>
      {clients.loading ? <Skeleton height={140} /> : null}
      {clients.error ? <ErrorState message={errorMessage(clients.error)} onRetry={clients.reload} /> : null}
      {!clients.loading && !clients.error && clients.data ? (
        clients.data.length === 0 ? (
          <EmptyState title={t('admin.site.noClients')} body={t('admin.site.noClientsHint')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.site.clientName')}</th>
                  <th>{t('admin.site.clientId')}</th>
                  <th>{t('admin.site.redirect')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.data.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td className="mono">{client.id}</td>
                    <td className="mono" style={{ wordBreak: 'break-all' }}>{client.redirectUri}</td>
                    <td>
                      <Button size="sm" variant="danger" onClick={() => setTarget(client)}>
                        {t('common.remove')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <form className="form-grid form-grid--two" onSubmit={create} noValidate style={{ marginTop: 'var(--space-4)' }}>
        <Field label={t('admin.site.clientName')} htmlFor="oauth-client-name">
          <TextInput
            id="oauth-client-name"
            value={name}
            maxLength={100}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t('admin.site.redirect')} htmlFor="oauth-client-redirect" hint={t('admin.site.redirectHint')}>
          <TextInput
            id="oauth-client-redirect"
            value={redirectUri}
            maxLength={2048}
            required
            onChange={(event) => setRedirectUri(event.target.value)}
          />
        </Field>
        {formError ? (
          <div className="form-grid__wide">
            <p className="field__error" role="alert">{formError}</p>
          </div>
        ) : null}
        <div className="form-grid__wide form-actions">
          <Button type="submit" variant="primary" loading={busy}>
            {t('admin.site.createClient')}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={target !== null}
        title={t('admin.site.deleteClient')}
        body={target ? t('admin.site.deleteClientConfirm', { name: target.name }) : ''}
        confirmLabel={t('common.delete')}
        danger
        loading={busy}
        onCancel={() => setTarget(null)}
        onConfirm={() => void remove()}
      />
    </section>
  )
}

function PluginsPanel() {
  const plugins = useAsync((signal) => pluginApi.list(signal), [])
  return (
    <section className="card">
      <h2 className="section-title">{t('admin.site.plugins')}</h2>
      <p className="muted">{t('admin.site.pluginsHint')}</p>
      {plugins.loading ? <Skeleton height={160} /> : null}
      {plugins.error ? <ErrorState message={errorMessage(plugins.error)} onRetry={plugins.reload} /> : null}
      {!plugins.loading && !plugins.error && plugins.data ? (
        plugins.data.length === 0 ? (
          <EmptyState title={t('admin.site.noPlugins')} />
        ) : (
          <div className="stack">
            {plugins.data.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        )
      ) : null}
    </section>
  )
}

function pluginActionLabel(action: string): string {
  switch (action) {
    case 'account.create':
      return t('admin.site.actionAccountCreate')
    case 'session.issue':
      return t('admin.site.actionSessionIssue')
    case 'player.save':
      return t('admin.site.actionPlayerSave')
    case 'player.delete':
      return t('admin.site.actionPlayerDelete')
    case 'texture.upload':
      return t('admin.site.actionTextureUpload')
    case 'account.check_in':
      return t('admin.site.actionCheckIn')
    default:
      return action
  }
}

function PluginCard({ plugin }: { plugin: PluginInfo }) {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const query = async (path: string) => {
    setBusy(path)
    setError('')
    try {
      setResult(JSON.stringify(await pluginApi.query(plugin.id, path), null, 2))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('common.errorGeneric'))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="plugin-card stack">
      <div className="row-between">
        <div className="row">
          <strong className="mono">{plugin.id}</strong>
          <Badge tone={plugin.enabled === 1 ? 'success' : 'default'}>
            {plugin.enabled === 1 ? t('common.enabled') : t('common.disabled')}
          </Badge>
        </div>
        <span className="muted mono">v{plugin.version} · API {plugin.apiVersion}</span>
      </div>
      <p className="muted">{plugin.description}</p>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {plugin.actions.map((action) => (
          <Badge key={action} tone="accent">
            {pluginActionLabel(action)}
          </Badge>
        ))}
        {plugin.before ? <Badge tone="warning">{t('admin.site.before')}</Badge> : null}
        {plugin.after ? <Badge tone="success">{t('admin.site.after')}</Badge> : null}
      </div>
      {plugin.enabled === 1 && plugin.endpoints.length > 0 ? (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {plugin.endpoints.map((path) => (
            <Button key={path} size="sm" loading={busy === path} disabled={Boolean(busy)} onClick={() => void query(path)}>
              {t('admin.site.queryPlugin', { path: `${plugin.id}${path}` })}
            </Button>
          ))}
        </div>
      ) : null}
      {error ? <p className="field__error" role="alert">{error}</p> : null}
      {result ? <pre className="code-block">{result}</pre> : null}
    </div>
  )
}

