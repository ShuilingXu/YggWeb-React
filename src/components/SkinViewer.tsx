import { useEffect, useRef } from 'react'
import { IdleAnimation, SkinViewer as Viewer } from 'skinview3d'

export type SkinViewerProps = {
  skinUrl: string
  capeUrl?: string | null
  model: 'default' | 'slim'
  /** 卡片位画布更矮，需要更小的 zoom 才能完整入镜 */
  zoom?: number
  /** 卡片缩略图保持正面静止，详情页才慢速自转 */
  autoRotate?: boolean
  onError?: () => void
}

/**
 * skinview3d 的体积较大，只能由 CharacterViewer 通过 React.lazy 引入，
 * 保证 3D 渲染不进主 chunk。
 */
export default function SkinViewer({
  skinUrl,
  capeUrl,
  model,
  zoom = 0.92,
  autoRotate = true,
  onError,
}: SkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const errorRef = useRef(onError)
  errorRef.current = onError

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const initial = canvas.getBoundingClientRect()
    const viewer = new Viewer({
      canvas,
      width: Math.max(1, initial.width),
      height: Math.max(1, initial.height),
      zoom,
      fov: 42,
    })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    viewer.autoRotate = autoRotate && !reduceMotion
    viewer.autoRotateSpeed = 0.65
    viewer.controls.enableZoom = false
    viewer.controls.enablePan = false
    viewer.controls.enableDamping = true
    if (!reduceMotion) viewer.animation = new IdleAnimation()

    viewer.loadSkin(skinUrl, { model }).catch(() => errorRef.current?.())
    if (capeUrl) viewer.loadCape(capeUrl).catch(() => {})

    const observer = new ResizeObserver(() => {
      const box = canvas.getBoundingClientRect()
      viewer.setSize(Math.max(1, box.width), Math.max(1, box.height))
    })
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      viewer.dispose()
    }
  }, [skinUrl, capeUrl, model, zoom, autoRotate])

  return <canvas ref={canvasRef} aria-hidden="true" />
}
