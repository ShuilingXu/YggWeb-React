import {
  accountStateKeys,
  textureStateKeys,
  permissionKeys,
  auditActionKeys,
  auditResultKeys,
} from '../api/enums'
import { formatDate } from '../lib/format'
import type { AuditEvent } from '../api/types'
import { t } from '../i18n/zh-CN'
import styles from './Admin.module.css'

export function AuditTable({ events }: { events: AuditEvent[] }) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('admin.time')}</th>
            <th>{t('admin.actor')}</th>
            <th>{t('admin.action')}</th>
            <th>{t('admin.target')}</th>
            <th>{t('admin.result')}</th>
            <th>{t('admin.requestId')}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
              </td>
              <td>
                <span className={`${styles.mono} ${styles.shortId}`} title={event.actor}>
                  {event.actor || t('admin.cli')}
                </span>
              </td>
              <td>{t(auditActionKeys[event.action])}</td>
              <td>
                <span className={`${styles.mono} ${styles.shortId}`} title={event.target}>
                  {event.target}
                </span>
                <div className={styles.auditDetails}>
                  {event.targetState !== -1 && (
                    <div>
                      {t('admin.targetState')}:{' '}
                      {t(
                        event.action === 2 || event.action === 3
                          ? event.targetState === 0 || event.targetState === 1
                            ? textureStateKeys[event.targetState]
                            : 'admin.unchanged'
                          : accountStateKeys[event.targetState],
                      )}
                    </div>
                  )}
                  {event.targetPermission !== -1 && (
                    <div>
                      {t('admin.targetPermission')}: {t(permissionKeys[event.targetPermission])}
                    </div>
                  )}
                </div>
              </td>
              <td>
                <span
                  className={`${styles.tag} ${event.result === 0 ? styles.active : styles.blue}`}
                >
                  {t(auditResultKeys[event.result])}
                </span>
              </td>
              <td>
                <span className={`${styles.mono} ${styles.shortId}`} title={event.requestId}>
                  {event.requestId}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
