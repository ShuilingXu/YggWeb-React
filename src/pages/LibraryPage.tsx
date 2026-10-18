import { useEffect, useState } from 'react'
import { TEXTURE_TYPE, textureTypeLabel } from '../api/enums'
import { fetchMyTextures, fetchTextures } from '../api/resources'
import { useAuth } from '../components/AuthProvider'
import { TextureCard } from '../components/TextureCard'
import {
  EmptyState,
  ErrorState,
  Notice,
  Pagination,
  Skeleton,
  Tabs,
} from '../components/ui'
import { t } from '../i18n/zh-CN'
import { PAGE_SIZE } from '../lib/paging'
import { readOffset, readSearch, readSort, readType } from '../lib/query'
import { href, navigate, useRoute } from '../lib/router'
import { useAsync } from '../lib/useAsync'

type LibraryTab = 'public' | 'mine'

const TYPE_OPTIONS = [
  { value: '', label: t('common.all') },
  { value: String(TEXTURE_TYPE.STEVE), label: textureTypeLabel(TEXTURE_TYPE.STEVE) },
  { value: String(TEXTURE_TYPE.ALEX), label: textureTypeLabel(TEXTURE_TYPE.ALEX) },
  { value: String(TEXTURE_TYPE.CAPE), label: textureTypeLabel(TEXTURE_TYPE.CAPE) },
]

export function LibraryPage() {
  const route = useRoute()
  const auth = useAuth()
  const query = route.query
  const tab: LibraryTab = auth.loggedIn && query.get('tab') === 'mine' ? 'mine' : 'public'
  const type = readType(query)
  const sort = readSort(query)
  const offset = readOffset(query)
  const search = readSearch(query)
  const [keyword, setKeyword] = useState(search)

  // URL 是筛选状态的唯一来源，输入框只做 300ms 防抖后回写。
  useEffect(() => {
    setKeyword(search)
  }, [search])

  function updateParams(patch: Record<string, string | undefined>, resetOffset = true): void {
    const next = new URLSearchParams(query)
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (resetOffset) next.delete('offset')
    const text = next.toString()
    navigate(`/skinlib${text ? `?${text}` : ''}`, { replace: true })
  }

  useEffect(() => {
    if (keyword === search) return
    const timer = window.setTimeout(() => updateParams({ q: keyword || undefined }), 300)
    return () => window.clearTimeout(timer)
    // updateParams 依赖 route.query，keyword 变化才需要重排
  }, [keyword, search])

  const list = useAsync(
    (signal) =>
      tab === 'mine'
        ? fetchMyTextures({ offset, limit: PAGE_SIZE, q: search || undefined, type, sort }, signal)
        : fetchTextures({ offset, limit: PAGE_SIZE, q: search || undefined, type, sort }, signal),
    [tab, offset, search, type, sort],
  )

  const total = list.data?.meta.total ?? 0
  const items = list.data?.items ?? []

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">
              {tab === 'mine' ? t('library.mine.title') : t('library.title')}
            </h1>
            <p className="page__sub">
              {tab === 'mine' ? t('library.mine.sub') : t('library.sub')}
            </p>
          </div>
          <div className="page__actions">
            {auth.loggedIn ? (
              <a className="mc-btn mc-btn--primary" href={href('/upload')}>
                {t('home.cta.upload')}
              </a>
            ) : (
              <a className="mc-btn mc-btn--primary" href={href('/auth/login')}>
                {t('nav.login')}
              </a>
            )}
          </div>
        </div>

        {auth.loggedIn ? (
          <Tabs
            label={t('nav.library')}
            value={tab}
            onChange={(value) => updateParams({ tab: value === 'mine' ? 'mine' : undefined })}
            tabs={[
              { value: 'public', label: t('library.tab.public') },
              { value: 'mine', label: t('library.tab.mine') },
            ]}
          />
        ) : null}

        <div className="toolbar">
          <div className="search">
            <input
              className="input"
              type="search"
              value={keyword}
              placeholder={t('library.searchPlaceholder')}
              aria-label={t('library.searchPlaceholder')}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="toolbar__group">
            <label className="small muted" htmlFor="library-type">
              {t('texture.type')}
            </label>
            <select
              id="library-type"
              className="select"
              style={{ width: 132 }}
              value={type === undefined ? '' : String(type)}
              onChange={(event) => updateParams({ type: event.target.value || undefined })}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar__group">
            <label className="small muted" htmlFor="library-sort">
              {t('library.sortLabel')}
            </label>
            <select
              id="library-sort"
              className="select"
              style={{ width: 132 }}
              value={sort}
              onChange={(event) =>
                updateParams({ sort: event.target.value === 'newest' ? undefined : event.target.value })
              }
            >
              <option value="newest">{t('library.sort.newest')}</option>
              <option value="oldest">{t('library.sort.oldest')}</option>
              <option value="name">{t('library.sort.name')}</option>
            </select>
          </div>
          <div className="toolbar__spacer" />
          <span className="small muted">{t('library.count', { total })}</span>
        </div>

        {tab === 'mine' ? <Notice>{t('texture.privateNotice')}</Notice> : null}

        {list.loading ? (
          <div className="cards">
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} height={188} />
            ))}
          </div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : items.length === 0 ? (
          <EmptyState title={t('library.empty')} text={t('library.emptyHint')} />
        ) : (
          <div className="cards">
            {items.map((texture) => (
              <TextureCard key={texture.id} texture={texture} />
            ))}
          </div>
        )}

        <Pagination
          offset={offset}
          limit={list.data?.meta.limit ?? PAGE_SIZE}
          total={total}
          onChange={(next) => updateParams({ offset: String(next) }, false)}
        />
      </div>
    </div>
  )
}
