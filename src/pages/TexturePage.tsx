import { lazy, Suspense, useState } from 'react'
import { ApiError } from '../api/client'
import { adminApi, textureApi } from '../api/resources'
import { TextureType, isSkinType } from '../api/enums'
import { useAuth } from '../lib/auth'
import { Link, navigate } from '../lib/router'
import { useAsync } from '../lib/useAsync'
import { formatBytes, formatDateTime } from '../lib/format'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureImage } from '../components/TextureImage'
import { typeLabel } from '../components/TextureCard'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  ErrorState,
  Field,
  Select,
  Skeleton,
  Textarea,
  TextInput,
  useToast,
} from '../components/ui'
import { DownloadIcon, EditIcon, StarIcon, TrashIcon } from '../components/icons'

const SkinViewer = lazy(() => import('../components/SkinViewer'))

export function TexturePage({ id }: { id: string }) {
  const { account, status, isAdmin } = useAuth()
  const toast = useToast()
  const texture = useAsync((signal) => textureApi.get(id, signal), [id])
  const authed = status === 'authenticated'
  const closet = useAsync(
    async (signal) =>
      authed ? textureApi.closet({ limit: 100 }, signal) : { items: [], total: 0, nextOffset: null },
    [authed],
  )
  const mine = useAsync(
    async (signal) => (authed ? textureApi.mine({ limit: 100 }, signal) : { items: [], total: 0, nextOffset: null }),
    [authed],
  )

  const [dialog, setDialog] = useState<null | 'rename' | 'type' | 'delete' | 'report'>(null)
  const [mode, setMode] = useState<'3d' | '2d'>('3d')
  const [busy, setBusy] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [typeDraft, setTypeDraft] = useState(String(TextureType.Steve))
  const [reason, setReason] = useState('')

  const data = texture.data
  const inCloset = Boolean(closet.data?.items.some((item) => item.id === id))
  const isOwner = Boolean(account && mine.data?.items.some((item) => item.id === id))
  const canManage = isOwner || isAdmin
  // 3D 需要匿名可取的原始 PNG：只有公开且未被下架的条目能走 /textures/{hash}。
  const canUse3d = Boolean(data && isSkinType(data.type) && data.public === 1 && data.state === 0 && data.hash)

  const refreshAll = () => {
    texture.reload()
    closet.reload()
    mine.reload()
  }

  const guard = async (action: () => Promise<void>, successMessage?: string) => {
    setBusy(true)
    try {
      await action()
      if (successMessage) toast.push(successMessage, 'success')
      refreshAll()
    } catch (caught) {
      toast.push(caught instanceof ApiError ? caught.message : t('common.errorGeneric'), 'error')
    } finally {
      setBusy(false)
      setDialog(null)
    }
  }

  const handleDownload = async () => {
    if (!data) return
    try {
      const blob = await textureApi.rawBlob(data.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.name}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.push(t('texture.downloadDenied'), 'error')
    }
  }

  if (texture.loading) {
    return (
      <div className="detail-layout">
        <div className="preview-panel">
          <Skeleton height={320} />
        </div>
        <div className="card stack">
          <Skeleton height={20} width="60%" />
          <Skeleton height={14} />
          <Skeleton height={14} width="80%" />
          <Skeleton height={14} width="50%" />
        </div>
      </div>
    )
  }

  if (texture.error || !data) {
    const notFound =
      texture.error instanceof ApiError && (texture.error.status === 404 || texture.error.status === 403)
    return (
      <>
        <PageHeader title={t('texture.detail')} />
        <ErrorState message={notFound ? t('texture.notFound') : t('common.errorGeneric')} onRetry={texture.reload} />
        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/library">{t('texture.visitLibrary')}</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={`${typeLabel(data.type)} · ${data.width}×${data.height} · ${formatBytes(data.sizeBytes)}`}
        actions={
          <>
            <Link to={`/library?type=${data.type}`} className="btn btn--sm">
              {t('texture.visitLibrary')}
            </Link>
            {authed ? (
              <Button size="sm" onClick={handleDownload}>
                <DownloadIcon /> {t('texture.download')}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="detail-layout">
        <div className="preview-panel">
          <div className="preview-panel__stage checker">
            {canUse3d && mode === '3d' ? (
              <Suspense
                fallback={
                  <TextureImage
                    src={textureApi.previewUrl(data.id, 384)}
                    alt={data.name}
                    width={384}
                    height={384}
                    checker={false}
                  />
                }
              >
                <SkinViewer
                  skin={`/textures/${data.hash}`}
                  slim={data.type === TextureType.Alex}
                />
              </Suspense>
            ) : (
              <TextureImage
                src={textureApi.previewUrl(data.id, 384)}
                alt={data.name}
                width={384}
                height={384}
                checker={false}
              />
            )}
          </div>
          {canUse3d ? (
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button size="sm" onClick={() => setMode(mode === '3d' ? '2d' : '3d')}>
                {mode === '3d' ? t('texture.view2d') : t('texture.view3d')}
              </Button>
            </div>
          ) : null}
          <div className="preview-panel__thumbs">
            <figure>
              <TextureImage
                src={
                  data.type === TextureType.Cape
                    ? textureApi.previewUrl(data.id, 128)
                    : textureApi.avatarUrl(data.id, 128)
                }
                alt={`${data.name} 预览`}
                checker={false}
              />
              <figcaption>{t('texture.preview')}</figcaption>
            </figure>
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {authed ? (
              inCloset ? (
                <Button
                  size="sm"
                  onClick={() => guard(() => textureApi.removeFromCloset(data.id), t('texture.closetRemoved'))}
                >
                  <StarIcon filled /> {t('texture.removeFromCloset')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => guard(() => textureApi.addToCloset(data.id, data.name), t('texture.closetAdded'))}
                >
                  <StarIcon /> {t('texture.addToCloset')}
                </Button>
              )
            ) : (
              <Link to={`/login?next=${encodeURIComponent(`/texture/${data.id}`)}`} className="btn btn--sm">
                {t('library.loginToFavor')}
              </Link>
            )}
            {authed && !canManage ? (
              <Button size="sm" onClick={() => setDialog('report')}>
                {t('texture.report')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="section-title">{t('texture.detail')}</h2>
            <dl className="def-list">
              <div>
                <dt>{t('texture.name')}</dt>
                <dd>{data.name}</dd>
              </div>
              <div>
                <dt>{t('texture.type')}</dt>
                <dd>{typeLabel(data.type)}</dd>
              </div>
              <div>
                <dt>{t('texture.visibility')}</dt>
                <dd>
                  <Badge tone={data.public === 1 ? 'success' : 'warning'}>
                    {data.public === 1 ? t('texture.public') : t('texture.private')}
                  </Badge>{' '}
                  {data.state === 1 ? <Badge tone="danger">{t('texture.hidden')}</Badge> : null}
                </dd>
              </div>
              <div>
                <dt>{t('texture.dimensions')}</dt>
                <dd>
                  {data.width}×{data.height}
                </dd>
              </div>
              <div>
                <dt>{t('texture.size')}</dt>
                <dd>{formatBytes(data.sizeBytes)}</dd>
              </div>
              <div>
                <dt>{t('texture.createdAt')}</dt>
                <dd>{formatDateTime(data.createdAt)}</dd>
              </div>
              <div>
                <dt>{t('texture.hash')}</dt>
                <dd className="mono-hash">{data.hash}</dd>
              </div>
            </dl>
          </section>

          {canManage ? (
            <section className="card stack">
              <h2 className="section-title">{t('texture.ownerTools')}</h2>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  onClick={() => {
                    setNameDraft(data.name)
                    setDialog('rename')
                  }}
                >
                  <EditIcon /> {t('texture.rename')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setTypeDraft(String(data.type))
                    setDialog('type')
                  }}
                >
                  {t('texture.changeType')}
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    guard(
                      () =>
                        textureApi.update(data.id, {
                          name: data.name,
                          type: data.type,
                          public: data.public === 1 ? 0 : 1,
                        }),
                      t('texture.visibilityChanged'),
                    )
                  }
                >
                  {data.public === 1 ? t('texture.makePrivate') : t('texture.makePublic')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDialog('delete')}>
                  <TrashIcon /> {t('texture.delete')}
                </Button>
              </div>
              {isAdmin ? (
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
                    {t('texture.adminTools')}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      guard(
                        () => adminApi.setTextureState(data.id, data.state === 1 ? 0 : 1),
                        data.state === 1 ? t('texture.restored') : t('texture.takenDown'),
                      )
                    }
                  >
                    {data.state === 1 ? t('texture.restore') : t('texture.takeDown')}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <Dialog
        open={dialog === 'rename'}
        title={t('texture.rename')}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() =>
                guard(
                  () => textureApi.update(data.id, { name: nameDraft.trim(), type: data.type, public: data.public }),
                  t('texture.renamed'),
                )
              }
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Field label={t('texture.name')} htmlFor="texture-name">
          <TextInput id="texture-name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
        </Field>
      </Dialog>

      <Dialog
        open={dialog === 'type'}
        title={t('texture.changeType')}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() =>
                guard(
                  () =>
                    textureApi.update(data.id, {
                      name: data.name,
                      type: Number(typeDraft),
                      public: data.public,
                    }),
                  t('texture.typeChanged'),
                )
              }
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Field label={t('texture.type')} htmlFor="texture-type" hint={t('texture.typeLocked')}>
          <Select id="texture-type" value={typeDraft} onChange={(event) => setTypeDraft(event.target.value)}>
            <option value={String(TextureType.Steve)}>{t('library.modelSteve')}</option>
            <option value={String(TextureType.Alex)}>{t('library.modelAlex')}</option>
            <option value={String(TextureType.Cape)}>{t('library.typeCape')}</option>
          </Select>
        </Field>
      </Dialog>

      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('texture.deleteConfirmTitle')}
        body={t('texture.deleteConfirmBody')}
        confirmLabel={t('texture.delete')}
        danger
        loading={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() =>
          guard(async () => {
            await textureApi.remove(data.id)
            toast.push(t('texture.deleteSuccess'), 'success')
            navigate('/library')
          })
        }
      />

      <Dialog
        open={dialog === 'report'}
        title={t('texture.reportTitle')}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => guard(() => textureApi.report(data.id, reason.trim()), t('texture.reportSuccess'))}
            >
              {t('texture.reportSubmit')}
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 'var(--space-3)' }}>{t('texture.reportBody')}</p>
        <Field label={t('texture.reportReason')} htmlFor="report-reason">
          <Textarea id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} />
        </Field>
      </Dialog>
    </>
  )
}
