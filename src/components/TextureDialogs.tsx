import { useState } from 'react'
import { TEXTURE_TYPE, textureTypeLabel } from '../api/enums'
import { bindPlayerTextures, saveToCloset } from '../api/resources'
import type { Profile, Texture } from '../api/types'
import { t } from '../i18n/zh-CN'
import { useSubmit } from '../lib/useAsync'
import { Button, Dialog, Field } from './UI'

/** 收藏与改备注走同一个 PUT，只是标题与初始值不同。 */
export function ClosetNameDialog({
  textureId,
  initialName,
  title,
  cost,
  onClose,
  onDone,
}: {
  textureId: string
  initialName: string
  title: string
  /** 仅新收藏收费；从衣柜改备注时不要传。 */
  cost?: number
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(initialName)
  const submit = useSubmit()
  return (
    <Dialog
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            disabled={submit.busy}
            onClick={() =>
              void submit.run(async () => {
                await saveToCloset(textureId, name.trim())
                onDone()
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.save')}
          </Button>
        </>
      }
    >
      <Field label={t('texture.closet.name')} htmlFor="closet-name" hint={t('texture.closet.nameHint')}>
        <input
          id="closet-name"
          className="input"
          value={name}
          maxLength={50}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      {cost && cost > 0 ? (
        <p className="small dim">{t('texture.closet.cost', { cost })}</p>
      ) : null}
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}

export function WearDialog({
  texture,
  players,
  onClose,
  onDone,
}: {
  texture: Texture
  players: Profile[]
  onClose: () => void
  onDone: (playerName: string) => void
}) {
  const [selected, setSelected] = useState(players[0]?.id ?? '')
  const submit = useSubmit()
  const isCape = texture.type === TEXTURE_TYPE.CAPE

  return (
    <Dialog
      open
      title={t('texture.wear.title')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            disabled={submit.busy || !selected}
            onClick={() =>
              void submit.run(async () => {
                const target = players.find((player) => player.id === selected)
                await bindPlayerTextures(
                  selected,
                  isCape ? { cape: texture.id } : { skin: texture.id },
                )
                onDone(target?.name ?? '')
              })
            }
          >
            {submit.busy ? t('common.submitting') : t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className="row">
        <span className="small muted">{t('texture.type')}</span>
        <span className="badge badge--muted">{textureTypeLabel(texture.type)}</span>
        <span className="small muted">{texture.name}</span>
      </div>
      <Field label={t('texture.wear.select')} htmlFor="wear-player" required>
        <select
          id="wear-player"
          className="select"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </Field>
      {submit.error ? <span className="field__error">{submit.error}</span> : null}
    </Dialog>
  )
}
