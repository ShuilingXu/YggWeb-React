import { ApiError } from '../api/client'
import { oidcApi } from '../api/resources'
import { t } from '../i18n'

const STATE_KEY = 'ygg.oidc.state'
const LINK_KEY = 'ygg.oidc.link'

/** 一次性 state 只绑定本标签页的发起动作，不进 localStorage、URL 或日志。 */
export async function beginOidc(link: boolean): Promise<void> {
  const flow = await oidcApi.start(link)
  try {
    sessionStorage.setItem(STATE_KEY, flow.state)
    sessionStorage.setItem(LINK_KEY, String(link))
  } catch {
    throw new ApiError(0, t('oidc.storageUnavailable'))
  }
  window.location.assign(flow.url)
}

export function takeOidcFlow(): { state: string; link: boolean } | null {
  try {
    const state = sessionStorage.getItem(STATE_KEY) ?? ''
    const link = sessionStorage.getItem(LINK_KEY) === 'true'
    sessionStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(LINK_KEY)
    return state ? { state, link } : null
  } catch {
    return null
  }
}
