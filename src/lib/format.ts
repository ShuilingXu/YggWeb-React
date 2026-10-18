export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kib = bytes / 1024
  if (kib < 1024) return `${kib < 10 ? kib.toFixed(1) : Math.round(kib)} KiB`
  return `${(kib / 1024).toFixed(1)} MiB`
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function parse(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parse(value)
  return date ? dateFormatter.format(date) : '—'
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parse(value)
  return date ? dateTimeFormatter.format(date) : '—'
}

export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}`
}

export function shortId(id: string, length = 8): string {
  if (!id) return '—'
  return id.length <= length ? id : `${id.slice(0, length)}…`
}
