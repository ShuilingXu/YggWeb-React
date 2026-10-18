import { useState } from 'react'

type Props = {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  checker?: boolean
}

/**
 * 所有材质图片的唯一入口：棋盘格 + 最近邻缩放 + 加载失败兜底。
 */
export function TextureImage({ src, alt, width, height, className, checker = true }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={className}
        role="img"
        aria-label={`${alt}（加载失败）`}
        style={{
          display: 'grid',
          placeItems: 'center',
          width,
          height,
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-md)',
        }}
      >
        —
      </span>
    )
  }

  return (
    <img
      className={['pixelated', checker ? 'checker' : '', className ?? ''].filter(Boolean).join(' ')}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
