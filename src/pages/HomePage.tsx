import { Link } from '../lib/router'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'
import { t } from '../i18n'
import { textureApi } from '../api/resources'
import { PageHeader } from '../components/AppShell'
import { TextureCard } from '../components/TextureCard'
import { EmptyState, ErrorState, SkeletonGrid } from '../components/ui'
import { UploadIcon } from '../components/icons'

export function HomePage() {
  const { status } = useAuth()
  const latest = useAsync((signal) => textureApi.list({ limit: 6, sort: 'newest' }, signal), [])

  return (
    <>
      <section className="hero">
        <div>
          <h1 className="hero__title">{t('app.name')}</h1>
          <p className="hero__text">{t('home.description')}</p>
          <div className="hero__actions">
            <Link to="/library" className="btn btn--primary">
              {t('home.ctaLibrary')}
            </Link>
            {status === 'authenticated' ? (
              <Link to="/closet" className="btn">
                {t('home.ctaCloset')}
              </Link>
            ) : (
              <Link to="/register" className="btn">
                {t('home.ctaRegister')}
              </Link>
            )}
          </div>
        </div>
        <div className="hero__panel" aria-hidden="true">
          <div className="checker" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
              {['#3f6fa8', '#4a3f6f', '#3f7a52', '#b08a4f'].map((color) => (
                <span key={color} style={{ background: color, paddingTop: '100%', borderRadius: 2 }} />
              ))}
            </div>
          </div>
          <div className="row-between">
            <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
              64×64 / 64×32 PNG
            </span>
            <span className="badge mono">image-rendering: pixelated</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title">
        <h2 className="section-title" id="features-title">
          {t('home.featuresTitle')}
        </h2>
        <div className="feature-grid">
          <article className="feature">
            <h3>{t('home.featureMultiTitle')}</h3>
            <p>{t('home.featureMultiBody')}</p>
          </article>
          <article className="feature">
            <h3>{t('home.featureUploadTitle')}</h3>
            <p>{t('home.featureUploadBody')}</p>
          </article>
          <article className="feature">
            <h3>{t('home.featureYggTitle')}</h3>
            <p>{t('home.featureYggBody')}</p>
          </article>
        </div>
      </section>

      <section style={{ marginTop: 'var(--space-12)' }} aria-labelledby="latest-title">
        <PageHeader
          title={t('home.latestTitle')}
          actions={
            <Link to="/library" className="btn btn--sm">
              {t('home.latestMore')}
            </Link>
          }
        />
        {latest.loading ? <SkeletonGrid count={6} /> : null}
        {latest.error ? <ErrorState message={t('common.errorGeneric')} onRetry={latest.reload} /> : null}
        {!latest.loading && !latest.error && latest.data ? (
          latest.data.items.length === 0 ? (
            <EmptyState
              title={t('home.latestEmpty')}
              action={
                status === 'authenticated' ? (
                  <Link to="/upload" className="btn btn--primary">
                    <UploadIcon /> {t('upload.title')}
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="texture-grid">
              {latest.data.items.map((texture) => (
                <TextureCard key={texture.id} texture={texture} />
              ))}
            </div>
          )
        ) : null}
      </section>
    </>
  )
}
