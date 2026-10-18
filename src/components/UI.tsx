import { createContext, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { t } from '../i18n/zh-CN'
import { Icon } from './Icons'

export function Button({ children, variant = 'default', busy = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' | 'ghost'
  busy?: boolean }) {
  return <button {...props} disabled={busy || props.disabled} className={`button button-${variant} ${props.className || ''}`} aria-busy={busy}>{busy && <span className="spinner" />}{children}</button>
}
export function Field({ label, error, hint, children }: { label: string
  error?: string
  hint?: string
  children: ReactNode }) {
  const id = useId()
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}{error && <small id={id} role="alert" className="field-error">{error}</small>}</label>
}
export function Badge({ children, tone = '' }: { children: ReactNode
  tone?: string }) { return <span className={`badge ${tone}`}>{children}</span> }
export function EmptyState({ title = t('empty'), text = t('emptyText'), children }: { title?: string
  text?: string
  children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={32} /></span><h2>{title}</h2><p>{text}</p>{children}</div>
}
export function ErrorState({ message, retry }: { message: string
  retry?: () => void }) { return <div role="alert" className="error-state"><Icon name="warning" /><div><strong>{t('loadError')}</strong><p>{message}</p>{retry && <Button onClick={retry}>{t('retry')}</Button>}</div></div> }
export function Skeleton() { return <div className="skeleton-grid" role="status" aria-label={t('loading')}>{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}</div> }
export function Pagination({ offset, limit = 24, total, next, onChange }: { offset: number
  limit?: number
  total: number | null
  next: boolean
  onChange: (offset: number) => void }) {
  if (!offset && !next && (total === null || total <= limit)) return null
  return <nav className="pagination" aria-label={t('page', { page: Math.floor(offset / limit) + 1 })}><Button disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>{t('previous')}</Button><span>{t('page', { page: Math.floor(offset / limit) + 1 })}</span><Button disabled={!next && (total === null || offset + limit >= total)} onClick={() => onChange(offset + limit)}>{t('next')}</Button></nav>
}
export function Tabs({ value, items, onChange }: { value: string
  items: { value: string
  label: string }[]
  onChange: (value: string) => void }) {
  return <div className="tabs" role="group">{items.map(item => <button key={item.value} aria-pressed={value === item.value} className={value === item.value ? 'active' : ''} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>
}
export function Dialog({ title, children, onClose }: { title: string
  children: ReactNode
  onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = ref.current!
    dialog.showModal()
    return () => { dialog.close()
      previous?.focus() }
  }, [])
  return <dialog ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault()
    onClose() }} onClick={event => { if (event.target === ref.current) onClose() }}><div className="dialog-head"><h2 id={id}>{title}</h2><Button variant="ghost" onClick={onClose} aria-label={t('close')}><Icon name="close" /></Button></div>{children}</dialog>
}
const ToastContext = createContext<(message: string) => void>(() => {})
export const useToast = () => useContext(ToastContext)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const show = (text: string) => { setMessage(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(''), 6000) }
  return <ToastContext value={show}>{children}<div className="toast-region" aria-live="polite" aria-atomic="true">{message && <div className="toast"><Icon name="check" /><span>{message}</span><button onClick={() => setMessage('')} aria-label={t('close')}><Icon name="close" size={16} /></button></div>}</div></ToastContext>
}
