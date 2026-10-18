import type { ReactNode } from 'react'
import { Link } from '../lib/router'
import { TextureType } from '../api/enums'
import { t } from '../i18n'
import { TextureImage } from './TextureImage'
import { Badge } from './ui'
import { textureApi } from '../api/resources'
import type { Texture } from '../api/types'

export function typeLabel(type: number): string {
  switch (type) {
    case TextureType.Steve:
      return t('library.modelSteve')
    case TextureType.Alex:
      return t('library.modelAlex')
    case TextureType.Cape:
      return t('library.typeCape')
    default:
      return String(type)
  }
}

export function typeTone(type: number): 'accent' | 'default' | 'warning' {
  if (type === TextureType.Cape) return 'warning'
  if (type === TextureType.Alex) return 'accent'
  return 'default'
}

export function TextureCard({
  texture,
  actions,
  title,
}: {
  texture: Texture
  actions?: ReactNode
  title?: string
}) {
  const name = title ?? texture.itemName ?? texture.name
  return (
    <article className="texture-card">
      <Link to={`/texture/${texture.id}`} className="texture-card__media checker" aria-label={name}>
        <TextureImage src={textureApi.previewUrl(texture.id, 192)} alt={name} checker={false} />
      </Link>
      <div className="texture-card__body">
        <div className="texture-card__title">
          <Link to={`/texture/${texture.id}`} className="truncate" title={name}>
            {name}
          </Link>
          {texture.state === 1 ? <Badge tone="danger">{t('texture.hidden')}</Badge> : null}
          {texture.public === 0 ? <Badge tone="warning">{t('texture.private')}</Badge> : null}
        </div>
        <div className="texture-card__meta">
          <Badge tone={typeTone(texture.type)}>{typeLabel(texture.type)}</Badge>
          <span>
            {texture.width}×{texture.height}
          </span>
        </div>
        {actions ? <div className="texture-card__actions">{actions}</div> : null}
      </div>
    </article>
  )
}
