import type { Texture } from '../api/types'
import { typeLabel } from '../api/enums'
import { Badge } from './UI'
import { TextureImage } from './TextureImage'
import { Icon } from './Icons'
import { t } from '../i18n/zh-CN'
export function TextureCard({ texture, src, failed, onError }: { texture: Texture
  src?: string
  failed?: boolean
  onError?: () => void }) {
  return <a className="texture-card" href={`#/texture/${texture.id}`}><div className="card-image"><TextureImage src={src} texture={texture} failed={failed} onError={onError} /><span className="card-index">{texture.id.slice(0, 6).toUpperCase()}</span>{texture.public === 0 && <span className="privacy" title={t('private')}><Icon name="lock" size={16} /></span>}</div><div className="card-meta"><h3>{texture.itemName || texture.name}</h3><div><Badge tone={texture.type === 2 ? 'gold' : ''}>{typeLabel(texture.type)}</Badge>{texture.state === 1 ? <Badge tone="danger">{t('hidden')}</Badge> : <Icon name="arrow" size={18} />}</div></div></a>
}
