import { useEffect, useState } from 'react'
import { errorMessage, isApiError } from '../api/client'

import { oidcApi } from '../api/resources'
import { useAuth } from '../lib/auth'
import { takeOidcFlow } from '../lib/oidc'
import { Link, navigate, useRoute } from '../lib/router'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { ErrorState, Skeleton } from '../components/ui'

function callbackError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 409) return t('oidc.conflict')
    if (error.status === 403) return t('oidc.denied')
    if (error.status === 503) return t('oidc.unavailable')
  }
  return errorMessage(error)
}

export function OidcCallbackPage() {
  const { loginWithToken } = useAuth()
  const route = useRoute()
  const [request] = useState(() => ({
    state: route.search.get('state') ?? '',
    code: route.search.get('code') ?? '',
    error: route.search.get('error') ?? '',
  }))
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    // StrictMode 下第一次挂载会被清理，延后到稳定挂载再消费一次性 state。
    const timer = window.setTimeout(() => {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#/oidc/callback`,
      )
      if (request.error) {
        setError(t('oidc.providerError'))
        return
      }
      if (!request.code || !request.state) {
        setError(t('oidc.invalid'))
        return
      }
      const flow = takeOidcFlow()
      if (!flow || flow.state !== request.state) {
        setError(t('oidc.invalid'))
        return
      }
      oidcApi.complete(request.state, request.code).then(
        async (response) => {
          if (controller.signal.aborted) return
          try {
            await loginWithToken(response.accessToken)
            if (controller.signal.aborted) return
            setDone(true)
            navigate(flow.link ? '/profile' : '/', { replace: true })
          } catch (caught) {
            if (!controller.signal.aborted) setError(callbackError(caught))
          }
        },
        (caught: unknown) => {
          if (!controller.signal.aborted) setError(callbackError(caught))
        },
      )
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loginWithToken, request])

  if (error) {
    return (
      <>
        <PageHeader title={t('oidc.completing')} />
        <ErrorState message={error} />
        <p style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
          <Link to="/login">{t('nav.login')}</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <PageHeader title={done ? t('oidc.success') : t('oidc.completing')} />
      <Skeleton height={120} />
    </>
  )
}
