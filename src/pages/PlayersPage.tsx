import { useEffect, useState, type FormEvent } from 'react'
import * as api from '../api/players'
import { errorMessage } from '../api/client'
import type { Player, SiteSettings } from '../api/types'
import { shortHash } from '../lib/format'
import { Button, Dialog, Field, Notice, EmptyState } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './PlayersPage.module.css'
import { SkinViewer } from '../components/SkinViewer'
type Edit = { kind: 'rename' | 'clear' | 'delete'; player: Player }
const labels = {
  rename: 'players.rename',
  clear: 'players.clear',
  delete: 'players.delete',
} as const
const helps = {
  rename: 'players.renameHelp',
  clear: 'players.clearHelp',
  delete: 'players.deleteHelp',
} as const
export function PlayersPage({ site }: { site: SiteSettings | null }) {
  const [players, setPlayers] = useState<Player[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [version, setVersion] = useState(0),
    [edit, setEdit] = useState<Edit | null>(null),
    [creating, setCreating] = useState(false),
    [selectedId, setSelectedId] = useState(''),
    [search, setSearch] = useState('')
  const selected = players.find((player) => player.id === selectedId)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api
      .listPlayers(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPlayers(result)
          setSelectedId((current) =>
            result.some((player) => player.id === current) ? current : (result[0]?.id ?? ''),
          )
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [version])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget,
      name = String(new FormData(form).get('name') ?? '')
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (!edit) await api.createPlayer(name)
      else if (edit.kind === 'rename') await api.renamePlayer(edit.player.id, name)
      else if (edit.kind === 'delete') await api.deletePlayer(edit.player.id)
      else await api.setPlayerTextures(edit.player.id, { skin: '', cape: '' })
      setEdit(null)
      setCreating(false)
      form.reset()
      setMessage(t('players.updated'))
      setVersion((value) => value + 1)
    } catch (cause) {
      setError(errorMessage(cause))
      form.querySelector('input')?.focus()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack">
      <div className="page-heading">
        <h1>{t('players.title')}</h1>
      </div>
      {error && (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={() => setVersion((value) => value + 1)}>
            {t('common.retry')}
          </Button>
        </Notice>
      )}
      {message && <Notice tone="success">{message}</Notice>}
      <div className={styles.columns}>
        <section className={`panel ${styles.card}`}>
          <header className={styles.header}>
            <Field label={t('players.search')}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('players.searchHelp')}
              />
            </Field>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('account.id')}</th>
                  <th>{t('players.name')}</th>
                  <th>{t('players.operations')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="skeleton" aria-busy="true">
                        {t('players.loading')}
                      </div>
                    </td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState title={t('players.empty')} description={t('players.emptyHelp')} />
                    </td>
                  </tr>
                ) : (
                  players
                    .filter((player) => player.name.toLowerCase().includes(search.toLowerCase()))
                    .map((player) => (
                      <tr
                        key={player.id}
                        className={selectedId === player.id ? styles.selected : ''}
                      >
                        <td title={player.id}>
                          <code>{shortHash(player.id)}</code>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.select}
                            onClick={() => setSelectedId(player.id)}
                            aria-pressed={selectedId === player.id}
                          >
                            {player.name}
                          </button>
                          <button
                            type="button"
                            className={styles.select}
                            onClick={() => setEdit({ kind: 'rename', player })}
                            aria-label={t('players.rename')}
                          >
                            ✎
                          </button>
                        </td>
                        <td>
                          <div className="actions">
                            <Button
                              variant="secondary"
                              onClick={() => setEdit({ kind: 'clear', player })}
                            >
                              {t('players.clear')}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => setEdit({ kind: 'delete', player })}
                            >
                              {t('players.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.footer}>
            <Button
              disabled={busy || !site || players.length >= site.maxPlayers}
              onClick={() => setCreating(true)}
            >
              ＋ {t('players.create')}
            </Button>
            <small>
              {site
                ? t('ops.playerLimit', { max: site.maxPlayers, cost: site.playerCost })
                : t('ops.loading')}
            </small>
          </footer>
        </section>
        <div className="stack">
          <SkinViewer name={selected?.name}>
            <a href="#/user/closet">{t('players.openCloset')}</a>
          </SkinViewer>
          <section className={`panel ${styles.card}`}>
            <header className={styles.header}>
              <h2>{t('players.usage')}</h2>
            </header>
            <div className={`${styles.body} stack`}>
              <p>{t('players.usageHelp')}</p>
              <a href="#/skinlib">{t('players.library')}</a>
              {selected && (
                <>
                  <Field label={t('players.name')}>
                    <input readOnly value={selected.name} />
                  </Field>
                  <Field label={t('account.id')}>
                    <input readOnly value={selected.id} />
                  </Field>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      <Dialog
        open={creating || edit !== null}
        onClose={() => {
          if (!busy) {
            setEdit(null)
            setCreating(false)
          }
        }}
        title={creating ? t('players.create') : edit ? t(labels[edit.kind]) : ''}
      >
        <form className="stack" onSubmit={submit}>
          <p>{edit?.player.name}</p>
          <p>{creating ? t('auth.nameHelp') : edit && t(helps[edit.kind])}</p>
          {error && <Notice tone="error">{error}</Notice>}
          {(creating || edit?.kind === 'rename') && (
            <Field label={t('players.name')}>
              <input
                key={edit?.player.id ?? 'new'}
                name="name"
                defaultValue={edit?.player.name ?? ''}
                pattern="[A-Za-z0-9_]{3,16}"
                maxLength={16}
                required
              />
            </Field>
          )}
          <div className="actions">
            <Button disabled={busy} variant={edit?.kind === 'delete' ? 'danger' : 'primary'}>
              {busy
                ? t('common.working')
                : creating
                  ? t('players.create')
                  : edit
                    ? t(labels[edit.kind])
                    : ''}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEdit(null)
                setCreating(false)
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
