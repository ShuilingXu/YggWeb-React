import { reportStateKeys } from '../api/enums'
import { formatDate } from '../lib/format'
import type { Report } from '../api/types'
import { Button } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Admin.module.css'

export function ReportsView({
  reports,
  selected,
  onSelect,
  onProcess,
}: {
  reports: Report[]
  selected: Report | null
  onSelect: (report: Report) => void
  onProcess: (report: Report) => void
}) {
  return (
    <div className={`${styles.body} ${styles.reports}`}>
      {reports.map((report) => (
        <article
          className={`${styles.report} ${selected?.id === report.id ? styles.selected : ''}`}
          key={report.id}
        >
          <div className={styles.reportMeta}>
            <span
              className={`${styles.tag} ${[styles.pending, styles.active, styles.blue][report.state]}`}
            >
              {t(reportStateKeys[report.state])}
            </span>
            <time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time>
          </div>
          <p>
            <a href={`#/skinlib/show/${report.texture}`} className={styles.mono}>
              {report.texture}
            </a>
          </p>
          <p className={styles.reason}>{report.reason}</p>
          <p className={styles.muted}>
            {t('admin.reporter')}: <span className={styles.mono}>{report.reporter}</span>
          </p>
          {report.note && (
            <p>
              {t('admin.note')}: {report.note}
            </p>
          )}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                onSelect(report)
              }}
            >
              {t('admin.preview')}
            </Button>
            {report.state === 0 && (
              <Button onClick={() => onProcess(report)}>{t('admin.handle')}</Button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
