import { lazy, Suspense, useMemo, useState, type FormEvent } from 'react'
import { api, findListedTexture } from '../api/resources'
import { ApiError, imageBlob } from '../api/client'
import { useAsync } from '../lib/useAsync'
import { useAction } from '../lib/useAction'
import { useAuth } from '../lib/auth'
import { useTextureImages } from '../lib/useTextureImages'
import { navigate } from '../lib/router'
import { date, bytes } from '../lib/format'
import { typeLabel } from '../api/enums'
import { TextureImage } from '../components/TextureImage'
import { Badge, Button, Dialog, ErrorState, Field, Skeleton, Tabs } from '../components/UI'
import { Icon } from '../components/Icons'
import { t } from '../i18n/zh-CN'

const SkinViewer = lazy(() => import('../components/SkinViewer'))
function UnavailableTexture({ id, message, retry, canManage }: { id: string
  message: string
  retry: () => void
  canManage: boolean }) {
  const auth = useAuth()
  const action = useAction()
  const [confirm, setConfirm] = useState(false)
  return <><ErrorState message={message} retry={retry} />{canManage && auth.account && <section className="panel stack"><p className="mono">{id}</p><p>{t('hiddenTextureHelp')}</p><div className="inline"><Button variant="danger" onClick={() => setConfirm(true)}>{t('deleteOwnTexture')}</Button>{auth.account.permission >= 1 && <a className="button" href={`#/admin/reports?texture=${id}`}>{t('publish')}</a>}</div>{action.error && <p className="field-error" role="alert">{action.error}</p>}</section>}{confirm && <Dialog title={t('confirmDelete', { name: id })} onClose={() => !action.busy && setConfirm(false)}><div className="stack"><p>{t('deleteTextureHint')}</p>{action.error && <p role="alert" className="field-error">{action.error}</p>}<div className="dialog-actions"><Button disabled={action.busy} onClick={() => setConfirm(false)}>{t('cancel')}</Button><Button variant="danger" busy={action.busy} onClick={() => action.run(signal => api.deleteTexture(id, signal), t('success'), () => navigate('/uploads'))}>{t('confirm')}</Button></div></div></Dialog>}</>
}
export function TextureDetail({ id }: { id: string }) {
  const auth = useAuth()
  const action = useAction()
  const detail = useAsync(signal => api.texture(id, signal), [id, auth.account?.id])
  const ownership = useAsync(async signal => {
    if (!auth.account || !detail.value) return { owned: false, saved: null }
    // 详情不返回上传者和衣柜备注，复用列表接口按 UUID 核对。
    const [owned, saved] = await Promise.all([findListedTexture('uploads', id, signal, detail.value.name), findListedTexture('closet', id, signal)])
    return { owned: !!owned, saved }
  }, [detail.value?.name, id, auth.account?.id])
  const players = useAsync(signal => auth.account ? api.players(signal) : Promise.resolve([]), [auth.account?.id])
  const textures = useMemo(() => detail.value ? [detail.value] : [], [detail.value])
  const images = useTextureImages(textures)
  const [view, setView] = useState('3d')
  const [webglFailed, setWebglFailed] = useState(false)
  const [dialog, setDialog] = useState('')
  const [editType, setEditType] = useState(0)
  const [editPublic, setEditPublic] = useState(1)
  const texture = detail.value
  if (detail.loading) return <Skeleton />
  if (detail.error || !texture) return <UnavailableTexture id={id} message={detail.error || t('error404')} retry={detail.reload} canManage={detail.failure instanceof ApiError && detail.failure.status === 404} />
  const can3d = texture.type !== 2 && texture.public === 1 && texture.state === 0 && !webglFailed
  const requireLogin = (next: () => void) => auth.account ? next() : navigate(`/login?next=${encodeURIComponent('/texture/' + id)}`)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void action.run(async signal => {
      if (dialog === 'edit') await api.editTexture(id, { name: String(data.get('name')), type: editType as 0 | 1 | 2, public: editPublic as 0 | 1 }, signal)
      if (dialog === 'report') await api.report(id, String(data.get('reason')), signal)
      if (dialog === 'wear') { if (!ownership.value?.saved) await api.closet(id, texture.name, signal)
        await api.wear(String(data.get('player')), { [texture.type === 2 ? 'cape' : 'skin']: id }, signal) }
      if (dialog === 'note') await api.closet(id, String(data.get('name')), signal)
      if (dialog === 'delete') { await api.deleteTexture(id, signal)
        navigate('/uploads') }
      if (dialog === 'removeCloset') { await api.removeCloset(id, signal)
        navigate('/closet') }
      if (dialog === 'moderate') await api.moderate(id, texture.state === 1 ? 0 : 1, signal)
      setDialog('')
        detail.reload()
        ownership.reload()
    }, t('success'))
  }
  const download = () => requireLogin(() => { void action.run(async signal => { const blob = await imageBlob(`/api/textures/${id}/file`, signal)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = texture.name + '.png'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000) }) })
  return <><a className="back-link" href="#/library">← {t('library')}</a><div className="page-heading"><div><p className="eyebrow">{t('englishTexture')} / {texture.id.slice(0, 8).toUpperCase()}</p><h1>{texture.name}</h1><div className="inline"><Badge>{typeLabel(texture.type)}</Badge><Badge tone={texture.public ? '' : 'gold'}>{t(texture.public ? 'public' : 'private')}</Badge>{texture.state === 1 && <Badge tone="danger">{t('hidden')}</Badge>}</div></div></div><div className="detail-layout"><section className="preview-panel panel"><div className="preview-controls"><Tabs value={can3d && view === '3d' ? '3d' : 'flat'} onChange={setView} items={[{ value: '3d', label: t('preview3d') }, { value: 'flat', label: t('preview') }].filter(item => item.value === 'flat' || (can3d))} /></div>{view === '3d' && can3d ? <Suspense fallback={<div className="viewer-placeholder">{t('loading3d')}</div>}><SkinViewer src={`/textures/${texture.hash}`} slim={texture.type === 1} fallback={() => { setWebglFailed(true)
    setView('flat') }} /></Suspense> : <TextureImage className="detail-flat" src={images.images[id]} failed={images.failed[id]} onError={() => images.fail(id)} />}{webglFailed && <p className="muted">{t('noWebgl')}</p>}</section><aside className="detail-info stack"><section className="panel stack"><Button variant="primary" busy={action.busy} disabled={texture.state === 1 || ownership.loading || !!ownership.value?.saved} onClick={() => requireLogin(() => { void action.run(signal => api.closet(id, texture.name, signal), t('collected'), ownership.reload) })}><Icon name="heart" />{t(ownership.value?.saved ? 'collected' : 'collect')}</Button><Button disabled={texture.state === 1 || ownership.loading} onClick={() => requireLogin(() => setDialog('wear'))}><Icon name="shirt" />{t('wear')}</Button><Button disabled={texture.state === 1} onClick={download}><Icon name="download" />{t('download')}</Button><dl><dt>{t('dimensions')}</dt><dd>{texture.width} × {texture.height}</dd><dt>{t('fileSize')}</dt><dd>{bytes(texture.sizeBytes)}</dd><dt>{t('addedAt')}</dt><dd>{date(texture.createdAt)}</dd><dt>{t('textureId')}</dt><dd className="mono">{id}</dd></dl></section>{auth.account && <section className="panel stack"><Button disabled={texture.state === 1 || ownership.loading} onClick={() => setDialog('note')}>{t('note')}</Button><Button disabled={!ownership.value?.saved} onClick={() => setDialog('removeCloset')}>{t('removeCloset')}</Button>{ownership.value?.owned && <><Button onClick={() => { setEditType(texture.type)
    setEditPublic(texture.public)
    setDialog('edit') }}>{t('edit')}</Button><Button variant="danger" onClick={() => setDialog('delete')}>{t('remove')}</Button></>}{auth.account.permission >= 1 && <Button onClick={() => setDialog('moderate')}>{t(texture.state ? 'publish' : 'unpublish')}</Button>}<Button disabled={texture.state === 1} variant="ghost" onClick={() => setDialog('report')}><Icon name="flag" size={16} />{t('report')}</Button></section>}{ownership.error && <ErrorState message={ownership.error} retry={ownership.reload} />}{action.error && <p className="field-error" role="alert">{action.error}</p>}</aside></div>
    {dialog && <Dialog title={t(dialog === 'edit' ? 'edit' : dialog === 'report' ? 'report' : dialog === 'wear' ? 'wear' : dialog === 'note' ? 'note' : dialog === 'moderate' ? 'confirm' : 'confirmDelete', { name: texture.name })} onClose={() => !action.busy && setDialog('')}><form onSubmit={onSubmit} className="stack">
      {(dialog === 'edit' || dialog === 'note') && <Field label={t('name')} hint={dialog === 'note' ? t('noteHint') : undefined}><input name="name" defaultValue={dialog === 'note' ? ownership.value?.saved?.itemName || texture.name : texture.name} maxLength={50} required /></Field>}
      {dialog === 'edit' && <><Field label={t('model')}><select value={editType} onChange={event => setEditType(Number(event.target.value))}>{[0, 1, 2].map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></Field><Field label={t('visibility')} hint={t('renameHint')}><select value={editPublic} onChange={event => setEditPublic(Number(event.target.value))}><option value={1}>{t('public')}</option><option value={0}>{t('private')}</option></select></Field></>}
      {dialog === 'report' && <Field label={t('reportReason')} hint={t('reportHint')}><textarea name="reason" required maxLength={1000} /></Field>}
      {dialog === 'wear' && (players.error ? <ErrorState message={players.error} retry={players.reload} /> : <Field label={t('choosePlayer')}><select name="player" required defaultValue=""><option value="" disabled>{t('choosePlayer')}</option>{players.value?.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select>{!players.loading && !players.value?.length && <a href="#/players">{t('createPlayer')}</a>}</Field>)}
      {['delete', 'removeCloset', 'moderate'].includes(dialog) && <p>{t(dialog === 'delete' ? 'deleteTextureHint' : 'deleteConfirmText')}</p>}
      {action.error && <p className="field-error" role="alert">{action.error}</p>}<div className="dialog-actions"><Button type="button" onClick={() => setDialog('')} disabled={action.busy}>{t('cancel')}</Button><Button type="submit" variant={dialog === 'delete' ? 'danger' : 'primary'} busy={action.busy} disabled={dialog === 'wear' && (!players.value?.length || !!players.error)}>{t('confirm')}</Button></div></form></Dialog>}
  </>
}
