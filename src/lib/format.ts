export const date = (value: string, withTime = false) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' as const } : {}) }).format(new Date(value))
export const bytes = (value: number) => value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KiB`
