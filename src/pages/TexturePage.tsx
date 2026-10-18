import { useEffect, useState, type FormEvent } from 'react'
import * as textures from '../api/textures'
import * as closet from '../api/closet'
import { listPlayers, setPlayerTextures } from '../api/players'
import { setTextureState } from '../api/admin'
import { ApiError, errorMessage } from '../api/client'
import type { Account, Texture, Player } from '../api/types'
import { formatDate, formatBytes } from '../lib/format'
import { Button, Notice } from '../components/UI'
import { SkinViewer } from '../components/SkinViewer'
import { TextureEditor, type Action } from './TextureEditor'
import { t } from '../i18n/zh-CN'
import styles from './TexturePage.module.css'
export function TexturePage({ id, account }: { id: string; account: Account | null }) {
  const [texture, setTexture] = useState<Texture | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [action, setAction] = useState<Action>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    setTexture(null)
    setError('')
    textures
      .getTexture(id, c.signal)
      .then((d) => {
        if (!c.signal.aborted) setTexture(d)
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(errorMessage(e))
      })
    if (account)
      listPlayers(c.signal)
        .then((d) => {
          if (!c.signal.aborted) setPlayers(d)
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(errorMessage(e))
        })
    return () => c.abort()
  }, [id, account, version])
  function open(next: Action) {
    setError('')
    setMessage('')
    setAction(next)
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texture) return
    const form = e.currentTarget,
      d = new FormData(form),
      value = (key: string) => String(d.get(key) ?? '')
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (action === 'edit') {
        await textures.updateTexture(id, {
          name: value('name'),
          type: value('type') === '1' ? 1 : value('type') === '2' ? 2 : 0,
          public: value('public') === '1' ? 1 : 0,
        })
        setMessage(t('texture.saved'))
        setVersion((v) => v + 1)
      } else if (action === 'delete') {
        await textures.deleteTexture(id)
        location.hash = '/skinlib'
        return
      } else if (action === 'report') {
        await textures.reportTexture(id, value('reason'))
        setMessage(t('texture.reported'))
      } else if (action === 'closet') {
        await closet.saveClosetItem(id, value('name'))
        setMessage(t('texture.collected'))
      } else if (action === 'remove') {
        await closet.removeClosetItem(id)
        setMessage(t('texture.removed'))
      } else if (action === 'apply') {
        const wear = () =>
          setPlayerTextures(value('player'), texture.type === 2 ? { cape: id } : { skin: id })
        try {
          await wear()
        } catch (e) {
          if (!(e instanceof ApiError) || e.kind !== 'forbidden') throw e
          await closet.saveClosetItem(id, texture.name)
          await wear()
        }
        setMessage(t('texture.worn'))
      } else if (action === 'moderate') {
        await setTextureState(id, value('state') === '1' ? 1 : 0)
        location.hash = '/skinlib'
        return
      }
      setAction(null)
    } catch (e) {
      setError(errorMessage(e))
      form.querySelector<HTMLElement>('input,textarea,select')?.focus()
    } finally {
      setBusy(false)
    }
  }
  async function download() {
    setBusy(true)
    setError('')
    try {
      const blob = await textures.getTextureImage(id, 'file')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (texture?.name || 'texture') + '.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  if (!texture)
    return (
      <div className="stack">
        {error ? (
          <Notice tone="error">
            {error}
            <Button variant="secondary" onClick={() => setVersion((v) => v + 1)}>
              {t('common.retry')}
            </Button>
          </Notice>
        ) : (
          <div className="skeleton" />
        )}
        <a href="#/skinlib">{t('common.back')}</a>
      </div>
    )
  const model = t(
    texture.type === 2 ? 'library.cape' : texture.type === 1 ? 'library.alex' : 'library.steve',
  )
  return (
    <>
      <div className="page-heading">
        <h1>{t('texture.title')}</h1>
      </div>
      {!action && error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      <div className={styles.columns}>
        <SkinViewer textureId={id} type={texture.type} name={texture.name}>
          <div className={styles.viewerFooter}>
            {account ? (
              <div className="actions">
                <Button
                  variant="secondary"
                  className={styles.outline}
                  disabled={!players.length}
                  onClick={() => open('apply')}
                >
                  {t('texture.apply')}
                </Button>
                <Button
                  variant="secondary"
                  className={styles.outline}
                  onClick={() => open('closet')}
                >
                  {t('texture.collect')}
                </Button>
                <Button
                  variant="secondary"
                  className={styles.outline}
                  onClick={download}
                  disabled={busy}
                >
                  {t('texture.download')}
                </Button>
                <Button
                  variant="secondary"
                  className={styles.outline}
                  onClick={() => open('report')}
                >
                  {t('texture.report')}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" disabled title={t('common.loginRequired')}>
                {t('texture.collect')}
              </Button>
            )}
          </div>
        </SkinViewer>
        <aside className="stack">
          <section className="panel">
            <h2 className={styles.blueHeader}>{t('texture.info')}</h2>
            <dl className={styles.info}>
              <dt>{t('texture.name')}</dt>
              <dd>
                {texture.name}
                {account && (
                  <button
                    className={styles.editButton}
                    aria-label={t('common.edit')}
                    onClick={() => open('edit')}
                  >
                    ✎
                  </button>
                )}
              </dd>
              <dt>{t('texture.model')}</dt>
              <dd>{model}</dd>
              <dt>{t('texture.size')}</dt>
              <dd>{formatBytes(texture.sizeBytes)}</dd>
              <dt>{t('texture.dimensions')}</dt>
              <dd>
                {texture.width} × {texture.height}
              </dd>
              <dt>{t('texture.visibility')}</dt>
              <dd>{t(texture.public ? 'common.public' : 'common.private')}</dd>
              <dt>{t('texture.created')}</dt>
              <dd>{formatDate(texture.createdAt)}</dd>
            </dl>
            <hr className={styles.rule} />
            <label className={styles.hash}>
              {t('texture.hash')}
              <input readOnly value={texture.hash} onFocus={(e) => e.currentTarget.select()} />
            </label>
          </section>
          {account && (
            <section className="panel">
              <h2 className={styles.warningHeader}>{t('texture.manage')}</h2>
              <p className={styles.ownerHint}>{t('texture.ownerHint')}</p>
              <div className="stack">
                <Button variant="secondary" onClick={() => open('edit')}>
                  {t('common.edit')}
                </Button>
                <Button variant="secondary" onClick={() => open('closet')}>
                  {t('texture.renameCloset')}
                </Button>
                <Button variant="secondary" onClick={() => open('remove')}>
                  {t('texture.removeCloset')}
                </Button>
                <Button variant="danger" onClick={() => open('delete')}>
                  {t('common.delete')}
                </Button>
              </div>
            </section>
          )}
          {account && account.permission > 0 && (
            <section className="panel">
              <h2 className={styles.warningHeader}>{t('texture.moderation')}</h2>
              <Button variant="danger" onClick={() => open('moderate')}>
                {t('texture.hide')}
              </Button>
            </section>
          )}
        </aside>
      </div>
      <TextureEditor
        texture={texture}
        players={players}
        action={action}
        busy={busy}
        error={error}
        onSubmit={submit}
        onClose={() => setAction(null)}
      />
    </>
  )
}
