import { useEffect, useState } from 'react'
import { TEXTURE_TYPE, textureTypeLabel, textureTypeTone } from '../api/enums'
import { fetchCloset, fetchPlayers, removeFromCloset } from '../api/resources'
import type { Texture } from '../api/types'
import { useAuth } from '../components/AuthProvider'
import { ClosetNameDialog, WearDialog } from '../components/TextureDialogs'
import { TextureImage } from '../components/TextureImage'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Notice,
  Pagination,
  Skeleton,
  useToast,
} from '../components/ui'
import { t } from '../i18n/zh-CN'
import { PAGE_SIZE } from '../lib/paging'
import { readOffset, readSearch, readType } from '../lib/query'
import { href, navigate, useRoute } from '../lib/router'
import { useAsync, useSubmit } from '../lib/useAsync'

type ClosetDialog =
  | { kind: 'wear'; texture: Texture }
  | { kind: 'rename'; texture: Texture }
  | { kind: 'remove'; texture: Texture }
  | null

const TYPE_OPTIONS = [
  { value: '', label: t('common.all') },
  { value: String(TEXTURE_TYPE.STEVE), label: textureTypeLabel(TEXTURE_TYPE.STEVE) },
  { value: String(TEXTURE_TYPE.ALEX), label: textureTypeLabel(TEXTURE_TYPE.ALEX) },
  { value: String(TEXTURE_TYPE.CAPE), label: textureTypeLabel(TEXTURE_TYPE.CAPE) },
]

export function ClosetPage() {
  const auth = useAuth()
  const route = useRoute()
  const { notify } = useToast()
  const query = route.query
  const type = readType(query)
  const offset = readOffset(query)
  const search = readSearch(query)
  const [keyword, setKeyword] = useState(search)
  const [dialog, setDialog] = useState<ClosetDialog>(null)

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
    navigate(`/closet${text ? `?${text}` : ''}`, { replace: true })
  }

  useEffect(() => {
    if (keyword === search) return
    const timer = window.setTimeout(() => updateParams({ q: keyword || undefined }), 300)
    return () => window.clearTimeout(timer)
  }, [keyword, search])

  const list = useAsync(
    (signal) =>
      fetchCloset(
        { offset, limit: PAGE_SIZE, q: search || undefined, type, sort: 'newest' },
        signal,
      ),
    [offset, search, type, auth.loggedIn],
    { enabled: auth.loggedIn },
  )
  const players = useAsync((signal) => fetchPlayers(signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })

  if (!auth.loggedIn) return null

  const items = list.data?.items ?? []
  const playerList = players.data ?? []

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t('closet.title')}</h1>
            <p className="page__sub">{t('closet.sub')}</p>
          </div>
          <div className="page__actions">
            <a className="mc-btn" href={href('/skinlib')}>
              {t('nav.library')}
            </a>
          </div>
        </div>

        {playerList.length === 0 ? <Notice tone="warn">{t('texture.wear.noPlayers')}</Notice> : null}

        <div className="toolbar">
          <div className="search">
            <input
              className="input"
              type="search"
              value={keyword}
              placeholder={t('closet.searchPlaceholder')}
              aria-label={t('closet.searchPlaceholder')}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="toolbar__group">
            <label className="small muted" htmlFor="closet-type">
              {t('texture.type')}
            </label>
            <select
              id="closet-type"
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
          <div className="toolbar__spacer" />
          <span className="small muted">
            {t('common.total', { total: list.data?.meta.total ?? 0 })}
          </span>
        </div>

        {list.loading ? (
          <div className="cards cards--wide">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={120} />
            ))}
          </div>
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : items.length === 0 ? (
          <EmptyState title={t('closet.empty')} text={t('closet.emptyHint')}>
            <a className="mc-btn mc-btn--primary" href={href('/skinlib')}>
              {t('nav.library')}
            </a>
          </EmptyState>
        ) : (
          <div className="cards cards--wide">
            {items.map((texture) => (
              <article className="ccard" key={texture.id}>
                <div className="ccard__art slot">
                  <TextureImage
                    uuid={texture.id}
                    alt={texture.itemName || texture.name}
                    size={128}
                    authed={texture.public === 0}
                    state={texture.state}
                  />
                </div>
                <div className="ccard__body">
                  <a
                    className="ccard__name"
                    href={href(`/texture/${texture.id}`)}
                    title={texture.itemName || texture.name}
                  >
                    {texture.itemName || texture.name}
                  </a>
                  <span className="small dim">
                    {texture.itemName && texture.itemName !== texture.name ? texture.name : texture.id.slice(0, 8)}
                  </span>
                  <span className="row">
                    <Badge tone={textureTypeTone(texture.type)}>{textureTypeLabel(texture.type)}</Badge>
                    {texture.public === 0 ? (
                      <Badge tone="muted">{t('texture.public.private')}</Badge>
                    ) : null}
                  </span>
                  <div className="ccard__actions">
                    <Button
                      size="sm"
                      variant="grass"
                      disabled={playerList.length === 0}
                      onClick={() => setDialog({ kind: 'wear', texture })}
                    >
                      {t('closet.wear')}
                    </Button>
                    <Button size="sm" onClick={() => setDialog({ kind: 'rename', texture })}>
                      {t('closet.rename')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'remove', texture })}>
                      {t('closet.remove')}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination
          offset={offset}
          limit={list.data?.meta.limit ?? PAGE_SIZE}
          total={list.data?.meta.total ?? 0}
          onChange={(next) => updateParams({ offset: String(next) }, false)}
        />
      </div>

      {dialog?.kind === 'wear' ? (
        <WearDialog
          texture={dialog.texture}
          players={playerList}
          onClose={() => setDialog(null)}
          onDone={(name) => {
            setDialog(null)
            notify('ok', t('texture.wear.success', { name }))
          }}
        />
      ) : null}

      {dialog?.kind === 'rename' ? (
        <ClosetNameDialog
          textureId={dialog.texture.id}
          initialName={dialog.texture.itemName || dialog.texture.name}
          title={t('closet.renameTitle')}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            notify('ok', t('closet.renamed'))
            list.reload()
          }}
        />
      ) : null}

      {dialog?.kind === 'remove' ? (
        <RemoveDialog
          texture={dialog.texture}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            notify('ok', t('closet.removed'))
            list.reload()
          }}
        />
      ) : null}
    </div>
  )
}

function RemoveDialog({
  texture,
  onClose,
  onDone,
}: {
  texture: Texture
  onClose: () => void
  onDone: () => void
}) {
  const submit = useSubmit()
  return (
    <Dialog
      open
      title={t('closet.remove')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            disabled={submit.busy}
            onClick={() =>
              void submit.run(async () => {
                await removeFromCloset(texture.id)
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.confirm')}
          </Button>
        </>
      }
    >
      <p>{t('closet.removeConfirm', { name: texture.itemName || texture.name })}</p>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}
