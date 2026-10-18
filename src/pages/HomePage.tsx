import { TEXTURE_STATE, TEXTURE_TYPE } from '../api/enums'
import { fetchCloset, fetchMyTextures, fetchPlayers, fetchTextures } from '../api/resources'
import { CharacterViewer } from '../components/CharacterViewer'
import { TextureCard } from '../components/TextureCard'
import { CopyButton, EmptyState, ErrorState, Skeleton } from '../components/ui'
import { t } from '../i18n/zh-CN'
import { href } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { useAuth } from '../components/AuthProvider'
import { IconCloset, IconLibrary, IconPlayer, IconUpload } from '../components/icons'

const LATEST_LIMIT = 12

export function HomePage() {
  const auth = useAuth()
  const latest = useAsync((signal) => fetchTextures({ limit: LATEST_LIMIT, sort: 'newest' }, signal), [])
  const mine = useAsync((signal) => fetchMyTextures({ limit: 1 }, signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })
  const closet = useAsync((signal) => fetchCloset({ limit: 1 }, signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })
  const players = useAsync((signal) => fetchPlayers(signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })

  const featured =
    latest.data?.items.find(
      (item) => item.type !== TEXTURE_TYPE.CAPE && item.state === TEXTURE_STATE.ACTIVE,
    ) ?? null
  const total = latest.data?.meta.total ?? 0

  return (
    <div className="container">
      <div className="page">
        <section className="hero">
          <div className="hero__copy">
            <p className="hero__eyebrow">{t('home.eyebrow')}</p>
            <h1 className="hero__title">{t('home.title')}</h1>
            <p className="hero__desc">{t('home.desc')}</p>
            <div className="hero__actions">
              <a className="mc-btn mc-btn--primary" href={href('/skinlib')}>
                {t('home.cta.library')}
              </a>
              {auth.loggedIn ? (
                <a className="mc-btn" href={href('/upload')}>
                  {t('home.cta.upload')}
                </a>
              ) : (
                <a className="mc-btn" href={href('/auth/login')}>
                  {t('home.cta.login')}
                </a>
              )}
            </div>
            <ul className="hero__facts">
              <li>
                <span className="brand__logo" aria-hidden="true" />
                {t('home.fact.textures', { count: total })}
              </li>
              <li>{t('home.fact.api')}</li>
              <li>{t('home.fact.players')}</li>
            </ul>
          </div>
          <div className="hero__art">
            {featured ? (
              <CharacterViewer
                skinUrl={`/textures/${featured.hash}`}
                model={featured.type === TEXTURE_TYPE.ALEX ? 'slim' : 'default'}
                alt={featured.name}
              />
            ) : (
              <div className="hero__empty">
                <span className="hero__empty-block" aria-hidden="true" />
                <span>{latest.error ? latest.error : t('library.empty')}</span>
                <a className="mc-btn mc-btn--sm" href={href('/skinlib')}>
                  {t('home.cta.library')}
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <span className="stat__icon" aria-hidden="true">
              <IconLibrary size={20} />
            </span>
            <div>
              <div className="stat__value">{total}</div>
              <div className="stat__label">{t('home.stat.textures')}</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat__icon" aria-hidden="true">
              <IconUpload size={20} />
            </span>
            <div>
              <div className="stat__value">{auth.loggedIn ? (mine.data?.meta.total ?? '—') : '—'}</div>
              <div className="stat__label">{t('home.stat.mine')}</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat__icon" aria-hidden="true">
              <IconCloset size={20} />
            </span>
            <div>
              <div className="stat__value">
                {auth.loggedIn ? (closet.data?.meta.total ?? '—') : '—'}
              </div>
              <div className="stat__label">{t('home.stat.closet')}</div>
            </div>
          </div>
          <div className="stat">
            <span className="stat__icon" aria-hidden="true">
              <IconPlayer size={20} />
            </span>
            <div>
              <div className="stat__value">
                {auth.loggedIn ? (players.data?.length ?? '—') : '—'}
              </div>
              <div className="stat__label">{t('home.stat.players')}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">{t('home.latest')}</h2>
            <a className="mc-btn mc-btn--sm" href={href('/skinlib')}>
              {t('home.latestMore')}
            </a>
          </div>
          {latest.loading ? (
            <div className="cards">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} height={188} />
              ))}
            </div>
          ) : latest.error ? (
            <ErrorState message={latest.error} onRetry={latest.reload} />
          ) : latest.data && latest.data.items.length > 0 ? (
            <div className="cards">
              {latest.data.items.map((texture) => (
                <TextureCard key={texture.id} texture={texture} />
              ))}
            </div>
          ) : (
            <EmptyState title={t('library.empty')} text={t('library.emptyHint')}>
              {auth.loggedIn ? (
                <a className="mc-btn mc-btn--primary" href={href('/upload')}>
                  {t('home.cta.upload')}
                </a>
              ) : (
                <a className="mc-btn mc-btn--primary" href={href('/auth/login')}>
                  {t('home.cta.login')}
                </a>
              )}
            </EmptyState>
          )}
        </section>

        <section className="section">
          <div className="panel">
            <div className="panel__head">
              <span className="panel__title">{t('home.api.title')}</span>
            </div>
            <div className="panel__body stack">
              <p className="muted">{t('home.api.desc')}</p>
              <div className="row">
                <code className="mono">{window.location.origin}</code>
                <CopyButton value={window.location.origin} label={t('home.api.copy')} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
