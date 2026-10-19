import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getToken, setSessionLostHandler, setToken } from '../api/client'
import { PERMISSION } from '../api/enums'
import {
  fetchAccount,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/resources'
import type { Account } from '../api/types'
import { t } from '../i18n/zh-CN'
import { clearAuthenticatedImages } from '../lib/images'
import { useToast } from './UI'

type AuthValue = {
  account: Account | null
  /** 启动时用已存令牌回查账号，期间不应把未登录界面闪出来 */
  restoring: boolean
  loggedIn: boolean
  isAdmin: boolean
  isOwner: boolean
  login: (username: string, password: string) => Promise<void>
  /** OIDC 回调已拿到 accessToken，直接换成当前账号，不再重复登录。 */
  loginWithToken: (accessToken: string) => Promise<void>
  logout: () => Promise<void>
  /** 改密/改邮箱/注销后服务端已撤销令牌，只清理本地状态即可 */
  endSession: () => void
  refreshAccount: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast()
  const [account, setAccount] = useState<Account | null>(null)
  const [restoring, setRestoring] = useState(() => Boolean(getToken()))

  const clear = useCallback(() => {
    setToken(null)
    clearAuthenticatedImages()
    setAccount(null)
  }, [])

  useEffect(() => {
    if (!getToken()) return
    let alive = true
    fetchAccount().then(
      (value) => {
        if (alive) setAccount(value)
      },
      () => {
        if (alive) clear()
      },
    ).finally(() => {
      if (alive) setRestoring(false)
    })
    return () => {
      alive = false
    }
  }, [clear])

  useEffect(() => {
    setSessionLostHandler(() => {
      clear()
      notify('error', t('error.sessionExpired'))
    })
    return () => setSessionLostHandler(null)
  }, [clear, notify])

  const loginWithToken = useCallback(async (accessToken: string) => {
    clearAuthenticatedImages()
    setToken(accessToken)
    try {
      setAccount(await fetchAccount())
    } catch (error) {
      setToken(null)
      setAccount(null)
      throw error
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await loginRequest(username, password)
      await loginWithToken(response.accessToken)
    },
    [loginWithToken],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // 服务端令牌可能已失效，本地状态照样清空。
    }
    clear()
  }, [clear])

  const refreshAccount = useCallback(async () => {
    if (!getToken()) return
    setAccount(await fetchAccount())
  }, [])

  const value = useMemo<AuthValue>(() => {
    const permission = account?.permission ?? PERMISSION.USER
    return {
      account,
      restoring: restoring && Boolean(getToken()),
      loggedIn: Boolean(account),
      isAdmin: permission >= PERMISSION.ADMIN,
      isOwner: permission >= PERMISSION.OWNER,
      login,
      loginWithToken,
      logout,
      endSession: clear,
      refreshAccount,
    }
  }, [account, restoring, login, loginWithToken, logout, clear, refreshAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return context
}
