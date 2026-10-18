import type { FormEvent } from 'react'
import type { Texture, Player } from '../api/types'
import { SkinViewer } from '../components/SkinViewer'
import { Button } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './LibraryPage.module.css'
interface Props {
  skin: Texture | null
  cape: Texture | null
  players: Player[]
  busy: boolean
  onApply: (event: FormEvent<HTMLFormElement>) => void
  onReset: () => void
}
export function ClosetPreview({ skin, cape, players, busy, onApply, onReset }: Props) {
  return (
    <SkinViewer
      skinId={skin?.id}
      capeId={cape?.id}
      type={skin?.type === 1 ? 1 : 0}
      name={t('bs.preview')}
    >
      <form className={styles.apply} onSubmit={onApply}>
        {skin && <small>{t('bs.selectedSkin', { name: skin.itemName || skin.name })}</small>}
        {cape && <small>{t('bs.selectedCape', { name: cape.itemName || cape.name })}</small>}
        {players.length ? (
          <label>
            {t('texture.choosePlayer')}
            <select name="player">
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <a href="#/user/player">{t('bs.noPlayers')}</a>
        )}
        <div className={styles.applyButtons}>
          <Button disabled={!players.length || (!skin && !cape) || !!busy}>
            {t('texture.wear')}
          </Button>
          <Button type="button" variant="secondary" onClick={onReset}>
            {t('bs.resetSelected')}
          </Button>
        </div>
        {(skin || cape) && (
          <a href={`#/skinlib/show/${(skin || cape)?.id}`}>{t('bs.manageSelected')}</a>
        )}
      </form>
    </SkinViewer>
  )
}
