import { useEffect, useRef, useState } from 'react'
import { SkinViewer as Viewer } from 'skinview3d'
import { t } from '../i18n/zh-CN'
import { Button } from './UI'
export default function SkinViewer({ src, slim, fallback }: { src: string
  slim: boolean
  fallback: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const [rotating, setRotating] = useState(!matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    let disposed = false
    let skin: Viewer | null = null
    try {
      skin = new Viewer({ canvas: canvas.current!, width: canvas.current!.parentElement!.clientWidth, height: 400 })
      viewer.current = skin
      canvas.current!.dataset.webgl = String(!skin.renderer.getContext().isContextLost())
      skin.autoRotate = rotating
      skin.autoRotateSpeed = 0.4
      skin.loadSkin(src, { model: slim ? 'slim' : 'default' }).catch(() => { if (!disposed) fallback() })
    } catch { fallback() }
    const observer = new ResizeObserver(entries => { if (skin) skin.width = entries[0].contentRect.width })
    if (canvas.current?.parentElement) observer.observe(canvas.current.parentElement)
    return () => { disposed = true
      observer.disconnect()
      skin?.dispose()
      viewer.current = null }
  }, [src, slim])
  return <div className="viewer"><canvas ref={canvas} aria-label={t('preview3d')} /><div className="viewer-tools"><small>{t('dragHint')}</small><Button aria-pressed={rotating} onClick={() => { setRotating(!rotating)
    if (viewer.current) viewer.current.autoRotate = !rotating }}>{t('rotate')}</Button></div></div>
}
