import { useState } from 'react'
import { ApiError } from '../api/client'
import { playerApi, textureApi } from '../api/resources'
import { TextureType } from '../api/enums'
import type { ProfileAppearance } from '../api/types'
import { useAuth } from '../lib/auth'
import { Link } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { useSite } from '../components/SiteProvider'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureImage } from '../components/TextureImage'
import {
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Select,
  Skeleton,
  TextInput,
  useToast,
} from '../components/ui'

type PlayerRow = { id: string; name: string; appearance: ProfileAppearance }

const playerPattern = /^[A-Za-z0-9_]{3,16}$/

export function PlayersPage() {
  const { status } = useAuth()
  const site = useSite()
  const toast = useToast()
  const authed = status === 'authenticated'

  const players = useAsync<PlayerRow[]>(async (signal) => {
    if (!authed) return []
    const list = await playerApi.list(signal)
    return Promise.all(
      list.map(async (player) => ({ ...player, appearance: await playerApi.appearance(player.id) })),
    )
  }, [authed])

  const closet = useAsync(
    async (signal) =>
      authed ? textureApi.closet({ limit: 100 }, signal) : { items: [], total: 0, nextOffset: null },
    [authed],
  )

  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [renameTarget, setRenameTarget] = useState<PlayerRow | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<PlayerRow | null>(null)
  const [bindTarget, setBindTarget] = useState<PlayerRow | null>(null)
  const [bindSlot, setBindSlot] = useState<'skin' | 'cape'>('skin')
  const [bindValue, setBindValue] = useState('')

  const reloadAll = () => {
    players.reload()
    closet.reload()
  }

  const run = async (action: () => Promise<void>, message: string, close?: () => void) => {
    setBusy(true)
    try {
      await action()
      toast.push(message, 'success')
      reloadAll()
      close?.()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const maxPlayers = site.site?.maxPlayers
  const atLimit = maxPlayers !== undefined && (players.data?.length ?? 0) >= maxPlayers
  const playerCost = site.site?.playerCost ?? 0

  if (!authed) {
    return (
      <>
        <PageHeader title={t('players.title')} subtitle={t('players.subtitle')} />
        <div className="notice">
          {t('upload.needLogin')} <Link to={`/login?next=${encodeURIComponent('/players')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  const skinOptions = (closet.data?.items ?? []).filter((item) =>
    bindSlot === 'cape' ? item.type === TextureType.Cape : item.type !== TextureType.Cape,
  )

  return (
    <>
      <PageHeader
        title={t('players.title')}
        subtitle={t('players.subtitle')}
        actions={
          <Button variant="primary" size="sm" disabled={atLimit} onClick={() => setCreateOpen(true)}>
            {t('players.create')}
          </Button>
        }
      />
      {playerCost > 0 ? (
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          {t('players.cost', { cost: playerCost })}
        </p>
      ) : null}
      {atLimit && maxPlayers !== undefined ? (
        <div className="notice" role="status">{t('players.limit', { max: maxPlayers })}</div>
      ) : null}

      {players.loading ? (
        <div className="order-list" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div className="order-card" key={index}>
              <Skeleton height={56} width={56} />
              <div style={{ flex: 1 }}>
                <Skeleton height={14} width="60%" />
                <div style={{ marginTop: 8 }}>
                  <Skeleton height={12} width="40%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {players.error ? <ErrorState message={t('common.errorGeneric')} onRetry={players.reload} /> : null}
      {!players.loading && !players.error && players.data ? (
        players.data.length === 0 ? (
          <EmptyState
            title={t('players.empty')}
            action={
              <Button variant="primary" disabled={atLimit} onClick={() => setCreateOpen(true)}>
                {t('players.create')}
              </Button>
            }
          />
        ) : (
          <div className="order-list">
            {players.data.map((player) => (
              <article className="order-card" key={player.id}>
                <div className="order-card__thumb checker">
                  {player.appearance.skin ? (
                    <TextureImage src={player.appearance.skin} alt={player.name} checker={false} />
                  ) : (
                    <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      —
                    </span>
                  )}
                </div>
                <div className="order-card__body">
                  <div className="order-card__title truncate">{player.name}</div>
                  <div className="order-card__meta mono">{player.id}</div>
                  <div className="row" style={{ marginTop: 4, gap: 'var(--space-2)' }}>
                    <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {t('players.currentSkin')}: {player.appearance.skin ? '✓' : '—'}
                    </span>
                    <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {t('players.currentCape')}: {player.appearance.cape ? '✓' : '—'}
                    </span>
                  </div>
                </div>
                <div className="order-card__actions">
                  <Button
                    size="sm"
                    onClick={() => {
                      setBindTarget(player)
                      setBindSlot('skin')
                      setBindValue('')
                    }}
                  >
                    {t('players.bind')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRenameTarget(player)
                      setRenameDraft(player.name)
                    }}
                  >
                    {t('players.rename')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(player)}>
                    {t('players.delete')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      <Dialog
        open={createOpen}
        title={t('players.createTitle')}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => {
                if (!playerPattern.test(createName.trim())) {
                  toast.push(t('auth.invalidPlayerName'), 'error')
                  return
                }
                void run(() => playerApi.create(createName.trim()), t('players.created'), () => {
                  setCreateOpen(false)
                  setCreateName('')
                })
              }}
            >
              {t('players.create')}
            </Button>
          </>
        }
      >
        <Field
          label={t('auth.playerName')}
          htmlFor="player-create"
          hint={playerCost > 0 ? `${t('players.createHint')} ${t('players.cost', { cost: playerCost })}` : t('players.createHint')}
        >
          <TextInput id="player-create" value={createName} onChange={(event) => setCreateName(event.target.value)} />
        </Field>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        title={t('players.renameTitle')}
        onClose={() => setRenameTarget(null)}
        footer={
          <>
            <Button onClick={() => setRenameTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => {
                if (!renameTarget) return
                if (!playerPattern.test(renameDraft.trim())) {
                  toast.push(t('auth.invalidPlayerName'), 'error')
                  return
                }
                void run(
                  () => playerApi.rename(renameTarget.id, renameDraft.trim()),
                  t('players.renamed'),
                  () => setRenameTarget(null),
                )
              }}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Field label={t('auth.playerName')} htmlFor="player-rename" hint={t('players.renameHint')}>
          <TextInput id="player-rename" value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} />
        </Field>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('players.deleteTitle')}
        body={t('players.deleteBody')}
        confirmLabel={t('players.delete')}
        danger
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          void run(() => playerApi.remove(deleteTarget.id), t('players.deleted'), () => setDeleteTarget(null))
        }}
      />

      <Dialog
        open={bindTarget !== null}
        title={t('players.bindTitle', { name: bindTarget?.name ?? '' })}
        onClose={() => setBindTarget(null)}
        footer={
          <>
            <Button onClick={() => setBindTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => {
                if (!bindTarget) return
                const payload = bindSlot === 'skin' ? { skin: bindValue } : { cape: bindValue }
                void run(() => playerApi.bind(bindTarget.id, payload), t('players.bindSuccess'), () => setBindTarget(null))
              }}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label={t('texture.type')} htmlFor="bind-slot">
            <Select
              id="bind-slot"
              value={bindSlot}
              onChange={(event) => {
                setBindSlot(event.target.value as 'skin' | 'cape')
                setBindValue('')
              }}
            >
              <option value="skin">{t('players.bindSkin')}</option>
              <option value="cape">{t('players.bindCape')}</option>
            </Select>
          </Field>
          <Field label={t('closet.title')} htmlFor="bind-value" hint={skinOptions.length === 0 ? t('players.bindEmpty') : undefined}>
            <Select id="bind-value" value={bindValue} onChange={(event) => setBindValue(event.target.value)}>
              <option value="">{t('players.none')}</option>
              {skinOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName ?? item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </>
  )
}
