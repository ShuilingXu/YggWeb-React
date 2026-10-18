import { useMemo, useState, type FormEvent } from 'react'
import { api } from '../api/resources'
import type { Player } from '../api/types'
import { useAsync } from '../lib/useAsync'
import { useAction } from '../lib/useAction'
import { playerError } from '../lib/validate'
import { useTextureImages } from '../lib/useTextureImages'
import { Button, Dialog, EmptyState, ErrorState, Field, Pagination, Skeleton } from '../components/UI'
import { TextureImage } from '../components/TextureImage'
import { Icon } from '../components/Icons'
import { t } from '../i18n/zh-CN'
import { typeLabel } from '../api/enums'

function Appearance({ id, revision }: { id: string
  revision: number }) {
  const appearance = useAsync(async signal => {
    const profile = await api.profile(id, signal)
    const property = profile.properties?.find(property => property.name === 'textures')
    if (!property) return {}
    return (JSON.parse(atob(property.value)) as { textures: { SKIN?: { url: string }
      CAPE?: { url: string } } }).textures
  }, [id, revision])
  if (appearance.error) return <ErrorState message={appearance.error} retry={appearance.reload} />
  return <div className="appearance"><h3>{t('currentAppearance')}</h3>{appearance.loading ? <p>{t('loading')}</p> : <>{appearance.value?.SKIN ? <div><span>{t('steve')}</span><img className="raw-texture checker" src={appearance.value.SKIN.url} alt={t('currentAppearance')} /></div> : <p>{t('noTexture')}</p>}{appearance.value?.CAPE && <div><span>{t('cape')}</span><img className="raw-texture checker" src={appearance.value.CAPE.url} alt={t('cape')} /></div>}</>}</div>
}
export function Players() {
  const list = useAsync(api.players, [])
  const site = useAsync(api.site, [])
  const action = useAction()
  const [revision, setRevision] = useState(0)
  const [dialog, setDialog] = useState<{ kind: string
    player?: Player } | null>(null)
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)
  const closet = useAsync(signal => dialog?.kind === 'wear' ? api.textures('closet', `limit=24&offset=${offset}`, signal) : Promise.resolve(null), [dialog?.kind, offset])
  const images = useTextureImages(closet.value?.items)
  const refresh = () => { list.reload()
    setRevision(value => value + 1) }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '')
    if (dialog?.kind !== 'delete') { const error = playerError(name)
      setError(error)
      if (error) return }
    void action.run(signal => dialog?.kind === 'delete' ? api.deletePlayer(dialog.player!.id, signal) : api.savePlayer(dialog?.player?.id || null, name, signal), t('success'), () => { setDialog(null)
      refresh() })
  }
  const playerCards = useMemo(() => list.value || [], [list.value])
  return <><div className="page-heading"><div><p className="eyebrow">{t('englishPlayers')}</p><h1>{t('players')}</h1><p>{t('playersSubtitle')}</p></div><Button variant="primary" onClick={() => { setError('')
    setDialog({ kind: 'create' }) }} disabled={!site.value || (list.value?.length || 0) >= site.value.maxPlayers}><Icon name="plus" />{t('createPlayer')}</Button></div><p className="notice">{site.value ? t('playerPolicy', { max: site.value.maxPlayers, cost: site.value.playerCost }) : t('loading')}</p>{list.loading ? <Skeleton /> : list.error ? <ErrorState message={list.error} retry={list.reload} /> : !list.value?.length ? <EmptyState title={t('noPlayers')} text={site.value ? t('playerPolicy', { max: site.value.maxPlayers, cost: site.value.playerCost }) : t('loading')} /> : <div className="player-grid">{playerCards.map(player => <section key={player.id} className="panel player-card"><div className="player-heading"><div className="player-avatar"><Icon name="user" size={28} /></div><div><h2>{player.name}</h2><small className="mono">{player.id}</small></div></div><Appearance id={player.id} revision={revision} /><div className="player-actions"><Button variant="primary" onClick={() => { setOffset(0)
    setDialog({ kind: 'wear', player }) }}>{t('wear')}</Button><Button onClick={() => { setError('')
    setDialog({ kind: 'rename', player }) }}>{t('renamePlayer')}</Button><Button onClick={() => action.run(signal => api.wear(player.id, { skin: '' }, signal), t('success'), refresh)} busy={action.busy}>{t('clearSkin')}</Button><Button onClick={() => action.run(signal => api.wear(player.id, { cape: '' }, signal), t('success'), refresh)} busy={action.busy}>{t('clearCape')}</Button><Button variant="danger" onClick={() => setDialog({ kind: 'delete', player })}>{t('deletePlayer')}</Button></div></section>)}</div>}{action.error && !dialog && <ErrorState message={action.error} />}
    {dialog && <Dialog title={t(dialog.kind === 'create' ? 'createPlayer' : dialog.kind === 'rename' ? 'renamePlayer' : dialog.kind === 'delete' ? 'deletePlayer' : 'chooseTexture')} onClose={() => !action.busy && setDialog(null)}>{dialog.kind === 'wear' ? <div className="stack">{closet.loading ? <Skeleton /> : closet.error ? <ErrorState message={closet.error} retry={closet.reload} /> : !closet.value?.items.length ? <EmptyState title={t('emptyCloset')} text={t('emptyClosetText')}><a href="#/library">{t('goLibrary')}</a></EmptyState> : <div className="wear-grid">{closet.value.items.map(texture => <button className="wear-option" key={texture.id} disabled={action.busy || texture.state === 1} onClick={() => action.run(signal => api.wear(dialog.player!.id, { [texture.type === 2 ? 'cape' : 'skin']: texture.id }, signal), t('success'), () => { setDialog(null)
      refresh() })}><TextureImage texture={texture} src={images.images[texture.id]} failed={images.failed[texture.id]} /><strong>{texture.itemName || texture.name}</strong><small>{typeLabel(texture.type)}</small></button>)}</div>}{closet.value && <Pagination offset={offset} limit={24} total={closet.value.total} next={closet.value.next} onChange={setOffset} />}{action.error && <p className="field-error" role="alert">{action.error}</p>}</div> : <form className="stack" onSubmit={submit}>{dialog.kind === 'delete' ? <><strong>{dialog.player?.name}</strong><p>{t('deletePlayerHint')}</p></> : <Field label={t('playerName')} error={error}><input name="name" defaultValue={dialog.player?.name || ''} required minLength={3} maxLength={16} /></Field>}{action.error && <p className="field-error" role="alert">{action.error}</p>}<div className="dialog-actions"><Button type="button" onClick={() => setDialog(null)} disabled={action.busy}>{t('cancel')}</Button><Button type="submit" variant={dialog.kind === 'delete' ? 'danger' : 'primary'} busy={action.busy}>{t('confirm')}</Button></div></form>}</Dialog>}
  </>
}
