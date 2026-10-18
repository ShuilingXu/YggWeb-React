import type { FormEvent } from 'react'
import type { Texture, Player } from '../api/types'
import { Button, Dialog, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
export type Action =
  'edit' | 'delete' | 'report' | 'apply' | 'closet' | 'remove' | 'moderate' | null
interface Props {
  texture: Texture
  players: Player[]
  action: Action
  busy: boolean
  error: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}
export function TextureEditor({ texture, players, action, busy, error, onClose, onSubmit }: Props) {
  return (
    <Dialog
      open={action !== null}
      onClose={() => {
        if (!busy) onClose()
      }}
      title={t(
        action === 'delete'
          ? 'texture.deleteTitle'
          : action === 'report'
            ? 'texture.report'
            : action === 'apply'
              ? 'texture.choosePlayer'
              : action === 'closet'
                ? 'texture.renameCloset'
                : action === 'remove'
                  ? 'texture.removeCloset'
                  : action === 'moderate'
                    ? 'texture.moderation'
                    : 'texture.manage',
      )}
    >
      <form key={action} className="stack" onSubmit={onSubmit}>
        {error && <Notice tone="error">{error}</Notice>}
        {action === 'edit' && (
          <>
            <Field label={t('texture.name')}>
              <input name="name" defaultValue={texture.name} required maxLength={50} />
            </Field>
            <Field label={t('texture.model')}>
              <select name="type" defaultValue={texture.type}>
                {[
                  { value: 0, key: 'library.steve' },
                  { value: 1, key: 'library.alex' },
                  { value: 2, key: 'library.cape' },
                ].map((item) => (
                  <option value={item.value} key={item.value}>
                    {t(item.key)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('texture.visibility')} help={t('texture.privateHelp')}>
              <select name="public" defaultValue={texture.public}>
                <option value={1}>{t('common.public')}</option>
                <option value={0}>{t('common.private')}</option>
              </select>
            </Field>
          </>
        )}
        {action === 'closet' && (
          <Field label={t('texture.renameCloset')}>
            <input name="name" defaultValue={texture.name} required maxLength={50} />
          </Field>
        )}
        {action === 'report' && (
          <Field label={t('texture.reason')}>
            <textarea name="reason" required maxLength={1000} />
          </Field>
        )}
        {action === 'apply' && (
          <Field label={t('texture.choosePlayer')}>
            <select name="player" required>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {action === 'delete' && <Notice tone="error">{t('texture.deleteHelp')}</Notice>}
        {action === 'remove' && <p>{texture.name}</p>}
        {action === 'moderate' && (
          <Field label={t('texture.state')}>
            <select name="state" defaultValue={1}>
              <option value={1}>{t('texture.hide')}</option>
              <option value={0}>{t('texture.restore')}</option>
            </select>
          </Field>
        )}
        <div className="actions">
          <Button
            type="submit"
            variant={action === 'delete' || action === 'moderate' ? 'danger' : 'primary'}
            disabled={busy}
          >
            {t(
              busy
                ? 'common.working'
                : action === 'delete'
                  ? 'texture.deleteConfirm'
                  : action === 'report'
                    ? 'texture.sendReport'
                    : action === 'apply'
                      ? 'texture.wear'
                      : 'common.save',
            )}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
