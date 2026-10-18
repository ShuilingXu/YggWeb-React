import { accountStateKeys, permissionKeys } from '../api/enums'
import { errorMessage } from '../api/client'
import { useState, type FormEvent } from 'react'
import type { Account } from '../api/types'
import { updateUser } from '../api/admin'
import { Button, Dialog, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './Admin.module.css'

export function AdminEditor({
  target,
  account,
  onClose,
  onSaved,
}: {
  target: Account
  account: Account
  onClose: () => void
  onSaved: () => void
}) {
  const [state, setState] = useState<0 | 1>(target.state === 1 ? 1 : 0)
  const [permission, setPermission] = useState<0 | 1>(target.permission === 1 ? 1 : 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateUser(target.id, { state, permission })
      onSaved()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      title={t('admin.editUser')}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form onSubmit={save}>
        <p className={styles.summary}>
          {target.email}
          <br />
          <span className={styles.mono}>{target.id}</span>
        </p>
        <Notice>{t('admin.userWarning')}</Notice>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label={t('admin.state')}>
          <select
            value={state}
            onChange={(event) => setState(Number(event.target.value) as 0 | 1)}
            disabled={busy}
          >
            <option value={0}>{t(accountStateKeys[0])}</option>
            <option value={1}>{t(accountStateKeys[1])}</option>
          </select>
        </Field>
        <Field label={t('admin.permission')} help={t('admin.permissionHelp')}>
          <select
            value={permission}
            onChange={(event) => setPermission(Number(event.target.value) as 0 | 1)}
            disabled={busy || account.permission !== 2}
          >
            <option value={0}>{t(permissionKeys[0])}</option>
            {account.permission === 2 && <option value={1}>{t(permissionKeys[1])}</option>}
          </select>
        </Field>
        <div className={styles.formActions}>
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            {t('admin.cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {t(busy ? 'admin.saving' : 'admin.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
