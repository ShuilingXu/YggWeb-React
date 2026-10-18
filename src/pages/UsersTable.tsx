import { accountStateKeys, permissionKeys } from '../api/enums'
import { formatDate } from '../lib/format'
import type { Account } from '../api/types'
import { Button } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Admin.module.css'

export function UsersTable({
  users,
  account,
  onEdit,
}: {
  users: Account[]
  account: Account
  onEdit: (user: Account) => void
}) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('admin.id')}</th>
            <th>{t('admin.email')}</th>
            <th>{t('admin.permission')}</th>
            <th>{t('admin.state')}</th>
            <th>{t('admin.verified')}</th>
            <th>{t('admin.createdAt')}</th>
            <th>{t('admin.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const editable =
              user.id !== account.id &&
              user.state !== 2 &&
              user.permission !== 2 &&
              (account.permission === 2 || user.permission === 0)
            return (
              <tr key={user.id}>
                <td>
                  <span className={`${styles.mono} ${styles.shortId}`} title={user.id}>
                    {user.id}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>{t(permissionKeys[user.permission])}</td>
                <td>
                  <span
                    className={`${styles.tag} ${user.state === 0 ? styles.active : styles.danger}`}
                  >
                    {t(accountStateKeys[user.state])}
                  </span>
                </td>
                <td>{t(user.verified === 1 ? 'admin.yes' : 'admin.no')}</td>
                <td>
                  <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
                </td>
                <td>
                  <Button variant="secondary" disabled={!editable} onClick={() => onEdit(user)}>
                    {t(editable ? 'admin.edit' : 'admin.protected')}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
