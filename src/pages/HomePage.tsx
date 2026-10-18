import { PlayersIcon, ShareIcon, CloudIcon } from '../components/Icons'
import { t } from '../i18n/zh-CN'
import styles from './HomePage.module.css'
export function HomePage({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
      <section className={styles.splash}>
        <div>
          <h1>{t('brand.name')}</h1>
          <p>{t('home.siteDescription')}</p>
          <a className={styles.mainButton} href={signedIn ? '#/user/closet' : '#/auth/register'}>
            {t(signedIn ? 'nav.center' : 'nav.register')}
          </a>
        </div>
      </section>
      <section className={styles.intro}>
        <h2>{t('home.features')}</h2>
        <div className={styles.features}>
          {[
            { Icon: PlayersIcon, title: 'home.multiple', body: 'home.multipleDesc' },
            { Icon: ShareIcon, title: 'home.share', body: 'home.shareDesc' },
            { Icon: CloudIcon, title: 'home.hosting', body: 'home.hostingDesc' },
          ].map(({ Icon, title, body }) => (
            <div key={title}>
              <Icon />
              <h3>{t(title)}</h3>
              <p>{t(body)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.start}>
        <p>{t('home.introduction')}</p>
        <a className={styles.mainButton} href="#/auth/register">
          {t('home.begin')}
        </a>
      </section>
    </>
  )
}
