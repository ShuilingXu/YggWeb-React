import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(() => readTheme())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (localStorage.getItem('ygg.theme')) return
      const next: Theme = media.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      setThemeState(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    // 主题偏好不是凭证数据，可以本地保存。
    localStorage.setItem('ygg.theme', next)
    setThemeState(next)
  }, [])

  return { theme, toggle }
}
