import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/resources'
import { useAsync } from '../lib/useAsync'
import { useAuth } from '../lib/auth'
import { setQuery } from '../lib/router'
import { useTextureImages } from '../lib/useTextureImages'
import { TextureCard } from '../components/TextureCard'
import { Button, EmptyState, ErrorState, Pagination, Skeleton, Tabs } from '../components/UI'
import { Icon } from '../components/Icons'
import { t } from '../i18n/zh-CN'
import { typeLabel } from '../api/enums'

export function Library({ mode, params }: { mode: 'library' | 'closet' | 'uploads'
  params: URLSearchParams }) {
  const auth = useAuth()
  const [search, setSearch] = useState(params.get('q') || '')
  const [expanded, setExpanded] = useState(!!params.get('uploader'))
  useEffect(() => setSearch(params.get('q') || ''), [params.get('q')])
  const offset = Math.max(0, Number(params.get('offset')) || 0)
  const query = new URLSearchParams(params)
  query.set('limit', '24')
    query.set('offset', String(offset))
  const list = useAsync(signal => api.textures(mode, query.toString(), signal), [mode, query.toString(), auth.account?.id])
  const images = useTextureImages(list.value?.items)
  const change = (values: Record<string, string>) => { const next: Record<string, string> = { ...Object.fromEntries(params), offset: '0', ...values }
    Object.keys(next).forEach(key => { if (!next[key]) delete next[key] })
    setQuery('/' + mode, next) }
  const submit = (event: FormEvent) => { event.preventDefault()
    change({ q: search }) }
  return <>
    <div className="page-heading"><div><p className="eyebrow">{mode === 'library' ? t('englishLibrary') : t('englishCollection')}</p><h1 className="page-title">{t(mode)}<span className="heading-dot" /></h1><p>{t(mode === 'library' ? 'librarySubtitle' : mode === 'closet' ? 'closetSubtitle' : 'uploadsSubtitle')}</p></div>{mode !== 'library' && <a className="button button-primary" href={mode === 'closet' ? '#/library' : '#/upload'}><Icon name={mode === 'closet' ? 'search' : 'plus'} />{t(mode === 'closet' ? 'goLibrary' : 'upload')}</a>}</div>
    <section className="collection-controls"><div className="collection-top"><Tabs value={params.get('type') || ''} items={[{ value: '', label: t('all') }, ...[0, 1, 2].map(type => ({ value: String(type), label: typeLabel(type) }))]} onChange={type => change({ type })} /><span className="result-count">{list.value?.total !== null && list.value?.total !== undefined ? t('count', { count: list.value.total }) : ''}</span></div><div className="toolbar"><form className="search-form" onSubmit={submit}><Icon name="search" size={18} /><input aria-label={t('search')} placeholder={t('search')} value={search} maxLength={200} onChange={event => setSearch(event.target.value)} /><Button type="submit" variant="ghost">{t('searchAction')}</Button></form><select aria-label={t('sort')} value={params.get('sort') || 'newest'} onChange={event => change({ sort: event.target.value })}><option value="newest">{t('newest')}</option><option value="oldest">{t('oldest')}</option><option value="name">{t('byName')}</option></select><Button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><Icon name="settings" size={16} />{t('filters')}</Button></div>{expanded && <form className="extra-filters" onSubmit={event => { event.preventDefault()
      const data = new FormData(event.currentTarget)
      change({ uploader: String(data.get('uploader') || '') }) }}><input aria-label={t('uploader')} name="uploader" placeholder={t('uploader')} defaultValue={params.get('uploader') || ''} pattern="[a-fA-F0-9]{32}" /><Button type="submit">{t('searchAction')}</Button><Button type="button" onClick={() => { setSearch('')
      setQuery('/' + mode, {}) }}>{t('clear')}</Button></form>}</section>
    {list.loading ? <Skeleton /> : list.error ? <ErrorState message={list.error} retry={list.reload} /> : !list.value?.items.length ? <EmptyState title={mode === 'closet' ? t('emptyCloset') : t('empty')} text={mode === 'closet' ? t('emptyClosetText') : t('emptyText')}>{mode === 'closet' && <a className="button button-primary" href="#/library">{t('goLibrary')}</a>}</EmptyState> : <div className="texture-grid">{list.value.items.map(texture => <TextureCard key={texture.id} texture={texture} src={images.images[texture.id]} failed={images.failed[texture.id]} onError={() => images.fail(texture.id)} />)}</div>}
    {list.value && <Pagination offset={offset} limit={24} total={list.value.total} next={list.value.next} onChange={offset => change({ offset: String(offset) })} />}
    <div className="collection-foot"><span className="pixel-mini" /><span>{t('noFakeStats')}</span><span>{t('englishIdentity')}</span></div>
  </>
}
