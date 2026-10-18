import { useEffect, useState } from 'react'
import { TEXTURE_STATE } from '../api/enums'
import type { TextureState } from '../api/types'
import { t } from '../i18n/zh-CN'
import { authenticatedImage, textureAvatarUrl, texturePreviewUrl } from '../lib/images'

export type TextureImageProps = {
  uuid: string
  alt: string
  kind?: 'preview' | 'avatar'
  size?: number
  /** 私有材质只对上传者可见，需要带令牌取 blob */
  authed?: boolean
  state?: TextureState
}

export function TextureImage({
  uuid,
  alt,
  kind = 'preview',
  size = 128,
  authed = false,
  state,
}: TextureImageProps) {
  const url = kind === 'avatar' ? textureAvatarUrl(uuid, size) : texturePreviewUrl(uuid, size)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setSrc(null)
    setFailed(false)
    if (state === TEXTURE_STATE.HIDDEN) return
    if (!authed) {
      setSrc(url)
      return
    }
    const controller = new AbortController()
    authenticatedImage(url, controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setSrc(value)
      },
      () => {
        if (!controller.signal.aborted) setFailed(true)
      },
    )
    return () => controller.abort()
  }, [url, authed, state])

  return (
    <span
      className={['thumb', 'checker', src ? '' : 'thumb--loading'].filter(Boolean).join(' ')}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="thumb__fallback">
          {state === TEXTURE_STATE.HIDDEN ? t('texture.state.hidden') : t('texture.noPreview')}
        </span>
      )}
    </span>
  )
}
