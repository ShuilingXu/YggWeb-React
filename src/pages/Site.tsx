import { useEffect, useState, type FormEvent } from 'react'
import { pointKindLabel } from '../api/enums'
import { api } from '../api/resources'
import type { SiteSettings } from '../api/types'
import { useAsync } from '../lib/useAsync'
import { useAction } from '../lib/useAction'
import { useAuth } from '../lib/auth'
import { date } from '../lib/format'
import { Button, Field, Skeleton, ErrorState } from '../components/UI'
import { t, type MessageKey } from '../i18n/zh-CN'

const fields: { key: keyof SiteSettings
  label: MessageKey
  kind: 'text' | 'number' | 'toggle' | 'mode' }[] = [
  { key: 'uploadCost', label: 'uploadCostSetting', kind: 'number' },
  { key: 'privateUploadCost', label: 'privateUploadCostSetting', kind: 'number' },
  { key: 'closetCost', label: 'closetCostSetting', kind: 'number' },
  { key: 'oidcEnabled', label: 'oidcEnabledSetting', kind: 'toggle' },
  { key: 'oidcIssuer', label: 'oidcIssuerSetting', kind: 'text' },
  { key: 'oidcClientId', label: 'oidcClientIdSetting', kind: 'text' },
  { key: 'oidcName', label: 'oidcNameSetting', kind: 'text' },
  { key: 'name', label: 'siteName', kind: 'text' },
  { key: 'description', label: 'siteDescription', kind: 'text' },
  { key: 'announcement', label: 'siteAnnouncement', kind: 'text' },
  { key: 'registration', label: 'registrationSetting', kind: 'toggle' },
  { key: 'emailMode', label: 'emailModeSetting', kind: 'mode' },
  { key: 'skinDomains', label: 'skinDomainsSetting', kind: 'text' },
  { key: 'emailDomains', label: 'emailDomainsSetting', kind: 'text' },
  { key: 'maxPlayers', label: 'maxPlayersSetting', kind: 'number' },
  { key: 'singleSession', label: 'singleSessionSetting', kind: 'toggle' },
  { key: 'signEnabled', label: 'signEnabledSetting', kind: 'toggle' },
  { key: 'signHours', label: 'signHoursSetting', kind: 'number' },
  { key: 'signMin', label: 'signMinSetting', kind: 'number' },
  { key: 'signMax', label: 'signMaxSetting', kind: 'number' },
  { key: 'initialPoints', label: 'initialPointsSetting', kind: 'number' },
  { key: 'playerCost', label: 'playerCostSetting', kind: 'number' },
  { key: 'oauthEnabled', label: 'oauthEnabledSetting', kind: 'toggle' },
]

export function SiteAdmin() {
  const auth = useAuth()
  const site = useAsync(api.site, [])
  const clients = useAsync(signal => auth.account?.permission === 2 ? api.clients(signal) : Promise.resolve([]), [auth.account?.permission])
  const action = useAction()
  const [draft, setDraft] = useState<SiteSettings>()
  if (auth.account?.permission !== 2) return <ErrorState message={t('forbidden')} />
  if (site.loading) return <Skeleton />
  if (site.error || !site.value) return <ErrorState message={site.error} retry={site.reload} />
  const value = draft || site.value
  const save = (e: FormEvent) => {
    e.preventDefault()
    void action.run(signal => api.saveSite(value, signal), t('settingsSaved'), () => window.dispatchEvent(new Event('ygg:site')))
  }
  return <div className="stack"><h1>{t('siteSettings')}</h1><p>{t('settingsHint')}</p><p>{t('oidcSetupHint')}</p><form className="panel stack" onSubmit={save}>{fields.map(field => <Field key={field.key} label={t(field.label)}>{field.kind === 'toggle' || field.kind === 'mode' ? <select value={value[field.key]} onChange={e => setDraft({ ...value, [field.key]: Number(e.target.value) })}>{(field.kind === 'mode' ? ['unrestricted', 'allowDomains', 'denyDomains'] : ['disabled', 'enabled']).map((label, index) => <option value={index} key={index}>{t(label as MessageKey)}</option>)}</select> : <input name={field.key} type={field.kind} min={field.key === 'maxPlayers' || field.key === 'signHours' ? 1 : 0} step={1} max={field.kind === 'number' ? field.key === 'maxPlayers' ? 100 : field.key === 'signHours' ? 8760 : 1000000 : undefined} maxLength={field.key === 'name' ? 100 : field.key === 'description' ? 1000 : field.key === 'announcement' ? 4000 : 2000} value={value[field.key]} required={field.key === 'name' || field.kind === 'number'} onChange={e => setDraft({ ...value, [field.key]: field.kind === 'number' ? Number(e.target.value) : e.target.value })} />}</Field>)}<Button type="submit" busy={action.busy}>{t('save')}</Button></form>
    <section className="panel stack"><h2>{t('oauthClients')}</h2><p>{t('oauthHint')}</p>{clients.error && <ErrorState message={clients.error} retry={clients.reload} />}{clients.value?.map(c => <div className="stack" key={c.id}><strong>{c.name}</strong><p>{t('clientId')}: <code>{c.id}</code></p><p className="mono">{c.redirectUri}</p><Button variant="danger" busy={action.busy} onClick={() => action.run(signal => api.deleteClient(c.id, signal), t('success'), clients.reload)}>{t('remove')}</Button></div>)}<form className="stack" onSubmit={e => { e.preventDefault()
      const form = e.currentTarget
      const data = new FormData(form)
      void action.run(signal => api.createClient(String(data.get('name')), String(data.get('redirect')), signal), t('success'), () => { form.reset()
        clients.reload() }) }}><Field label={t('clientName')}><input name="name" maxLength={100} required /></Field><Field label={t('redirectUri')}><input name="redirect" type="url" required /></Field><Button type="submit" busy={action.busy}>{t('createClient')}</Button></form></section>{action.error && <p className="field-error" role="alert">{action.error}</p>}</div>
}

export function PointsPage() {
  const wallet = useAsync(api.wallet, [])
  const site = useAsync(api.site, [])
  const action = useAction()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const next = wallet.value?.nextSignAt
    if (!next) return
    const remaining = new Date(next).getTime() - Date.now()
    if (remaining <= 0) {
      return }
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(remaining + 100, 2147483647))
    return () => window.clearTimeout(timer)
  }, [wallet.value?.nextSignAt, now])
  if (wallet.loading || site.loading) return <Skeleton />
  if (wallet.error || site.error) return <ErrorState message={wallet.error || site.error} retry={() => { wallet.reload()
    site.reload() }} />
  const c = site.value!
  const w = wallet.value!
  return <div className="stack"><h1>{t('points')}</h1><section className="panel stack"><h2>{t('balance')}: {w.balance}</h2><p>{t('pointRules', { hours: c.signHours, min: c.signMin, max: c.signMax, cost: c.playerCost, upload: c.uploadCost, private: c.privateUploadCost, closet: c.closetCost })}</p>{w.nextSignAt && <p>{t('nextSign', { date: date(w.nextSignAt, true) })}</p>}<Button disabled={!c.signEnabled || !!w.nextSignAt && new Date(w.nextSignAt).getTime() > now} busy={action.busy} onClick={() => action.run(api.sign, t('success'), wallet.reload)}>{t('sign')}</Button>{action.error && <p className="field-error" role="alert">{action.error}</p>}</section><section className="panel stack"><h2>{t('pointsLedger')}</h2>{!w.entries.length && <p>{t('noPointEntries')}</p>}{w.entries.map(e => <p key={e.id}>{date(e.createdAt, true)} · {pointKindLabel(e.kind)} · {e.delta > 0 ? '+' : ''}{e.delta}</p>)}</section></div>
}

export function OAuthConsent({ params }: { params: URLSearchParams }) {
  const client = useAsync(signal => api.oauthClient(params.get('client_id') || '', signal), [params.toString()])
  const action = useAction()
  if (client.loading) return <Skeleton />
  if (client.error) return <ErrorState message={client.error} />
  const scopes = (params.get('scope') || '').split(' ')
  const invalid = params.get('redirect_uri') !== client.value?.redirectUri || params.get('response_type') !== 'code' || params.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') || '') || !scopes.length || scopes.some(scope => !['User.Read', 'Player.Read'].includes(scope))
  const consent = (approve: boolean) => action.run(async signal => {
    const result = await api.consent({ ...Object.fromEntries(params), approve }, signal)
    window.location.assign(result.redirect)
  })
  return <section className="panel stack"><h1>{t('authorizeApp')}</h1><h2>{client.value?.name}</h2><p>{t('consentHint')}</p><p className="mono">{t('redirectUri')}: {client.value?.redirectUri}</p><p>{t('requestedScopes')}: {scopes.map(scope => t(scope === 'User.Read' ? 'oauthUserRead' : 'oauthPlayerRead')).join('、')}</p>{invalid ? <ErrorState message={t('oauthInvalid')} /> : <div className="dialog-actions"><Button busy={action.busy} onClick={() => consent(false)}>{t('deny')}</Button><Button busy={action.busy} onClick={() => consent(true)}>{t('approve')}</Button></div>}{action.error && <p className="field-error" role="alert">{action.error}</p>}</section>
}

export function AuthorizedApps() {
  const grants = useAsync(api.grants, [])
  const action = useAction()
  return <section className="panel stack"><h2>{t('oauthClients')}</h2>{grants.loading ? <Skeleton /> : grants.error ? <ErrorState message={grants.error} retry={grants.reload} /> : !grants.value?.length ? <p>{t('noOAuthApps')}</p> : grants.value.map(c => <div key={c.id}><strong>{c.name}</strong><Button busy={action.busy} onClick={() => action.run(signal => api.revokeGrant(c.id, signal), t('success'), grants.reload)}>{t('revokeAuthorization')}</Button></div>)}{action.error && <p className="field-error" role="alert">{action.error}</p>}</section>
}
