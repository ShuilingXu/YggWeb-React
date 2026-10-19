import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { t } from '../i18n/zh-CN'
import { pageCount } from '../lib/paging'
import { IconWarning } from './Icons'

type ButtonVariant = 'default' | 'primary' | 'grass' | 'gold' | 'danger' | 'ghost'

export function buttonClass(
  variant: ButtonVariant = 'default',
  size: 'md' | 'sm' = 'md',
  block = false,
  extra?: string,
): string {
  return [
    'mc-btn',
    variant === 'default' ? '' : `mc-btn--${variant}`,
    size === 'sm' ? 'mc-btn--sm' : '',
    block ? 'mc-btn--block' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
}

export function Button({
  variant = 'default',
  size = 'md',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, block, className)} {...rest} />
}

export function LinkButton({
  href,
  variant = 'default',
  size = 'md',
  block = false,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  block?: boolean
}) {
  return (
    <a href={href} className={buttonClass(variant, size, block, className)} {...rest}>
      {children}
    </a>
  )
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required = false,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  )
}

export function Badge({ tone = 'muted', children }: { tone?: string; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'danger'
  children: ReactNode
}) {
  return (
    <div
      className={`notice ${tone === 'info' ? '' : `notice--${tone}`}`}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <span className="notice__mark" aria-hidden="true">
        {tone === 'info' ? 'i' : '!'}
      </span>
      <div>{children}</div>
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabs.findIndex((tab) => tab.value === value)
    const step = event.key === 'ArrowRight' ? 1 : tabs.length - 1
    const next = tabs[(index + step) % tabs.length]
    if (next) onChange(next.value)
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab.value === value}
          tabIndex={tab.value === value ? 0 : -1}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : []
    focusables()[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const index = items.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.shiftKey
        ? index <= 0
          ? items.length - 1
          : index - 1
        : index === -1 || index === items.length - 1
          ? 0
          : index + 1
      event.preventDefault()
      items[nextIndex]?.focus()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <div className="dialog__head">
          <h2 className="dialog__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="toast__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>
        <div className="dialog__body">{children}</div>
        {footer ? <div className="dialog__foot">{footer}</div> : null}
      </div>
    </div>
  )
}

type ToastKind = 'ok' | 'error' | 'info'
type ToastItem = { id: number; kind: ToastKind; text: string }
type ToastApi = { notify: (kind: ToastKind, text: string) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
    },
    [],
  )

  const notify = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { id, kind, text }])
    const timer = window.setTimeout(
      () => setItems((current) => current.filter((item) => item.id !== id)),
      kind === 'error' ? 6000 : 4000,
    )
    timers.current.push(timer)
  }, [])

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div key={item.id} className={`toast toast--${item.kind}`}>
            <span className="toast__mark" aria-hidden="true">
              {item.kind === 'ok' ? '✓' : item.kind === 'error' ? '!' : 'i'}
            </span>
            <span className="toast__text">{item.text}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(item.id)}
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast 必须在 ToastProvider 内使用')
  return context
}

export function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number
  limit: number
  total: number
  onChange: (offset: number) => void
}) {
  const pages = pageCount(total, limit)
  const current = Math.min(pages, Math.floor(offset / limit) + 1)
  if (pages <= 1) return null

  const start = Math.max(1, Math.min(current - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  const numbers: number[] = []
  for (let page = start; page <= end; page += 1) numbers.push(page)

  return (
    <nav className="pager" aria-label={t('common.pageInfo', { page: current, pages })}>
      <button
        type="button"
        className="pager__btn"
        onClick={() => onChange((current - 2) * limit)}
        disabled={current === 1}
      >
        {t('common.prev')}
      </button>
      {numbers.map((page) => (
        <button
          key={page}
          type="button"
          className="pager__btn"
          aria-current={page === current ? 'page' : undefined}
          onClick={() => onChange((page - 1) * limit)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="pager__btn"
        onClick={() => onChange(current * limit)}
        disabled={current === pages}
      >
        {t('common.next')}
      </button>
      <span className="pager__info">
        {t('common.pageInfo', { page: current, pages })} · {t('common.total', { total })}
      </span>
    </nav>
  )
}

export function Skeleton({
  width,
  height,
  className,
}: {
  width?: number | string
  height?: number | string
  className?: string
}) {
  return (
    <div
      className={['skeleton', className ?? ''].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const { notify } = useToast()
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          notify('ok', t('common.copied'))
        } catch {
          notify('error', t('error.network'))
        }
      }}
    >
      {label}
    </Button>
  )
}

export function Spinner() {
  return <span className="spinner" role="status" aria-label={t('common.loading')} />
}

export function LoadingState({ text = t('common.loading') }: { text?: string }) {
  return (
    <div className="state" role="status">
      <Spinner />
      <span className="state__text">{text}</span>
    </div>
  )
}

export function EmptyState({
  title,
  text,
  art = '?',
  children,
}: {
  title: string
  text?: string
  art?: string
  children?: ReactNode
}) {
  return (
    <div className="state">
      <span className="state__art" aria-hidden="true">
        {art}
      </span>
      <span className="state__title">{title}</span>
      {text ? <span className="state__text">{text}</span> : null}
      {children ? <div className="state__actions">{children}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state">
      <span className="state__art" aria-hidden="true">
        <IconWarning size={24} />
      </span>
      <span className="state__title">{message}</span>
      {onRetry ? (
        <div className="state__actions">
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        </div>
      ) : null}
    </div>
  )
}
