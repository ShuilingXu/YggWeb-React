import { errorMessage } from '../api/client'
import { useState } from 'react'
import { setTextureState } from '../api/admin'
import { Button, Dialog, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Admin.module.css'

export function TextureModeration({
  textureId,
  onChanged,
}: {
  textureId: string
  onChanged: (state: 0 | 1) => void
}) {
  const [nextState, setNextState] = useState<0 | 1 | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function confirm() {
    if (nextState === null) return
    setBusy(true)
    setError('')
    try {
      await setTextureState(textureId, nextState)
      setNextState(null)
      onChanged(nextState)
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className={styles.actions}>
        <Button
          variant="danger"
          type="button"
          onClick={() => {
            setError('')
            setNextState(1)
          }}
        >
          {t('admin.hide')}
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            setError('')
            setNextState(0)
          }}
        >
          {t('admin.restore')}
        </Button>
      </div>
      <Dialog
        open={nextState !== null}
        title={t('admin.changeTexture')}
        onClose={() => {
          if (!busy) setNextState(null)
        }}
      >
        <p>{t(nextState === 1 ? 'admin.hideWarning' : 'admin.restoreWarning')}</p>
        <p className={styles.mono}>{textureId}</p>
        {nextState === 1 && <Notice>{t('admin.reportWarning')}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <div className={styles.formActions}>
          <Button variant="secondary" disabled={busy} onClick={() => setNextState(null)}>
            {t('admin.cancel')}
          </Button>
          <Button
            variant={nextState === 1 ? 'danger' : 'primary'}
            disabled={busy}
            onClick={confirm}
          >
            {t(busy ? 'admin.saving' : 'admin.confirm')}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
