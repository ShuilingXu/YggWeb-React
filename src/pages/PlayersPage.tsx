import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { TEXTURE_TYPE } from '../api/enums'
import {
  bindPlayerTextures,
  createPlayer,
  fetchAppearance,
  fetchCloset,
  fetchPlayers,
  removePlayer,
  renamePlayer,
} from '../api/resources'
import type { Appearance, Profile, Texture } from '../api/types'
import { useAuth } from '../components/AuthProvider'
import { CharacterViewer } from '../components/CharacterViewer'
import { TextureImage } from '../components/TextureImage'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Notice,
  Skeleton,
  useToast,
} from '../components/ui'
import { t } from '../i18n/zh-CN'
import { shortId } from '../lib/format'
import { href } from '../lib/router'
import { useAsync, useSubmit } from '../lib/useAsync'
import { isValidPlayerName } from '../lib/validate'

const MAX_PLAYERS = 20

export function PlayersPage() {
  const auth = useAuth()
  const { notify } = useToast()
  const players = useAsync((signal) => fetchPlayers(signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })
  const closet = useAsync((signal) => fetchCloset({ limit: 100 }, signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })
  const [appearances, setAppearances] = useState<Record<string, Appearance>>({})
  const [picker, setPicker] = useState<{ player: Profile; kind: 'skin' | 'cape' } | null>(null)
  const [renameTarget, setRenameTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  useEffect(() => {
    const list = players.data
    if (!list || list.length === 0) {
      setAppearances({})
      return
    }
    const controller = new AbortController()
    let alive = true
    void Promise.all(
      list.map(async (player) => {
        try {
          return [player.id, await fetchAppearance(player.id, controller.signal)] as const
        } catch {
          return [player.id, { skin: null, cape: null }] as const
        }
      }),
    ).then((entries) => {
      if (alive) setAppearances(Object.fromEntries(entries))
    })
    return () => {
      alive = false
      controller.abort()
    }
  }, [players.data])

  async function refreshAppearance(playerId: string): Promise<void> {
    try {
      const appearance = await fetchAppearance(playerId)
      setAppearances((current) => ({ ...current, [playerId]: appearance }))
    } catch {
      // 外观反查失败时保留旧预览，不阻断穿戴结果提示。
    }
  }

  async function bind(player: Profile, kind: 'skin' | 'cape', texture: Texture | null): Promise<void> {
    try {
      const value = texture?.id ?? ''
      await bindPlayerTextures(player.id, kind === 'skin' ? { skin: value } : { cape: value })
      notify('ok', t('players.bindSuccess'))
      await refreshAppearance(player.id)
      setPicker(null)
    } catch (error) {
      notify('error', errorMessage(error))
    }
  }

  if (!auth.loggedIn) return null

  const list = players.data ?? []
  const closetItems = closet.data?.items ?? []
  const closetByHash = new Map(closetItems.map((item) => [item.hash, item]))
  const atLimit = list.length >= MAX_PLAYERS

  function textureLabel(hash: string | undefined): string {
    if (!hash) return t('players.none')
    const item = closetByHash.get(hash)
    return item ? item.itemName || item.name : shortId(hash, 10)
  }

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t('players.title')}</h1>
            <p className="page__sub">{t('players.sub')}</p>
          </div>
        </div>

        <CreatePlayerForm
          disabled={atLimit}
          onCreated={() => {
            notify('ok', t('players.created'))
            players.reload()
          }}
        />
        {atLimit ? <Notice tone="warn">{t('players.limit')}</Notice> : null}

        {players.loading ? (
          <div className="player-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} height={320} />
            ))}
          </div>
        ) : players.error ? (
          <ErrorState message={players.error} onRetry={players.reload} />
        ) : list.length === 0 ? (
          <EmptyState title={t('players.empty')} text={t('players.emptyHint')} />
        ) : (
          <div className="player-grid">
            {list.map((player) => {
              const appearance = appearances[player.id]
              return (
                <article className="pcard" key={player.id}>
                  <div className="pcard__art">
                    <CharacterViewer
                      skinUrl={appearance?.skin?.url}
                      capeUrl={appearance?.cape?.url}
                      model={appearance?.skin?.model ?? 'default'}
                      alt={player.name}
                      lazy
                      compact
                    />
                  </div>
                  <div className="pcard__body">
                    <div className="pcard__name">
                      <span>{player.name}</span>
                      <span className="small dim mono">{shortId(player.id)}</span>
                    </div>
                    <div className="stack" style={{ gap: 4 }}>
                      <span className="small muted">
                        {t('players.skin')}：{textureLabel(appearance?.skin?.url.split('/').pop())}
                      </span>
                      <span className="small muted">
                        {t('players.cape')}：{textureLabel(appearance?.cape?.url.split('/').pop())}
                      </span>
                    </div>
                    <div className="pcard__actions">
                      <Button size="sm" onClick={() => setPicker({ player, kind: 'skin' })}>
                        {t('players.skin')}
                      </Button>
                      <Button size="sm" onClick={() => setPicker({ player, kind: 'cape' })}>
                        {t('players.cape')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenameTarget(player)}>
                        {t('players.rename')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(player)}>
                        {t('players.delete')}
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {picker ? (
        <PickerDialog
          kind={picker.kind}
          items={closetItems.filter((item) =>
            picker.kind === 'cape' ? item.type === TEXTURE_TYPE.CAPE : item.type !== TEXTURE_TYPE.CAPE,
          )}
          currentHash={
            picker.kind === 'skin'
              ? appearances[picker.player.id]?.skin?.url.split('/').pop()
              : appearances[picker.player.id]?.cape?.url.split('/').pop()
          }
          onClear={() => void bind(picker.player, picker.kind, null)}
          onPick={(texture) => void bind(picker.player, picker.kind, texture)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {renameTarget ? (
        <RenameDialog
          player={renameTarget}
          onClose={() => setRenameTarget(null)}
          onDone={() => {
            setRenameTarget(null)
            notify('ok', t('players.renamed'))
            players.reload()
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeletePlayerDialog
          player={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={() => {
            setDeleteTarget(null)
            notify('ok', t('players.removed'))
            players.reload()
          }}
        />
      ) : null}
    </div>
  )
}

function CreatePlayerForm({
  disabled,
  onCreated,
}: {
  disabled: boolean
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmit()

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValidPlayerName(name.trim())) {
          setError(t('players.nameRequired'))
          return
        }
        setError(null)
        void submit.run(async () => {
          await createPlayer(name.trim())
          setName('')
          onCreated()
        })
      }}
    >
      <div className="panel__head">
        <span className="panel__title">{t('players.add')}</span>
      </div>
      <div className="panel__body row" style={{ alignItems: 'flex-end' }}>
        <div className="grow">
          <Field
            label={t('players.name')}
            htmlFor="new-player"
            hint={t('players.nameHint')}
            error={error}
            required
          >
            <input
              id="new-player"
              className="input"
              value={name}
              maxLength={16}
              disabled={disabled}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" variant="primary" disabled={disabled || submit.busy}>
          {submit.busy ? t('common.submitting') : t('players.add')}
        </Button>
      </div>
      {submit.error ? (
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <Notice tone="danger">{submit.error}</Notice>
        </div>
      ) : null}
    </form>
  )
}

function PickerDialog({
  kind,
  items,
  currentHash,
  onPick,
  onClear,
  onClose,
}: {
  kind: 'skin' | 'cape'
  items: Texture[]
  currentHash: string | undefined
  onPick: (texture: Texture) => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <Dialog
      open
      title={kind === 'skin' ? t('players.pickSkin') : t('players.pickCape')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={onClear} disabled={!currentHash}>
            {kind === 'skin' ? t('players.clearSkin') : t('players.clearCape')}
          </Button>
        </>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title={t('players.pickEmpty')}
          text={t('players.pickEmptyHint', {
            type: kind === 'skin' ? t('nav.library') : t('enum.textureType.2'),
          })}
        >
          <a className="mc-btn" href={href('/skinlib')}>
            {t('nav.library')}
          </a>
        </EmptyState>
      ) : (
        <div className="picker">
          {items.map((texture) => (
            <button
              key={texture.id}
              type="button"
              className="picker__item"
              aria-pressed={texture.hash === currentHash}
              onClick={() => onPick(texture)}
            >
              <TextureImage
                uuid={texture.id}
                alt={texture.itemName || texture.name}
                size={128}
                authed={texture.public === 0}
                state={texture.state}
              />
              <span className="picker__name">{texture.itemName || texture.name}</span>
            </button>
          ))}
        </div>
      )}
      <span className="small dim">{t('players.pickHelp')}</span>
    </Dialog>
  )
}

function RenameDialog({
  player,
  onClose,
  onDone,
}: {
  player: Profile
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(player.name)
  const error = isValidPlayerName(name.trim()) ? null : t('players.nameRequired')
  const submit = useSubmit()

  return (
    <Dialog
      open
      title={t('players.rename')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            disabled={submit.busy || Boolean(error)}
            onClick={() =>
              void submit.run(async () => {
                await renamePlayer(player.id, name.trim())
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('players.name')} htmlFor="rename-player" hint={t('players.nameHint')} error={error}>
        <input
          id="rename-player"
          className="input"
          value={name}
          maxLength={16}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}

function DeletePlayerDialog({
  player,
  onClose,
  onDone,
}: {
  player: Profile
  onClose: () => void
  onDone: () => void
}) {
  const submit = useSubmit()
  return (
    <Dialog
      open
      title={t('players.delete')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            disabled={submit.busy}
            onClick={() =>
              void submit.run(async () => {
                await removePlayer(player.id)
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.delete')}
          </Button>
        </>
      }
    >
      <p>{t('players.deleteConfirm', { name: player.name })}</p>
      <div className="row">
        <Badge tone="muted">{t('players.uuid')}</Badge>
        <span className="mono">{player.id}</span>
      </div>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}
