import { useEffect, useState } from 'react'
import { getTextureImage } from '../api/textures'
import { t } from '../i18n/zh-CN'
import styles from './Texture.module.css'
interface Props {
  id?: string
  localFile?: File
  name: string
  size?: 128 | 256
  kind?: 'preview' | 'avatar' | 'file'
}
export function TextureImage({ id, localFile, name, size = 128, kind = 'preview' }: Props) {
  const [source, setSource] = useState('')
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const c = new AbortController()
    let url = ''
    setSource('')
    setFailed(false)
    setDimensions(null)
    ;(localFile
      ? Promise.resolve(localFile)
      : id
        ? getTextureImage(id, kind, size, c.signal)
        : Promise.reject(new Error('missing texture'))
    )
      .then((blob) => {
        if (!c.signal.aborted) {
          url = URL.createObjectURL(blob)
          setSource(url)
        }
      })
      .catch(() => {
        if (!c.signal.aborted) setFailed(true)
      })
    return () => {
      c.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, localFile, kind, size, retry])
  return (
    <div className={styles.image} style={{ height: size }}>
      {failed ? (
        <div className={styles.failure}>
          <small>{t('common.unknown')}</small>
          <button className={styles.retry} type="button" onClick={() => setRetry((v) => v + 1)}>
            {t('common.retry')}
          </button>
        </div>
      ) : source ? (
        <img
          src={source}
          alt={name}
          width={dimensions?.width}
          height={dimensions?.height}
          onLoad={(e) => {
            const image = e.currentTarget
            const scale = Math.max(1, Math.floor(size / image.naturalHeight))
            setDimensions({
              width: image.naturalWidth * scale,
              height: image.naturalHeight * scale,
            })
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.loading} role="status">
          {t('common.loading')}
        </span>
      )}
    </div>
  )
}
