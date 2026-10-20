import type { Source } from '../api/provision'

export function parseBSEnv(text: string): Partial<Source> {
  const values: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!match) continue
    const raw = match[2]!
    values[match[1]!] =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw.replace(/\s+#.*$/, '')
  }
  const driver = values.DB_CONNECTION
  if (driver !== 'mysql' && driver !== 'pgsql') throw new Error('driver')
  const host = values.DB_HOST || '127.0.0.1',
    port = values.DB_PORT || (driver === 'mysql' ? '3306' : '5432')
  const database = values.DB_DATABASE || '',
    user = values.DB_USERNAME || '',
    password = values.DB_PASSWORD || ''
  if (
    !/^[a-zA-Z0-9_.-]+$/.test(host) ||
    !/^\d{1,5}$/.test(port) ||
    !database ||
    !user ||
    /[\r\n]/.test(database + user + password) ||
    (values.FS_DRIVER && values.FS_DRIVER !== 'local')
  )
    throw new Error('source')
  if (driver === 'mysql' && /[:/@?]/.test(user + database)) throw new Error('source')
  return {
    driver: driver === 'pgsql' ? 'postgres' : 'mysql',
    dsn:
      driver === 'mysql'
        ? `${user}:${password}@tcp(${host}:${port})/${database}`
        : `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`,
    prefix: values.DB_PREFIX || '',
    passwordMethod: values.PWD_METHOD || 'BCRYPT',
    texturesDir: values.TEXTURES_DIR || '',
  }
}
