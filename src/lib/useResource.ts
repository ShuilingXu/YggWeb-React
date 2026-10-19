import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../api/client'

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [value, setValue] = useState<T>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setValue(data)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [load, version])
  return { value, error, loading, reload }
}
