import type { FormEvent } from 'react'
import type { Account, TextureQuery } from '../api/types'
import { Button } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './LibraryPage.module.css'
interface Props {
  mode: 'public' | 'mine' | 'closet'
  search: string
  query: TextureQuery
  account: Account | null
  route: string
  submit: (event: FormEvent<HTMLFormElement>) => void
  filter: (key: string, value: string) => void
}
export function LibraryToolbar({ mode, search, query, account, route, submit, filter }: Props) {
  return (
    <>
      {' '}
      {mode === 'closet' && (
        <div className={styles.tabs}>
          <button
            className={query.type !== 2 ? styles.active : ''}
            onClick={() => filter('type', '')}
          >
            {t('library.all')}
          </button>
          <button
            className={query.type === 2 ? styles.active : ''}
            onClick={() => filter('type', '2')}
          >
            {t('bs.cape')}
          </button>
          <a href="#/skinlib/upload">{t('nav.upload')}</a>
        </div>
      )}
      <div className={styles.toolbar}>
        <form key={search} className={styles.search} onSubmit={submit}>
          <select name="type" defaultValue={query.type ?? ''} aria-label={t('library.type')}>
            <option value="">{t('library.all')}</option>
            {[0, 1, 2].map((type) => (
              <option value={type} key={type}>
                {t(type === 0 ? 'library.steve' : type === 1 ? 'library.alex' : 'library.cape')}
              </option>
            ))}
          </select>
          <input
            name="q"
            type="search"
            aria-label={t('library.search')}
            defaultValue={query.q}
            placeholder={t('library.placeholder')}
            maxLength={200}
          />
          <input type="hidden" name="uploader" value={query.uploader ?? ''} />
          <Button type="submit" aria-label={t('library.filter')}>
            ⌕
          </Button>
        </form>
        <div className={styles.sort}>
          <button
            className={query.sort === 'name' ? styles.sortActive : ''}
            onClick={() => filter('sort', 'name')}
          >
            {t('library.name')}
          </button>
          <button
            className={query.sort === 'newest' ? styles.sortActive : ''}
            onClick={() => filter('sort', 'newest')}
          >
            {t('library.newest')}
          </button>
          <button
            className={query.sort === 'oldest' ? styles.sortActive : ''}
            onClick={() => filter('sort', 'oldest')}
          >
            {t('library.oldest')}
          </button>
          {account && mode === 'public' && (
            <button onClick={() => filter('uploader', account.id)}>{t('bs.myUploads')}</button>
          )}
          <a href={`#${route}`}>{t('library.reset')}</a>
        </div>
      </div>
    </>
  )
}
