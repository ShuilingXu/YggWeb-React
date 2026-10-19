import { TEXTURE_STATE, textureTypeLabel, textureTypeTone } from '../api/enums'
import type { Texture } from '../api/types'
import { t } from '../i18n/zh-CN'
import { href } from '../lib/router'
import { TextureImage } from './TextureImage'
import { Badge } from './UI'

export function TextureCard({ texture }: { texture: Texture }) {
  return (
    <a className="tcard" href={href(`/texture/${texture.id}`)}>
      <span className="slot tcard__frame">
        <TextureImage
          uuid={texture.id}
          alt={texture.name}
          size={256}
          authed={texture.public === 0}
          state={texture.state}
        />
      </span>
      <span className="tcard__name" title={texture.name}>
        {texture.name}
      </span>
      <span className="tcard__meta">
        <Badge tone={textureTypeTone(texture.type)}>{textureTypeLabel(texture.type)}</Badge>
        {texture.public === 0 ? <Badge tone="muted">{t('texture.public.private')}</Badge> : null}
        {texture.state === TEXTURE_STATE.HIDDEN ? (
          <Badge tone="danger">{t('library.hiddenBadge')}</Badge>
        ) : null}
      </span>
    </a>
  )
}
