import { useEffect, useState } from 'react'
import { imageBlob } from '../api/client'
import type { Texture } from '../api/types'
export function useTextureImages(textures: Texture[] | undefined) {
  const [images, setImages] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    setImages({})
      setFailed({})
    for (const texture of textures || []) {
      if (texture.state === 1) { setFailed(old => ({ ...old, [texture.id]: true }))
        continue }
      imageBlob(`/api/textures/${texture.id}/preview?size=256`, controller.signal).then(blob => {
        if (!controller.signal.aborted) { const url = URL.createObjectURL(blob)
          urls.push(url)
          setImages(old => ({ ...old, [texture.id]: url })) }
      }).catch(() => { if (!controller.signal.aborted) setFailed(old => ({ ...old, [texture.id]: true })) })
    }
    return () => { controller.abort()
      urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [textures])
  return { images, failed, fail: (id: string) => setFailed(old => ({ ...old, [id]: true })) }
}
