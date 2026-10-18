import { requestBlob } from '../api/client'

const objectUrls = new Map<string, string>()
const pending = new Map<string, Promise<string>>()

export function texturePreviewUrl(uuid: string, size: number): string {
  return `/api/textures/${uuid}/preview?size=${size}`
}

export function textureAvatarUrl(uuid: string, size: number): string {
  return `/api/textures/${uuid}/avatar?size=${size}`
}

export function textureFileUrl(uuid: string): string {
  return `/api/textures/${uuid}/file`
}

/** 头像、预览、原图都要带 Web 令牌，`<img src>` 没法带头，所以取 blob 再转 object URL。 */
export async function authenticatedImage(url: string, signal?: AbortSignal): Promise<string> {
  const cached = objectUrls.get(url)
  if (cached) return cached
  let promise = pending.get(url)
  if (!promise) {
    promise = requestBlob(url, { signal }).then((blob) => {
      const objectUrl = URL.createObjectURL(blob)
      objectUrls.set(url, objectUrl)
      return objectUrl
    })
    pending.set(url, promise)
    promise.catch(() => pending.delete(url))
  }
  return promise
}

/** 换账号或退出时必须释放上一账号的预览 blob，避免串号。 */
export function clearAuthenticatedImages(): void {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url)
  objectUrls.clear()
  pending.clear()
}

/** 后端 profile 里给的是公网绝对地址，这里改成本站路径以便走开发代理。 */
export function toDistributedPath(url: string): string {
  try {
    const parsed = new URL(url, window.location.href)
    if (parsed.pathname.startsWith('/textures/')) return parsed.pathname
    return url
  } catch {
    return url
  }
}
