import type { TextureType } from '../api/types'

export type SortKey = 'newest' | 'oldest' | 'name'
export const SORT_KEYS: SortKey[] = ['newest', 'oldest', 'name']

export function readOffset(query: URLSearchParams): number {
  const value = Number(query.get('offset') ?? 0)
  return Number.isSafeInteger(value) && value > 0 ? value : 0
}

export function readType(query: URLSearchParams): TextureType | undefined {
  const value = query.get('type')
  if (value === '0' || value === '1' || value === '2') return Number(value) as TextureType
  return undefined
}

export function readSort(query: URLSearchParams): SortKey {
  const value = query.get('sort')
  return value === 'oldest' || value === 'name' ? value : 'newest'
}

export function readSearch(query: URLSearchParams): string {
  return (query.get('q') ?? '').slice(0, 200)
}
