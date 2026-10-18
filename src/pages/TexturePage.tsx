import { useState } from 'react'
import { errorMessage, isApiError, requestBlob } from '../api/client'
import {
  TEXTURE_STATE,
  TEXTURE_TYPE,
  textureStateLabel,
  textureStateTone,
  textureTypeLabel,
  textureTypeTone,
} from '../api/enums'
import {
  deleteTexture,
  fetchMyTextures,
  fetchPlayers,
  fetchTexture,
  reportTexture,
  setTextureState,
  updateTexture,
} from '../api/resources'
import type { Texture, TextureType } from '../api/types'
import { useAuth } from '../components/AuthProvider'
import { CharacterViewer } from '../components/CharacterViewer'
import { TextureImage } from '../components/TextureImage'
import { ClosetNameDialog, WearDialog } from '../components/TextureDialogs'
import {
  Badge,
  Button,
  Dialog,
  ErrorState,
  Field,
  Notice,
  Skeleton,
  useToast,
} from '../components/ui'
import { t } from '../i18n/zh-CN'
import { formatBytes, formatDateTime, shortId } from '../lib/format'
import {
  authenticatedImage,
  textureFileUrl,
  texturePreviewUrl,
} from '../lib/images'
import { href, navigate } from '../lib/router'
import { useAsync, useSubmit } from '../lib/useAsync'

type DialogKind = 'closet' | 'wear' | 'report' | 'edit' | 'delete' | null

type MediaSource = { id: string; isPublic: 0 | 1; url: string } | null

function currentSource(source: MediaSource, texture: Texture): string | null {
  if (!source) return null
  return source.id === texture.id && source.isPublic === texture.public ? source.url : null
}

export function TexturePage({ uuid }: { uuid: string }) {
  const auth = useAuth()
  const { notify } = useToast()
  const [dialog, setDialog] = useState<DialogKind>(null)

  const texture = useAsync((signal) => fetchTexture(uuid, signal), [uuid])
  const players = useAsync((signal) => fetchPlayers(signal), [auth.loggedIn], {
    enabled: auth.loggedIn,
  })

  // 后端材质 JSON 不含上传者，用「我的上传」按名称探测是否本人作品。
  const owned = useAsync(
    async (signal) => {
      const data = texture.data
      if (!auth.loggedIn || !data) return false
      if (data.public === 0) return true
      const result = await fetchMyTextures({ q: data.name, limit: 100 }, signal)
      return result.items.some((item) => item.id === data.id)
    },
    [texture.data?.id, texture.data?.name, texture.data?.public, auth.loggedIn],
    { enabled: Boolean(texture.data) },
  )
  const isOwner = owned.data === true

  const isCape = texture.data?.type === TEXTURE_TYPE.CAPE
  const usable = texture.data?.state === TEXTURE_STATE.ACTIVE

  // 3D 需要原始 PNG：公开材质走 hash 分发，私有材质取带令牌的 blob。
  // 结果带上"属于哪个版本"，避免改可见性后仍拿旧的公开地址去请求（后端 no-store，会 404）。
  const rawSource = useAsync<MediaSource>(
    async (signal) => {
      const data = texture.data
      if (!data || !usable || data.type === TEXTURE_TYPE.CAPE) return null
      if (data.public === 1) return { id: data.id, isPublic: 1, url: `/textures/${data.hash}` }
      if (!auth.loggedIn) return null
      try {
        const url = await authenticatedImage(textureFileUrl(data.id), signal)
        return { id: data.id, isPublic: 0, url }
      } catch {
        return null
      }
    },
    [texture.data?.id, texture.data?.hash, texture.data?.public, usable, isCape, auth.loggedIn],
    { enabled: Boolean(texture.data) },
  )

  const flatSource = useAsync<MediaSource>(
    async (signal) => {
      const data = texture.data
      if (!data || !usable) return null
      const url = texturePreviewUrl(data.id, 512)
      if (data.public === 1) return { id: data.id, isPublic: 1, url }
      if (!auth.loggedIn) return null
      try {
        const secured = await authenticatedImage(url, signal)
        return { id: data.id, isPublic: 0, url: secured }
      } catch {
        return null
      }
    },
    [texture.data?.id, texture.data?.public, usable, auth.loggedIn],
    { enabled: Boolean(texture.data) },
  )

  async function handleDownload(data: Texture) {
    try {
      const blob = await requestBlob(textureFileUrl(data.id))
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${data.name || data.id}.png`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      notify('error', errorMessage(error))
    }
  }

  async function handleModerate(data: Texture) {
    try {
      const next = data.state === TEXTURE_STATE.HIDDEN ? TEXTURE_STATE.ACTIVE : TEXTURE_STATE.HIDDEN
      await setTextureState(data.id, next)
      notify('ok', t(next === TEXTURE_STATE.HIDDEN ? 'texture.state.hidden' : 'texture.state.shown'))
      texture.reload()
    } catch (error) {
      notify('error', errorMessage(error))
    }
  }

  if (texture.loading) {
    return (
      <div className="container">
        <div className="page">
          <div className="detail">
            <Skeleton height={420} />
            <div className="stack">
              <Skeleton height={32} />
              <Skeleton height={200} />
              <Skeleton height={120} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (texture.error || !texture.data) {
    return (
      <div className="container">
        <div className="page">
          <ErrorState message={texture.error ?? t('texture.notFound')} onRetry={texture.reload} />
          <div className="row" style={{ justifyContent: 'center' }}>
            <a className="mc-btn" href={href('/skinlib')}>
              {t('common.back')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  const data = texture.data
  const playerList = players.data ?? []

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{data.name}</h1>
            <p className="page__sub mono">{data.id}</p>
          </div>
          <div className="page__actions">
            <a className="mc-btn mc-btn--sm" href={href('/skinlib')}>
              {t('common.back')}
            </a>
          </div>
        </div>

        {data.public === 0 ? <Notice>{t('texture.privateNotice')}</Notice> : null}
        {data.state === TEXTURE_STATE.HIDDEN ? (
          <Notice tone="danger">{t('texture.hiddenNotice')}</Notice>
        ) : null}

        <div className="detail">
          <div className="detail__preview">
            {isCape ? (
              <div className="panel">
                <div className="panel__body flat-preview">
                  <TextureImage
                    uuid={data.id}
                    alt={data.name}
                    size={512}
                    authed={data.public === 0}
                    state={data.state}
                  />
                </div>
              </div>
            ) : (
              <CharacterViewer
                skinUrl={currentSource(rawSource.data, data)}
                alt={data.name}
                model={data.type === TEXTURE_TYPE.ALEX ? 'slim' : 'default'}
                allowToggle
                flatSrc={currentSource(flatSource.data, data)}
              />
            )}
            <div className="row small muted">
              <span>{t('texture.meta.created')}</span>
              <span>{formatDateTime(data.createdAt)}</span>
            </div>
          </div>

          <div className="detail__side">
            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">{t('texture.meta.title')}</span>
              </div>
              <div className="panel__body stack">
                <div className="row">
                  <Badge tone={textureTypeTone(data.type)}>{textureTypeLabel(data.type)}</Badge>
                  <Badge tone={textureStateTone(data.state)}>{textureStateLabel(data.state)}</Badge>
                  <Badge tone={data.public === 1 ? 'lapis' : 'muted'}>
                    {data.public === 1 ? t('texture.public.public') : t('texture.public.private')}
                  </Badge>
                </div>
                <dl className="kv">
                  <dt>{t('texture.meta.dimensions')}</dt>
                  <dd>{`${data.width} × ${data.height}`}</dd>
                  <dt>{t('texture.meta.size')}</dt>
                  <dd>{formatBytes(data.sizeBytes)}</dd>
                  <dt>{t('texture.meta.id')}</dt>
                  <dd title={data.id}>{shortId(data.id, 16)}</dd>
                  <dt>{t('texture.meta.hash')}</dt>
                  <dd title={data.hash}>{shortId(data.hash, 16)}</dd>
                </dl>
                {isOwner ? <Notice>{t('texture.ownerNotice')}</Notice> : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">{t('texture.actionsTitle')}</span>
              </div>
              <div className="panel__body detail__actions">
                {auth.loggedIn ? (
                  <>
                    <Button block onClick={() => setDialog('closet')}>
                      {t('texture.action.closet')}
                    </Button>
                    <Button
                      block
                      variant="grass"
                      onClick={() => setDialog('wear')}
                      disabled={playerList.length === 0}
                    >
                      {t('texture.action.wear')}
                    </Button>
                    {playerList.length === 0 ? (
                      <span className="small dim">{t('texture.wear.noPlayers')}</span>
                    ) : null}
                  </>
                ) : (
                  <a className="mc-btn mc-btn--block mc-btn--primary" href={href('/auth/login')}>
                    {t('nav.login')}
                  </a>
                )}

                {auth.loggedIn && data.public === 0 ? (
                  <Button block onClick={() => handleDownload(data)}>
                    {t('texture.action.download')}
                  </Button>
                ) : null}

                {isOwner ? (
                  <>
                    <Button block onClick={() => setDialog('edit')}>
                      {t('texture.action.edit')}
                    </Button>
                    <Button block variant="danger" onClick={() => setDialog('delete')}>
                      {t('texture.action.delete')}
                    </Button>
                  </>
                ) : auth.loggedIn ? (
                  <Button block variant="ghost" onClick={() => setDialog('report')}>
                    {t('texture.action.report')}
                  </Button>
                ) : null}

                {auth.isAdmin ? (
                  <>
                    <hr className="divider" />
                    <span className="small dim">{t('texture.moderation.admin')}</span>
                    <Button block variant="gold" onClick={() => handleModerate(data)}>
                      {data.state === TEXTURE_STATE.HIDDEN
                        ? t('texture.action.show')
                        : t('texture.action.hide')}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {dialog === 'closet' ? (
        <ClosetNameDialog
          textureId={data.id}
          initialName={data.name}
          title={t('texture.closet.title')}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            notify('ok', t('texture.closet.success'))
          }}
        />
      ) : null}

      {dialog === 'wear' ? (
        <WearDialog
          texture={data}
          players={playerList}
          onClose={() => setDialog(null)}
          onDone={(name) => {
            setDialog(null)
            notify('ok', t('texture.wear.success', { name }))
          }}
        />
      ) : null}

      {dialog === 'report' ? (
        <ReportDialog
          texture={data}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            notify('ok', t('texture.report.success'))
          }}
        />
      ) : null}

      {dialog === 'edit' ? (
        <EditDialog
          texture={data}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            notify('ok', t('texture.edit.success'))
            texture.reload()
          }}
        />
      ) : null}

      {dialog === 'delete' ? (
        <DeleteDialog
          texture={data}
          onClose={() => setDialog(null)}
          onDone={() => {
            notify('ok', t('texture.delete.success'))
            navigate('/skinlib')
          }}
        />
      ) : null}
    </div>
  )
}

function DeleteDialog({
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
      title={t('texture.action.delete')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            disabled={submit.busy}
            onClick={() =>
              void submit.run(async () => {
                await deleteTexture(texture.id)
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.delete')}
          </Button>
        </>
      }
    >
      <p>{t('texture.delete.confirm', { name: texture.name })}</p>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}

function ReportDialog({
  texture,
  onClose,
  onDone,
}: {
  texture: Texture
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const submit = useSubmit()
  const [conflict, setConflict] = useState(false)

  return (
    <Dialog
      open
      title={t('texture.report.title')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            disabled={submit.busy || reason.trim().length === 0}
            onClick={() =>
              void submit.run(async () => {
                try {
                  await reportTexture(texture.id, reason.trim())
                  onDone()
                } catch (error) {
                  if (isApiError(error) && error.status === 409) setConflict(true)
                  throw error
                }
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.confirm')}
          </Button>
        </>
      }
    >
      <Field label={t('texture.report.reason')} htmlFor="report-reason" required>
        <textarea
          id="report-reason"
          className="textarea"
          value={reason}
          maxLength={1000}
          placeholder={t('texture.report.placeholder')}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      {conflict ? <Notice tone="warn">{t('texture.report.duplicate')}</Notice> : null}
      {submit.error && !conflict ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}

function EditDialog({
  texture,
  onClose,
  onDone,
}: {
  texture: Texture
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(texture.name)
  const [type, setType] = useState<TextureType>(texture.type)
  const [isPublic, setIsPublic] = useState(texture.public === 1)
  const submit = useSubmit()

  return (
    <Dialog
      open
      title={t('texture.edit.title')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            disabled={submit.busy || name.trim().length === 0}
            onClick={() =>
              void submit.run(async () => {
                await updateTexture(texture.id, {
                  name: name.trim(),
                  type,
                  public: isPublic ? 1 : 0,
                })
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('texture.edit.name')} htmlFor="edit-name" required>
        <input
          id="edit-name"
          className="input"
          value={name}
          maxLength={50}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label={t('texture.edit.type')} htmlFor="edit-type" hint={t('texture.edit.typeHint')}>
        <select
          id="edit-type"
          className="select"
          value={type}
          onChange={(event) => setType(Number(event.target.value) as TextureType)}
        >
          <option value={TEXTURE_TYPE.STEVE}>{textureTypeLabel(TEXTURE_TYPE.STEVE)}</option>
          <option value={TEXTURE_TYPE.ALEX}>{textureTypeLabel(TEXTURE_TYPE.ALEX)}</option>
          <option value={TEXTURE_TYPE.CAPE}>{textureTypeLabel(TEXTURE_TYPE.CAPE)}</option>
        </select>
      </Field>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
        />
        {t('texture.edit.public')}
      </label>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}
