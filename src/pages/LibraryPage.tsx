import { useEffect, useState, type FormEvent } from 'react'
import { listTextures, listMyTextures } from '../api/textures'
import { listCloset, saveClosetItem, removeClosetItem } from '../api/closet'
import { listPlayers, setPlayerTextures } from '../api/players'
import type { Account, Page, Texture, Player } from '../api/types'
import { errorMessage } from '../api/client'
import { readTextureQuery } from '../lib/url'
import { TextureCard } from '../components/TextureCard'
import { ClosetPreview } from './ClosetPreview'
import { Button, EmptyState, Notice, Pagination, Dialog } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './LibraryPage.module.css'
import { LibraryToolbar } from './LibraryToolbar'
export function LibraryPage({
  mode = 'public',
  search,
  account = null,
}: {
  mode?: 'public' | 'mine' | 'closet'
  search: string
  account?: Account | null
}) {
  const [data, setData] = useState<Page<Texture> | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState('')
  const [remove, setRemove] = useState<Texture | null>(null)
  const [skin, setSkin] = useState<Texture | null>(null)
  const [cape, setCape] = useState<Texture | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const query = readTextureQuery(new URLSearchParams(search))
  const offset = query.offset ?? 0
  const route = mode === 'mine' ? '/user/textures' : mode === 'closet' ? '/user/closet' : '/skinlib'
  useEffect(() => {
    const c = new AbortController()
    setData(null)
    setError('')
    const load = mode === 'mine' ? listMyTextures : mode === 'closet' ? listCloset : listTextures
    load(readTextureQuery(new URLSearchParams(search)), c.signal)
      .then((value) => {
        if (!c.signal.aborted) setData(value)
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(errorMessage(e))
      })
    return () => c.abort()
  }, [mode, search, retry])
  useEffect(() => {
    const c = new AbortController()
    setLiked(new Set())
    if (!account) return () => c.abort()
    async function load() {
      const ids = new Set<string>()
      let offset = 0
      do {
        const page = await listCloset({ limit: 100, offset }, c.signal)
        page.items.forEach((item) => ids.add(item.id))
        offset += page.limit
        if (offset >= page.total) break
      } while (!c.signal.aborted)
      if (!c.signal.aborted) setLiked(ids)
    }
    load().catch((e) => {
      if (!c.signal.aborted) setError(errorMessage(e))
    })
    return () => c.abort()
  }, [account?.id])
  useEffect(() => {
    const c = new AbortController()
    setPlayers([])
    if (account && mode === 'closet')
      listPlayers(c.signal)
        .then((value) => {
          if (!c.signal.aborted) setPlayers(value)
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(errorMessage(e))
        })
    return () => c.abort()
  }, [account?.id, mode])
  function change(params: URLSearchParams) {
    location.hash = route + (params.size ? '?' + params : '')
  }
  function filter(key: string, value: string) {
    const params = new URLSearchParams(search)
    params.delete('offset')
    if (value) params.set(key, value)
    else params.delete(key)
    change(params)
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const params = new URLSearchParams(search)
    params.delete('offset')
    for (const key of ['q', 'type', 'uploader']) {
      const value = String(form.get(key) ?? '')
      if (value) params.set(key, value)
      else params.delete(key)
    }
    change(params)
  }
  async function toggle(texture: Texture) {
    if (!account) {
      location.hash = '/auth/login'
      return
    }
    if (liked.has(texture.id)) {
      setRemove(texture)
      return
    }
    setBusy(texture.id)
    setError('')
    try {
      await saveClosetItem(texture.id, texture.name)
      setLiked((previous) => new Set([...previous, texture.id]))
      setMessage(t('texture.collected'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy('')
    }
  }
  async function removeSelected() {
    if (!remove) return
    setBusy(remove.id)
    setError('')
    try {
      await removeClosetItem(remove.id)
      setLiked((previous) => {
        const next = new Set(previous)
        next.delete(remove.id)
        return next
      })
      setRemove(null)
      setMessage(t('bs.removed'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy('')
    }
  }
  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const id = String(new FormData(e.currentTarget).get('player') ?? '')
    if (!id || (!skin && !cape)) return
    setBusy('apply')
    setError('')
    try {
      await setPlayerTextures(id, {
        ...(skin ? { skin: skin.id } : {}),
        ...(cape ? { cape: cape.id } : {}),
      })
      setMessage(t('texture.worn'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy('')
    }
  }
  const title = t(mode === 'mine' ? 'nav.mine' : mode === 'closet' ? 'nav.closet' : 'library.title')
  return (
    <>
      <header className={styles.heading}>
        <h1>{title}</h1>
        {mode === 'public' && (
          <span>
            {query.uploader ? t('bs.fromUploader', { id: query.uploader }) : t('bs.allUsers')}
          </span>
        )}
      </header>
      {message && <Notice tone="success">{message}</Notice>}
      {error && (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={() => setRetry((v) => v + 1)}>
            {t('common.retry')}
          </Button>
        </Notice>
      )}
      <div className={mode === 'closet' ? styles.closetLayout : undefined}>
        <section className={styles.box}>
          <LibraryToolbar
            mode={mode}
            search={search}
            query={query}
            account={account}
            route={route}
            submit={submit}
            filter={filter}
          />
          <div className={styles.body}>
            {error && !data ? null : !data ? (
              <div className={styles.grid} aria-label={t('common.loading')}>
                {[0, 1, 2, 3].map((value) => (
                  <div className={styles.skeleton} key={value} />
                ))}
              </div>
            ) : data.items.length ? (
              <div className={styles.grid}>
                {data.items.map((texture) => (
                  <TextureCard
                    key={texture.id}
                    texture={texture}
                    liked={liked.has(texture.id)}
                    busy={busy === texture.id}
                    onToggle={mode === 'closet' ? undefined : toggle}
                    onSelect={
                      mode === 'closet'
                        ? (value) => (value.type === 2 ? setCape(value) : setSkin(value))
                        : undefined
                    }
                    selected={skin?.id === texture.id || cape?.id === texture.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('common.empty')}
                description={t('common.emptyHelp')}
                action={<a href="#/skinlib">{t('nav.library')}</a>}
              />
            )}
          </div>
          {data && (
            <footer className={styles.pagination}>
              <Pagination
                total={data.total}
                limit={data.limit}
                offset={offset}
                onChange={(next) => {
                  const params = new URLSearchParams(search)
                  params.set('offset', String(next))
                  change(params)
                }}
              />
            </footer>
          )}
        </section>
        {mode === 'closet' && (
          <ClosetPreview
            skin={skin}
            cape={cape}
            players={players}
            busy={!!busy}
            onApply={apply}
            onReset={() => {
              setSkin(null)
              setCape(null)
            }}
          />
        )}
      </div>
      <Dialog
        open={!!remove}
        title={t('bs.removeTitle')}
        onClose={() => {
          if (!busy) setRemove(null)
        }}
      >
        <p>{t('bs.removeHelp')}</p>
        <div className="actions">
          <Button variant="danger" disabled={!!busy} onClick={removeSelected}>
            {t('texture.removeCloset')}
          </Button>
          <Button variant="secondary" disabled={!!busy} onClick={() => setRemove(null)}>
            {t('common.cancel')}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
