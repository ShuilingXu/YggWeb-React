import { useEffect, useState } from 'react'
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, dependencies: unknown[]) {
  const [value, setValue] = useState<T>()
  const [failure, setFailure] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailure(undefined)
    setValue(undefined)
    loader(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setValue(result)
      })
      .catch(error => {
        if (!controller.signal.aborted) setFailure(error)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [...dependencies, revision])
  const error = failure === undefined ? '' : failure instanceof Error ? failure.message : String(failure)
  return { value, error, failure, loading, reload: () => setRevision(value => value + 1) }
}
