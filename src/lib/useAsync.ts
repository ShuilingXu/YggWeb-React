import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, isAbortError } from '../api/client'

export type AsyncState<T> = {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * 统一的取数状态：自带 AbortController，卸载或依赖变化时中止请求。
 * 展示组件不取数，页面用这个 hook 拿数据后把结果传下去。
 */
export function useAsync<T>(
  task: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> & { reload: () => void } {
  const enabled = options.enabled ?? true
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: enabled,
  })
  const [version, setVersion] = useState(0)
  const taskRef = useRef(task)
  taskRef.current = task

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false })
      return
    }
    const controller = new AbortController()
    let alive = true
    setState((current) => ({ ...current, loading: true, error: null }))
    taskRef.current(controller.signal).then(
      (data) => {
        if (alive) setState({ data, error: null, loading: false })
      },
      (error: unknown) => {
        if (!alive || isAbortError(error)) return
        setState({ data: null, error: errorMessage(error), loading: false })
      },
    )
    return () => {
      alive = false
      controller.abort()
    }
  }, [...deps, version, enabled])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  return { ...state, reload }
}

export type SubmitState = {
  busy: boolean
  error: string | null
  run: (task: () => Promise<void>) => Promise<boolean>
  clearError: () => void
}

/** 写操作的忙碌/错误状态；错误留在页面可见位置，不吞掉。 */
export function useSubmit(): SubmitState {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      await task()
      return true
    } catch (caught) {
      if (!isAbortError(caught) && mountedRef.current) setError(errorMessage(caught))
      return false
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { busy, error, run, clearError }
}
