import { Link } from '../lib/router'
import { t } from '../i18n'
import { EmptyState } from '../components/ui'

export function NotFoundPage() {
  return (
    <EmptyState
      title={t('common.notFoundTitle')}
      body={t('common.notFoundBody')}
      action={
        <Link to="/" className="btn btn--primary">
          {t('common.backHome')}
        </Link>
      }
    />
  )
}
