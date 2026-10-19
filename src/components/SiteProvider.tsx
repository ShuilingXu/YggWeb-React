import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { errorMessage } from '../api/client'
import { siteApi } from '../api/resources'
import type { SiteSettings } from '../api/types'
import { useAsync } from '../lib/useAsync'

type SiteContextValue = {
  site: SiteSettings | null
  loading: boolean
  error: string | null
  reload: () => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

/** 站点公开规则在多处使用，只在根部取一次；管理页保存后调用 reload。 */
export function SiteProvider({ children }: { children: ReactNode }) {
  const state = useAsync((signal) => siteApi.get(signal), [])
  const value = useMemo<SiteContextValue>(
    () => ({
      site: state.data,
      loading: state.loading,
      error: state.error ? errorMessage(state.error) : null,
      reload: state.reload,
    }),
    [state.data, state.loading, state.error, state.reload],
  )
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteContextValue {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside SiteProvider')
  return context
}
