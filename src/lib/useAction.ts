import { useEffect, useRef, useState } from 'react'
import { useToast } from '../components/UI'
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const toast = useToast()
  useEffect(() => () => controller.current?.abort(), [])
  const run = async (action: (signal: AbortSignal) => Promise<unknown>, success?: string, after?: () => void) => {
    if (controller.current && !controller.current.signal.aborted) return
    const current = new AbortController()
    controller.current = current
    setBusy(true)
    setError('')
    try {
      await action(current.signal)
      if (!current.signal.aborted) {
        if (success) toast(success)
        after?.()
      }
    } catch (error) {
      if (!current.signal.aborted) setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (!current.signal.aborted) setBusy(false)
      controller.current = null
    }
  }
  return { busy, error, run }
}
