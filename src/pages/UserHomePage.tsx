import { useEffect, useState } from 'react'
import { listPlayers } from '../api/players'
import { listCloset } from '../api/closet'
import { listMyTextures } from '../api/textures'
import { errorMessage } from '../api/client'
import type { Account } from '../api/types'
import { Notice, Button } from '../components/UI'
import { UserIcon, ClosetIcon, GalleryIcon } from '../components/Icons'
import { t } from '../i18n/zh-CN'
import styles from './UserHomePage.module.css'
export function UserHomePage({ account }: { account: Account }) {
  const [counts, setCounts] = useState<number[] | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    setError('')
    Promise.all([
      listPlayers(c.signal),
      listCloset({ limit: 1 }, c.signal),
      listMyTextures({ limit: 1 }, c.signal),
    ])
      .then(([p, cl, tx]) => {
        if (!c.signal.aborted) setCounts([p.length, cl.total, tx.total])
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(errorMessage(e))
      })
    return () => c.abort()
  }, [retry])
  return (
    <>
      <div className="page-heading">
        <h1>{t('nav.center')}</h1>
      </div>
      {error ? (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={() => setRetry((v) => v + 1)}>
            {t('common.retry')}
          </Button>
        </Notice>
      ) : (
        <div className={styles.metrics}>
          {[
            { key: 'nav.players', href: '/user/player', Icon: UserIcon },
            { key: 'nav.closet', href: '/user/closet', Icon: ClosetIcon },
            { key: 'nav.mine', href: '/user/textures', Icon: GalleryIcon },
          ].map(({ key, href, Icon }, i) => (
            <a className={styles.metric} href={'#' + href} key={key}>
              <span>
                <Icon />
              </span>
              <div>
                {t(key)}
                <strong>{counts?.[i] ?? '…'}</strong>
              </div>
            </a>
          ))}
        </div>
      )}
      <div className={styles.columns}>
        <section className="panel panel-primary stack">
          <h2 className="panel-header">{t('user.usage')}</h2>
          <p>{t('user.usageText')}</p>
          <FieldAddress />
          <a href="#/user/player">{t('nav.players')}</a>
          <a href="#/skinlib">{t('nav.library')}</a>
        </section>
        <section className="panel panel-primary stack">
          <h2 className="panel-header">{t('nav.account')}</h2>
          <p>{account.email}</p>
          <p>{t(account.verified ? 'account.verified' : 'account.unverified')}</p>
          <a href="#/user/profile">{t('user.manageAccount')}</a>
        </section>
      </div>
    </>
  )
}
function FieldAddress() {
  return (
    <label>
      {t('user.authAddress')}
      <input readOnly value={location.origin} onFocus={(e) => e.currentTarget.select()} />
    </label>
  )
}
