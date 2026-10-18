import type { Texture } from '../api/types'
import { t } from '../i18n/zh-CN'
import { TextureImage } from './TextureImage'
import styles from './Texture.module.css'
interface Props {
  texture: Texture
  liked?: boolean
  busy?: boolean
  selected?: boolean
  onSelect?: (texture: Texture) => void
  onToggle?: (texture: Texture) => void
}
export function TextureCard({
  texture,
  liked = false,
  busy = false,
  selected = false,
  onSelect,
  onToggle,
}: Props) {
  const title = texture.itemName || texture.name
  return (
    <article
      className={`${styles.card} ${onSelect ? styles.closetCard : ''} ${selected ? styles.selected : ''}`}
    >
      <div className={styles.preview}>
        <TextureImage id={texture.id} name={title} />
        {onSelect ? (
          <button
            type="button"
            className={styles.previewLink}
            aria-label={t('bs.selectTexture', { name: title })}
            aria-pressed={selected}
            onClick={() => onSelect(texture)}
          />
        ) : (
          <a
            className={styles.previewLink}
            href={`#/skinlib/show/${texture.id}`}
            aria-label={t('bs.viewTexture', { name: title })}
          />
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.name}>
          {!texture.public && (
            <span title={t('common.private')} aria-label={t('common.private')}>
              ▣
            </span>
          )}
          <a href={`#/skinlib/show/${texture.id}`} title={title}>
            {title}
          </a>
          {onSelect && (
            <a
              className={styles.settings}
              href={`#/skinlib/show/${texture.id}`}
              aria-label={t('texture.manage')}
            >
              ⚙
            </a>
          )}
        </div>
        {!onSelect && (
          <div className={styles.meta}>
            <span className={styles.type}>
              {t(
                texture.type === 2
                  ? 'library.cape'
                  : texture.type === 1
                    ? 'library.alex'
                    : 'library.steve',
              )}
            </span>
            {onToggle ? (
              <button
                type="button"
                className={`${styles.like} ${liked ? styles.liked : ''}`}
                disabled={busy}
                aria-pressed={liked}
                onClick={() => onToggle(texture)}
              >
                <span aria-hidden="true">{liked ? '♥' : '♡'}</span>{' '}
                {t(liked ? 'bs.collected' : 'texture.collect')}
              </button>
            ) : (
              <a className={styles.like} href={`#/skinlib/show/${texture.id}`}>
                <span aria-hidden="true">♡</span> {t('texture.collect')}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
