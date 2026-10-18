import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'ygg.theme'

export function resolveInitialTheme(): Theme {
  const fromDom = document.documentElement.dataset.theme
  if (fromDom === 'light' || fromDom === 'dark') return fromDom
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // 存储不可用时按系统偏好。
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // 主题偏好写不进去也不影响当前会话。
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
