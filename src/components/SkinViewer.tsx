import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SkinViewer as Viewer } from 'skinview3d'
import { getTextureImage } from '../api/textures'
import { Button, Notice } from './UI'
import { t } from '../i18n/zh-CN'
import styles from './SkinViewer.module.css'

interface Props {
  textureId?: string
  type?: 0 | 1 | 2
  localFile?: File
  skinId?: string
  capeId?: string
  name?: string
  children?: ReactNode
}
const animations = ['viewer.walk', 'viewer.run', 'viewer.fly', 'viewer.idle'] as const
const colors = { white: 'viewer.white', black: 'viewer.black', gray: 'viewer.gray' } as const
const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`

export function SkinViewer({
  textureId,
  type = 0,
  localFile,
  skinId,
  capeId,
  name,
  children,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const library = useRef<typeof import('skinview3d') | null>(null)
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const [paused, setPaused] = useState(reduced)
  const [rotating, setRotating] = useState(() => !reduced())
  const [animation, setAnimation] = useState(0)
  const [background, setBackground] = useState(() => {
    const theme = document.documentElement.dataset.theme
    return theme === 'dark' ||
      (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'gray'
      : 'white'
  })
  const [elytra, setElytra] = useState(false)
  const [ready, setReady] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [error, setError] = useState('')
  const [backgroundError, setBackgroundError] = useState(false)
  const [retry, setRetry] = useState(0)
  const actualSkin = skinId || (type !== 2 ? textureId : undefined)
  const actualCape = capeId || (type === 2 ? textureId : undefined)
  const hasCape = Boolean(actualCape || (localFile && type === 2))
  const defaultSkin = !actualSkin && !(localFile && type !== 2)

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => {
      if (query.matches) {
        setPaused(true)
        setRotating(false)
      }
    }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    let instance: Viewer | null = null
    let observer: ResizeObserver | null = null
    setReady(false)
    setError('')
    async function image(source: string) {
      const result = new Image()
      result.src = source
      await result.decode()
      return result
    }
    async function source(id?: string, file?: File) {
      if (!id && !file) return undefined
      const blob = file ?? (await getTextureImage(id!, 'file', 128, controller.signal))
      if (controller.signal.aborted) return undefined
      const url = URL.createObjectURL(blob)
      urls.push(url)
      return image(url)
    }
    async function load() {
      try {
        const [module, skin, cape] = await Promise.all([
          import('skinview3d'),
          defaultSkin
            ? image(asset('steve.png'))
            : source(actualSkin, type !== 2 ? localFile : undefined),
          source(actualCape, type === 2 ? localFile : undefined),
        ])
        if (controller.signal.aborted || !canvas.current || !stage.current) return
        library.current = module
        instance = new module.SkinViewer({
          canvas: canvas.current,
          width: stage.current.clientWidth,
          height: stage.current.clientHeight,
          zoom: 0.7,
        })
        // 负 bias 仍选择基础纹理层，限制到 WebGL 范围以消除 ANGLE 的采样警告。
        instance.fxaaPass.material.fragmentShader =
          instance.fxaaPass.material.fragmentShader.replaceAll('-100.0', '-16.0')
        if (skin)
          instance.loadSkin(skin, {
            model: defaultSkin ? 'default' : type === 1 ? 'slim' : 'default',
          })
        if (cape) instance.loadCape(cape)
        viewer.current = instance
        observer = new ResizeObserver((entries) => {
          const rect = entries[0]?.contentRect
          if (rect && instance && !instance.disposed)
            instance.setSize(Math.max(1, rect.width), Math.max(1, rect.height))
        })
        observer.observe(stage.current)
        setGeneration((value) => value + 1)
        setReady(true)
      } catch {
        if (!controller.signal.aborted) setError(t('viewer.error'))
      }
    }
    void load()
    return () => {
      controller.abort()
      observer?.disconnect()
      if (viewer.current === instance) viewer.current = null
      instance?.dispose()
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [actualSkin, actualCape, localFile, type, defaultSkin, retry])

  useEffect(() => {
    const instance = viewer.current,
      module = library.current
    if (!ready || !instance || !module) return
    const factories = [
      module.WalkingAnimation,
      module.RunningAnimation,
      module.FlyingAnimation,
      module.IdleAnimation,
    ]
    const Animation = factories[animation]
    if (Animation) instance.animation = new Animation()
  }, [animation, ready, generation])
  useEffect(() => {
    const instance = viewer.current
    if (!ready || !instance) return
    if (instance.animation) instance.animation.paused = paused
    instance.autoRotate = rotating
    if (hasCape) instance.playerObject.backEquipment = elytra ? 'elytra' : 'cape'
    else instance.resetCape()
  }, [paused, rotating, elytra, animation, ready, generation, hasCape])
  useEffect(() => {
    const instance = viewer.current
    if (!ready || !instance) return
    let active = true
    setBackgroundError(false)
    if (background === 'white' || background === 'gray' || background === 'black') {
      const color = getComputedStyle(stage.current!)
        .getPropertyValue(`--viewer-${background}`)
        .trim()
      instance.background = color
    } else {
      const image = new Image()
      image.src = asset(`viewer/${background}.webp`)
      image
        .decode()
        .then(() => {
          if (active && !instance.disposed) instance.loadBackground(image)
        })
        .catch(() => {
          if (active) setBackgroundError(true)
        })
    }
    return () => {
      active = false
    }
  }, [background, ready, generation])

  function picture(direction: number) {
    const current = Number(background)
    setBackground(
      String(
        Number.isInteger(current) && current >= 1 && current <= 7
          ? ((current - 1 + direction + 7) % 7) + 1
          : direction > 0
            ? 1
            : 7,
      ),
    )
  }
  return (
    <section className={`panel ${styles.card}`}>
      <header className={styles.header}>
        <h2>{t('viewer.title')}</h2>
        <div className={styles.tools}>
          {hasCape && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => setElytra((value) => !value)}
              aria-label={t('viewer.equipment')}
              title={t('viewer.equipment')}
            >
              ▱
            </button>
          )}
          <select
            aria-label={t('viewer.animation')}
            value={animation}
            disabled={!ready}
            onChange={(event) => setAnimation(Number(event.target.value))}
          >
            {animations.map((label, index) => (
              <option key={label} value={index}>
                {t(label)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!ready}
            onClick={() => setPaused((value) => !value)}
            aria-label={t(paused ? 'viewer.play' : 'viewer.pause')}
            title={t(paused ? 'viewer.play' : 'viewer.pause')}
          >
            {paused ? '▶' : 'Ⅱ'}
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => setRotating((value) => !value)}
            aria-pressed={rotating}
            aria-label={t('viewer.rotate')}
            title={t('viewer.rotate')}
          >
            ⟳
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => viewer.current?.resetCameraPose()}
            aria-label={t('viewer.reset')}
            title={t('viewer.reset')}
          >
            ⌂
          </button>
        </div>
      </header>
      {defaultSkin && <p className={styles.indicator}>{t('viewer.default')}</p>}
      <div className={styles.stage} ref={stage} aria-busy={!ready && !error}>
        <canvas ref={canvas} aria-label={name || t('viewer.title')} role="img" />
        {!ready && !error && <p className={styles.loading}>{t('viewer.loading')}</p>}
      </div>
      {error && (
        <div className={styles.feedback}>
          <Notice tone="error">
            {error}
            <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
              {t('common.retry')}
            </Button>
          </Notice>
        </div>
      )}
      <footer className={styles.footer}>
        <div className={styles.backgrounds}>
          {(['white', 'black', 'gray'] as const).map((color) => (
            <button
              key={color}
              type="button"
              className={styles[color]}
              aria-label={t(colors[color])}
              title={t(colors[color])}
              aria-pressed={background === color}
              onClick={() => setBackground(color)}
            />
          ))}
          <button
            type="button"
            className={styles.picture}
            aria-label={t('viewer.previous')}
            title={t('viewer.previous')}
            onClick={() => picture(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className={styles.picture}
            aria-label={t('viewer.next')}
            title={t('viewer.next')}
            onClick={() => picture(1)}
          >
            →
          </button>
          <small>
            {Number(background)
              ? t('viewer.picture', { number: background })
              : t(
                  background === 'white'
                    ? 'viewer.white'
                    : background === 'black'
                      ? 'viewer.black'
                      : 'viewer.gray',
                )}
          </small>
        </div>
        {backgroundError && <Notice tone="error">{t('viewer.backgroundError')}</Notice>}
        <small className={styles.hint}>{t('viewer.controls')}</small>
        {children}
      </footer>
    </section>
  )
}
