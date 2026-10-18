import { t } from '../i18n/zh-CN'
import type { Texture } from '../api/types'
export function TextureImage({ src, texture, failed = false, empty = false, onError, className = '' }: { src?: string
  texture?: Texture
  failed?: boolean
  empty?: boolean
  onError?: () => void
  className?: string }) {
  return <div className={`texture-image checker ${className}`}>{empty ? <div className="image-fallback"><span>◇</span><small>{t('chooseFile')}</small></div> : failed ? <div className="image-fallback" title={t('imageMissingHint')}><span>◇</span><small>{t('imageMissing')}</small></div> : src ? <img src={src} alt={texture?.itemName || texture?.name || t('currentAppearance')} loading="lazy" onError={onError} /> : <div className="image-fallback" role="status"><span className="spinner" /><small>{t('loading')}</small></div>}</div>
}
