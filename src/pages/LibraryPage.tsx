import { useMemo, useState } from 'react'
import { navigate, useRoute, useQueryParam } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { textureApi } from '../api/resources'
import { TextureType } from '../api/enums'
import { useAuth } from '../lib/auth'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureCard } from '../components/TextureCard'
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
  SkeletonGrid,
  Tabs,
  TextInput,
} from '../components/ui'
import { SearchIcon } from '../components/icons'

const LIMIT = 12

type Filter = 'all' | '0' | '1' | '2' | 'mine'
type Sort = 'newest' | 'oldest' | 'name'

function parseFilter(value: string, mine: boolean): Filter {
  if (mine) return 'mine'
  return value === '0' || value === '1' || value === '2' ? (value as Filter) : 'all'
}

function parseSort(value: string): Sort {
  return value === 'oldest' || value === 'name' ? value : 'newest'
}

export function LibraryPage() {
  const route = useRoute()
  const { status } = useAuth()
  const mine = useQueryParam(route, 'scope') === 'mine' && status === 'authenticated'
  const filter = parseFilter(useQueryParam(route, 'type'), mine)
  const sort = parseSort(useQueryParam(route, 'sort'))
  const offset = Number.parseInt(useQueryParam(route, 'offset') || '0', 10) || 0
  const appliedQuery = useQueryParam(route, 'q')
  const [draft, setDraft] = useState(appliedQuery)

  const query = useMemo(
    () => ({
      q: appliedQuery || undefined,
      type: filter === 'all' || filter === 'mine' ? undefined : Number(filter),
      sort,
      offset,
      limit: LIMIT,
    }),
    [appliedQuery, filter, sort, offset],
  )

  const list = useAsync(
    (signal) => (filter === 'mine' ? textureApi.mine(query, signal) : textureApi.list(query, signal)),
    [query, filter],
  )

  const writeParams = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(route.search)
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '' || value === 'all') next.delete(key)
      else next.set(key, String(value))
    }
    const search = next.toString()
    navigate(`/library${search ? `?${search}` : ''}`, { replace: true })
  }

  const tabs = [
    { value: 'all', label: t('library.filterAll') },
    { value: String(TextureType.Steve), label: t('library.modelSteve') },
    { value: String(TextureType.Alex), label: t('library.modelAlex') },
    { value: String(TextureType.Cape), label: t('library.typeCape') },
  ]
  if (status === 'authenticated') tabs.push({ value: 'mine', label: t('library.mine') })

  return (
    <>
      <PageHeader title={t('library.title')} subtitle={t('library.subtitle')} />

      <Tabs
        label={t('library.title')}
        items={tabs}
        value={filter}
        onChange={(value) =>
          writeParams(
            value === 'mine'
              ? { scope: 'mine', type: undefined, offset: undefined }
              : { scope: undefined, type: value === 'all' ? undefined : value, offset: undefined },
          )
        }
      />

      <div className="toolbar">
        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            writeParams({ q: draft.trim() || undefined, offset: undefined })
          }}
        >
          <TextInput
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('library.search')}
            aria-label={t('library.search')}
            inputMode="search"
          />
          <Button type="submit" aria-label={t('library.searchAction')}>
            <SearchIcon /> {t('library.searchAction')}
          </Button>
        </form>
        <Select
          aria-label={t('library.sort')}
          value={sort}
          onChange={(event) => writeParams({ sort: event.target.value, offset: undefined })}
          style={{ width: 160 }}
        >
          <option value="newest">{t('library.sortNewest')}</option>
          <option value="oldest">{t('library.sortOldest')}</option>
          <option value="name">{t('library.sortName')}</option>
        </Select>
      </div>

      {list.loading ? <SkeletonGrid count={LIMIT} /> : null}
      {list.error ? <ErrorState message={t('common.errorGeneric')} onRetry={list.reload} /> : null}
      {!list.loading && !list.error && list.data ? (
        list.data.items.length === 0 ? (
          <EmptyState
            title={
              filter === 'mine'
                ? t('library.mineEmpty')
                : appliedQuery || filter !== 'all'
                  ? t('library.empty')
                  : t('library.emptyAnonymous')
            }
          />
        ) : (
          <>
            <div className="texture-grid">
              {list.data.items.map((texture) => (
                <TextureCard key={texture.id} texture={texture} />
              ))}
            </div>
            <Pagination
              offset={offset}
              limit={LIMIT}
              total={list.data.total}
              onChange={(next) => writeParams({ offset: next === 0 ? undefined : next })}
            />
          </>
        )
      ) : null}
    </>
  )
}
