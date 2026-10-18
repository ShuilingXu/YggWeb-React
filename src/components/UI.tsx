import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { t } from '../i18n/zh-CN'
import styles from './UI.module.css'
export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return <button className={`${styles.button} ${styles[variant]} ${className}`} {...props} />
}
export function Field({
  label,
  children,
  help,
  error,
}: {
  label: string
  children: ReactNode
  help?: string
  error?: string
}) {
  const id = useId()
  const helpId = id + '-help',
    errorId = id + '-error'
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  const control =
    isValidElement(children) && typeof children.type === 'string'
      ? cloneElement(children as ReactElement<HTMLAttributes<HTMLElement>>, {
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
        })
      : children
  return (
    <div className={styles.field}>
      <label>
        {label}
        <span className={styles.control}>{control}</span>
      </label>
      {help && <small id={helpId}>{help}</small>}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'error' | 'success' | 'info'
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`${styles.notice} ${styles[tone]}`}
    >
      {children}
    </div>
  )
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className={styles.empty}>
      <p>{title}</p>
      {description && <small>{description}</small>}
      {action}
    </div>
  )
}
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const previous = document.activeElement
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
    return () => {
      if (d.open) d.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button type="button" aria-label={t('common.close')} onClick={onClose}>
          ×
        </button>
      </header>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  )
}
export function Pagination({
  offset,
  total,
  limit,
  onChange,
}: {
  offset: number
  total: number
  limit: number
  onChange: (offset: number) => void
}) {
  return (
    <nav className={styles.pagination} aria-label={t('common.pagination')}>
      <Button
        variant="secondary"
        disabled={!offset}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        {t('common.previous')}
      </Button>
      <span aria-current="page">
        {t('common.page', { page: Math.floor(offset / limit) + 1, total })}
      </span>
      <Button
        variant="secondary"
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        {t('common.next')}
      </Button>
    </nav>
  )
}
