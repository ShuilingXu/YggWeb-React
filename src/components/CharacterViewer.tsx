import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { t } from '../i18n/zh-CN'
import { Button } from './UI'

const SkinViewer = lazy(() => import('./SkinViewer'))

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

const DOLL_PARTS = [
  ['head', 8, 8],
  ['body', 20, 20],
  ['armLeft', 44, 20],
  ['armRight', 36, 52],
  ['legLeft', 4, 20],
  ['legRight', 20, 52],
] as const

/** 纯 CSS 拼的像素小人：3D 不可用时仍能看到角色外观。 */
function SkinDoll({ textureUrl, label }: { textureUrl: string; label: string }) {
  return (
    <div className="doll" role="img" aria-label={label}>
      {DOLL_PARTS.map(([name, x, y]) => (
        <span
          key={name}
          className={`doll__part doll__part--${name}`}
          style={{
            backgroundImage: `url("${textureUrl}")`,
            // 每个部位取 64×64 皮肤里的对应面：百分比 = 像素坐标 / 56（背景 800%）
            backgroundPosition: `${((x / 56) * 100).toFixed(4)}% ${((y / 56) * 100).toFixed(4)}%`,
          }}
        />
      ))}
    </div>
  )
}

export type CharacterViewerProps = {
  skinUrl?: string | null
  capeUrl?: string | null
  model?: 'default' | 'slim'
  alt: string
  /** 详情页允许在 3D 与平面图之间切换；卡片位只做 3D + 像素小人兜底 */
  allowToggle?: boolean
  flatSrc?: string | null
  /** 首屏之外的卡片延迟创建 WebGL 上下文，避免大量 canvas */
  lazy?: boolean
  /** 只渲染画布区域（角色卡片用），不带工具条 */
  compact?: boolean
}

export function CharacterViewer({
  skinUrl,
  capeUrl,
  model = 'default',
  alt,
  allowToggle = false,
  flatSrc = null,
  lazy = false,
  compact = false,
}: CharacterViewerProps) {
  const [webgl] = useState(supportsWebGL)
  const [mode, setMode] = useState<'3d' | 'flat'>(webgl ? '3d' : 'flat')
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(!lazy)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!lazy || visible) return
    const element = stageRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '180px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [lazy, visible])

  const use3d = webgl && mode === '3d' && !failed && Boolean(skinUrl)

  const content = use3d && skinUrl && visible ? (
    <Suspense fallback={<span className="viewer__fallback">{t('common.loading')}</span>}>
      <SkinViewer
        skinUrl={skinUrl}
        capeUrl={capeUrl}
        model={model}
        zoom={compact ? 0.85 : 0.92}
        autoRotate={!compact}
        onError={() => setFailed(true)}
      />
    </Suspense>
  ) : flatSrc ? (
    <img className="pixel viewer__flat" src={flatSrc} alt={alt} />
  ) : skinUrl ? (
    <SkinDoll textureUrl={skinUrl} label={alt} />
  ) : (
    <span className="viewer__fallback">{t('players.none')}</span>
  )

  if (compact) {
    return (
      <div className="viewer__stage viewer__stage--compact" ref={stageRef}>
        {content}
      </div>
    )
  }

  return (
    <div className="viewer">
      <div className="viewer__stage" ref={stageRef}>
        {content}
      </div>
      <div className="viewer__bar">
        {allowToggle && webgl ? (
          <div className="row">
            <Button
              size="sm"
              variant={mode === '3d' && !failed ? 'grass' : 'default'}
              aria-pressed={mode === '3d' && !failed}
              onClick={() => setMode('3d')}
            >
              {t('texture.view.3d')}
            </Button>
            <Button
              size="sm"
              variant={mode === 'flat' || failed ? 'grass' : 'default'}
              aria-pressed={mode === 'flat' || failed}
              onClick={() => setMode('flat')}
            >
              {t('texture.view.flat')}
            </Button>
          </div>
        ) : (
          <span />
        )}
        <span className="viewer__hint">
          {!webgl
            ? t('texture.view.unsupported')
            : use3d
              ? t('texture.view.hint')
              : t('texture.view.flat')}
        </span>
      </div>
    </div>
  )
}
