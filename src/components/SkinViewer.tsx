import { useEffect, useRef, useState } from 'react'
import * as skinview3d from 'skinview3d'
import { t } from '../i18n'

type Props = {
  skin?: string
  cape?: string
  slim?: boolean
}

/** 懒加载的 3D 预览：无 WebGL 时由父组件的 fallback 兜底展示平面图。 */
export default function SkinViewer({ skin, cape, slim = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let viewer: skinview3d.SkinViewer
    try {
      viewer = new skinview3d.SkinViewer({
        canvas,
        width: wrap.clientWidth || 320,
        height: wrap.clientHeight || 320,
        skin,
        cape: cape || undefined,
        model: slim ? 'slim' : 'default',
        zoom: 1,
        enableControls: true,
      })
    } catch {
      setFailed(true)
      return
    }

    viewer.autoRotate = !reduceMotion
    viewer.autoRotateSpeed = 0.6
    if (viewer.controls) viewer.controls.autoRotate = viewer.autoRotate

    const resize = new ResizeObserver(() => {
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      if (width > 0 && height > 0) viewer.setSize(width, height)
    })
    resize.observe(wrap)

    return () => {
      resize.disconnect()
      viewer.dispose()
    }
  }, [skin, cape, slim])

  if (failed) {
    return (
      <p className="muted" role="status" style={{ fontSize: 'var(--text-sm)' }}>
        {t('texture.viewerUnsupported')}
      </p>
    )
  }

  return (
    <div className="skin-viewer" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        aria-label={t('texture.preview3d')}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />
    </div>
  )
}
