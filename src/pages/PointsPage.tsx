import { useEffect, useState } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { PointKind } from '../api/enums'
import { pointsApi } from '../api/resources'
import { useAuth } from '../lib/auth'
import { useSite } from '../components/SiteProvider'
import { useAsync } from '../lib/useAsync'
import { formatDateTime } from '../lib/format'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { Badge, Button, EmptyState, ErrorState, Skeleton, useToast } from '../components/ui'
import { Link } from '../lib/router'

function pointKindLabel(kind: number): string {
  switch (kind) {
    case PointKind.Initial:
      return t('points.kindInitial')
    case PointKind.Sign:
      return t('points.kindSign')
    case PointKind.Player:
      return t('points.kindPlayer')
    case PointKind.Upload:
      return t('points.kindUpload')
    case PointKind.Closet:
      return t('points.kindCloset')
    case PointKind.Privacy:
      return t('points.kindPrivacy')
    default:
      return String(kind)
  }
}

function pointKindTone(kind: number): 'default' | 'accent' | 'success' | 'warning' {
  if (kind === PointKind.Sign) return 'success'
  if (kind === PointKind.Initial) return 'warning'
  if (kind === PointKind.Privacy) return 'accent'
  return 'default'
}

export function PointsPage() {
  const { status } = useAuth()
  const site = useSite()
  const toast = useToast()
  const wallet = useAsync((signal) => pointsApi.wallet(signal), [])
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const nextSignAt = wallet.data?.nextSignAt ?? null

  useEffect(() => {
    if (!nextSignAt) return
    const remaining = new Date(nextSignAt).getTime() - Date.now()
    if (!Number.isFinite(remaining) || remaining <= 0) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(remaining + 100, 2_147_483_647))
    return () => window.clearTimeout(timer)
  }, [nextSignAt, now])

  if (status !== 'authenticated') {
    return (
      <>
        <PageHeader title={t('points.title')} subtitle={t('points.subtitle')} />
        <div className="notice">
          {t('upload.needLogin')}{' '}
          <Link to={`/login?next=${encodeURIComponent('/points')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  if (wallet.loading || site.loading) {
    return (
      <>
        <PageHeader title={t('points.title')} subtitle={t('points.subtitle')} />
        <div className="stack">
          <Skeleton height={200} />
          <Skeleton height={280} />
        </div>
      </>
    )
  }

  if (wallet.error || site.error || !wallet.data || !site.site) {
    return (
      <>
        <PageHeader title={t('points.title')} subtitle={t('points.subtitle')} />
        <ErrorState
          message={wallet.error ? errorMessage(wallet.error) : site.error ?? t('site.loadFailed')}
          onRetry={() => {
            wallet.reload()
            site.reload()
          }}
        />
      </>
    )
  }

  const rules = site.site
  const data = wallet.data
  const next = nextSignAt ? new Date(nextSignAt).getTime() : 0
  const cooling = next > now

  const sign = async () => {
    setBusy(true)
    try {
      const result = await pointsApi.sign()
      wallet.setData(result)
      setNow(Date.now())
      toast.push(t('points.signed'), 'success')
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
      if (caught instanceof ApiError && caught.code === 'AlreadySigned') wallet.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('points.title')} subtitle={t('points.subtitle')} />

      <div className="stack">
        <section className="card">
          <div className="row-between">
            <h2 className="section-title">{t('points.wallet')}</h2>
            <Badge tone="warning">{t('points.balance', { balance: data.balance })}</Badge>
          </div>
          <div className="points-hero">
            <span className="points-hero__value">{data.balance}</span>
            <span className="muted">{t('points.current')}</span>
          </div>
          <div className="row-between" style={{ marginTop: 'var(--space-4)' }}>
            <div className="stack" style={{ gap: 'var(--space-1)' }}>
              <span className="muted">
                {rules.signEnabled !== 1
                  ? t('points.signClosed')
                  : cooling
                    ? t('points.nextSign', { time: formatDateTime(nextSignAt ?? '') })
                    : t('points.ready')}
              </span>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                {t('points.signRule', { hours: rules.signHours, min: rules.signMin, max: rules.signMax })}
              </span>
            </div>
            <Button variant="primary" loading={busy} disabled={rules.signEnabled !== 1 || cooling} onClick={() => void sign()}>
              {t('points.sign')}
            </Button>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">{t('points.rulesTitle')}</h2>
          <dl className="def-list">
            <div>
              <dt>{t('points.initial')}</dt>
              <dd>{t('points.initialValue', { points: rules.initialPoints })}</dd>
            </div>
            <div>
              <dt>{t('points.player')}</dt>
              <dd>{t('points.playerValue', { points: rules.playerCost })}</dd>
            </div>
            <div>
              <dt>{t('points.upload')}</dt>
              <dd>
                {t('points.uploadValue', {
                  public: rules.uploadCost,
                  private: rules.privateUploadCost,
                })}
              </dd>
            </div>
            <div>
              <dt>{t('points.closet')}</dt>
              <dd>{t('points.closetValue', { points: rules.closetCost })}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className="section-title">{t('points.ledger')}</h2>
          {data.entries.length === 0 ? (
            <EmptyState title={t('points.noEntries')} body={t('points.noEntriesHint')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('points.ledgerTime')}</th>
                    <th>{t('points.ledgerKind')}</th>
                    <th>{t('points.ledgerChange')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="nowrap">{formatDateTime(entry.createdAt)}</td>
                      <td>
                        <Badge tone={pointKindTone(entry.kind)}>{pointKindLabel(entry.kind)}</Badge>
                      </td>
                      <td className="mono">
                        <span className={entry.delta < 0 ? 'points-negative' : 'points-positive'}>
                          {entry.delta > 0 ? '+' : ''}
                          {entry.delta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
