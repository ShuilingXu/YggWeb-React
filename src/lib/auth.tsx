import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getToken, setSessionVerifier, setToken, setUnauthorizedHandler } from '../api/client'
import { authApi } from '../api/resources'
import type { Account } from '../api/types'

type AuthState =
  | { status: 'anonymous'; account: null }
  | { status: 'authenticated'; account: Account }

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<void>
  /** OIDC 回调已经拿到本站 accessToken，直接恢复账号。 */
  loginWithToken: (accessToken: string) => Promise<void>
  logout: () => Promise<void>
  /** 服务端已撤销令牌时只清理本地状态。 */
  endSession: () => void
  refresh: () => Promise<void>
  isAdmin: boolean
  isOwner: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'anonymous', account: null })
  const [restoring, setRestoring] = useState(() => getToken() !== null)

  const refresh = useCallback(async () => {
    try {
      const account = await authApi.me()
      setState({ status: 'authenticated', account })
    } catch {
      setToken(null)
      setState({ status: 'anonymous', account: null })
    }
  }, [])

  const endSession = useCallback(() => {
    setToken(null)
    setState({ status: 'anonymous', account: null })
  }, [])

  const loginWithToken = useCallback(async (accessToken: string) => {
    setToken(accessToken)
    try {
      const account = await authApi.me()
      setState({ status: 'authenticated', account })
    } catch (error) {
      setToken(null)
      setState({ status: 'anonymous', account: null })
      throw error
    }
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await authApi.login(identifier, password)
      await loginWithToken(response.accessToken)
    },
    [loginWithToken],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 令牌可能已失效，仍然清理本地状态。
    }
    endSession()
  }, [endSession])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setState({ status: 'anonymous', account: null })
    })
    setSessionVerifier(async () => {
      try {
        await authApi.me()
        return true
      } catch {
        return false
      }
    })
    if (getToken()) {
      authApi
        .me()
        .then((account) => setState({ status: 'authenticated', account }))
        .catch(() => {
          setToken(null)
          setState({ status: 'anonymous', account: null })
        })
        .finally(() => setRestoring(false))
    }
    return () => {
      setUnauthorizedHandler(null)
      setSessionVerifier(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      loginWithToken,
      logout,
      endSession,
      refresh,
      isAdmin: state.status === 'authenticated' && state.account.permission >= 1,
      isOwner: state.status === 'authenticated' && state.account.permission >= 2,
    }),
    [state, login, loginWithToken, logout, endSession, refresh],
  )

  return (
    <AuthContext.Provider value={value}>
      {restoring ? null : children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
