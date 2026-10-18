import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getToken, setSessionVerifier, setToken, setUnauthorizedHandler } from '../api/client'
import { authApi } from '../api/resources'
import type { Account } from '../api/types'

type AuthState =
  | { status: 'anonymous'; account: null }
  | { status: 'authenticated'; account: Account }

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  isAdmin: boolean
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

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await authApi.login(identifier, password)
      setToken(response.accessToken)
      const account = await authApi.me()
      setState({ status: 'authenticated', account })
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 令牌可能已失效，仍然清理本地状态。
    }
    setToken(null)
    setState({ status: 'anonymous', account: null })
  }, [])

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
      logout,
      refresh,
      isAdmin: state.status === 'authenticated' && state.account.permission >= 1,
    }),
    [state, login, logout, refresh],
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
