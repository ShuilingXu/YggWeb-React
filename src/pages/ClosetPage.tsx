import { useState } from 'react'
import { ApiError } from '../api/client'
import { playerApi, textureApi } from '../api/resources'
import { TextureType } from '../api/enums'
import { useAuth } from '../lib/auth'
import { Link } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureCard } from '../components/TextureCard'
import { Button, Dialog, EmptyState, ErrorState, Field, Select, SkeletonGrid, TextInput, useToast } from '../components/ui'
import { StarIcon, TrashIcon } from '../components/icons'

const LIMIT = 12

export function ClosetPage() {
  const { status } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState<'all' | 'skin' | 'cape'>('all')
  const [offset, setOffset] = useState(0)
  const authed = status === 'authenticated'

  const closet = useAsync(
    async (signal) =>
      authed
        ? textureApi.closet(
            {
              offset,
              limit: LIMIT,
              type: tab === 'all' ? undefined : tab === 'skin' ? TextureType.Steve : TextureType.Cape,
            },
            signal,
          )
        : { items: [], total: 0, nextOffset: null },
    [authed, offset, tab],
  )

  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const players = useAsync(async (signal) => (authed ? playerApi.list(signal) : []), [authed])
  const [applyTarget, setApplyTarget] = useState<{ id: string; itemName: string; type: number } | null>(null)
  const [applyPlayer, setApplyPlayer] = useState('')
  const [applySlot, setApplySlot] = useState<'skin' | 'cape'>('skin')

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true)
    try {
      await action()
      toast.push(message, 'success')
      closet.reload()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!authed) {
    return (
      <>
        <PageHeader title={t('closet.title')} subtitle={t('closet.subtitle')} />
        <div className="notice">
          {t('upload.needLogin')} <Link to={`/login?next=${encodeURIComponent('/closet')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t('closet.title')}
        subtitle={t('closet.subtitle')}
        actions={
          <Link to="/library" className="btn btn--sm">
            {t('closet.emptyAction')}
          </Link>
        }
      />

      <div className="tabs" role="tablist" aria-label={t('closet.title')}>
        {(
          [
            ['all', t('library.filterAll')],
            ['skin', t('library.typeSkin')],
            ['cape', t('library.typeCape')],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className="tab"
            onClick={() => {
              setTab(value)
              setOffset(0)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {closet.loading ? <SkeletonGrid count={6} /> : null}
      {closet.error ? <ErrorState message={t('common.errorGeneric')} onRetry={closet.reload} /> : null}
      {!closet.loading && !closet.error && closet.data ? (
        closet.data.items.length === 0 ? (
          <EmptyState
            title={t('closet.empty')}
            action={
              <Link to="/library" className="btn btn--primary">
                {t('closet.emptyAction')}
              </Link>
            }
          />
        ) : (
          <>
            <div className="texture-grid">
              {closet.data.items.map((texture) => (
                <TextureCard
                  key={texture.id}
                  texture={texture}
                  actions={
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setApplyTarget({ id: texture.id, itemName: texture.itemName ?? texture.name, type: texture.type })
                          setApplySlot(texture.type === TextureType.Cape ? 'cape' : 'skin')
                          setApplyPlayer(players.data?.[0]?.id ?? '')
                        }}
                      >
                        <StarIcon /> {t('closet.apply')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRenameTarget({ id: texture.id, name: texture.itemName ?? texture.name })
                          setRenameDraft(texture.itemName ?? texture.name)
                        }}
                      >
                        {t('closet.rename')}
                      </Button>
                      <Button size="sm" variant="ghost" aria-label={t('closet.remove')} onClick={() => setRemoveTarget(texture.id)}>
                        <TrashIcon />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
            {closet.data.total > LIMIT ? (
              <div className="pagination">
                <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
                  {t('common.previous')}
                </Button>
                <span className="pagination__status">{t('library.total', { total: closet.data.total })}</span>
                <Button
                  size="sm"
                  disabled={offset + LIMIT >= closet.data.total}
                  onClick={() => setOffset(offset + LIMIT)}
                >
                  {t('common.next')}
                </Button>
              </div>
            ) : null}
          </>
        )
      ) : null}

      <Dialog
        open={renameTarget !== null}
        title={t('closet.renameTitle')}
        onClose={() => setRenameTarget(null)}
        footer={
          <>
            <Button onClick={() => setRenameTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => {
                if (!renameTarget) return
                void run(() => textureApi.addToCloset(renameTarget.id, renameDraft.trim()), t('closet.rename')).then(() =>
                  setRenameTarget(null),
                )
              }}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Field label={t('closet.itemName')} htmlFor="closet-rename">
          <TextInput id="closet-rename" value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} />
        </Field>
      </Dialog>

      <Dialog
        open={removeTarget !== null}
        title={t('closet.remove')}
        onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button onClick={() => setRemoveTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() => {
                if (!removeTarget) return
                void run(() => textureApi.removeFromCloset(removeTarget), t('closet.removeSuccess')).then(() =>
                  setRemoveTarget(null),
                )
              }}
            >
              {t('closet.remove')}
            </Button>
          </>
        }
      >
        <p>{t('closet.remove')}?</p>
      </Dialog>

      <Dialog
        open={applyTarget !== null}
        title={t('closet.applyTitle')}
        onClose={() => setApplyTarget(null)}
        footer={
          <>
            <Button onClick={() => setApplyTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!applyPlayer}
              onClick={() => {
                if (!applyTarget || !applyPlayer) return
                void run(async () => {
                  await playerApi.bind(
                    applyPlayer,
                    applySlot === 'skin' ? { skin: applyTarget.id } : { cape: applyTarget.id },
                  )
                }, t('closet.applySuccess')).then(() => setApplyTarget(null))
              }}
            >
              {t('closet.apply')}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label={t('closet.applyTitle')} htmlFor="apply-player">
            <Select id="apply-player" value={applyPlayer} onChange={(event) => setApplyPlayer(event.target.value)}>
              {(players.data ?? []).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('texture.type')} htmlFor="apply-slot" hint={t('closet.applyHint')}>
            <Select id="apply-slot" value={applySlot} onChange={(event) => setApplySlot(event.target.value as 'skin' | 'cape')}>
              <option value="skin">{t('closet.applySkin')}</option>
              <option value="cape">{t('closet.applyCape')}</option>
            </Select>
          </Field>
        </div>
      </Dialog>
    </>
  )
}
