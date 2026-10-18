import { zhCN, type MessageKey } from './zh-CN'

type Messages = { [key: string]: string | Messages }

const dictionary = zhCN as unknown as Messages

function lookup(key: string): string | undefined {
  const parts = key.split('.')
  let node: string | Messages | undefined = dictionary
  for (const part of parts) {
    if (typeof node === 'string') return undefined
    node = node?.[part]
  }
  return typeof node === 'string' ? node : undefined
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = lookup(key)
  if (template === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
    return key
  }
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name]
    return value === undefined ? whole : String(value)
  })
}
