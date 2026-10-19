import { useState, type FormEvent, type DragEvent } from 'react'
import { uploadTexture } from '../api/textures'
import { errorMessage } from '../api/client'
import { validateTextureFile, validTextureName } from '../lib/validation'
import type { SiteSettings } from '../api/types'
import { CostRules } from './OperationsPage'
import type { TextureType } from '../api/enums'
import { SkinViewer } from '../components/SkinViewer'
import { Button, Field, Notice } from '../components/UI'
import { t } from '../i18n/zh-CN'
import styles from './UploadPage.module.css'
export function UploadPage({
  onUploaded,
  site,
}: {
  onUploaded: (id: string) => void
  site: SiteSettings | null
}) {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<TextureType>(0)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  function pick(next: File | undefined) {
    if (!next) return
    setFile(next)
    setError('')
    if (!name) setName(next.name.replace(/\.png$/i, ''))
  }
  function drop(e: DragEvent) {
    e.preventDefault()
    pick(e.dataTransfer.files[0])
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setError('')
    if (!file || !validTextureName(name)) {
      setError(t('upload.invalid'))
      form.querySelector('input')?.focus()
      return
    }
    setBusy(true)
    try {
      const invalid = await validateTextureFile(file, type)
      if (invalid) {
        setError(
          t(
            invalid === 'size'
              ? 'upload.tooLarge'
              : invalid === 'dimensions'
                ? 'upload.dimensions'
                : 'upload.invalid',
          ),
        )
        return
      }
      const d = new FormData(form)
      const uploaded = await uploadTexture({
        name: name.trim(),
        type,
        public: d.has('private') ? 0 : 1,
        file,
      })
      onUploaded(uploaded.id)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>{t('upload.title')}</h1>
      </div>
      {site && (
        <Notice>
          <CostRules site={site} />
        </Notice>
      )}
      <form onSubmit={submit} className={styles.columns}>
        <div className="stack">
          <section className="panel panel-primary stack">
            {error && <Notice tone="error">{error}</Notice>}
            <Field label={t('texture.name')} help={t('upload.nameHelp')}>
              <input
                required
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </Field>
            <fieldset className={styles.radios}>
              <legend>{t('texture.model')}</legend>
              {[
                { value: 0, label: 'library.steve' },
                { value: 1, label: 'library.alex' },
                { value: 2, label: 'library.cape' },
              ].map((item) => (
                <label key={item.value}>
                  <input
                    type="radio"
                    name="type"
                    value={item.value}
                    checked={type === item.value}
                    onChange={() => setType(item.value as TextureType)}
                  />
                  {t(item.label)}
                </label>
              ))}
            </fieldset>
            <div className={styles.file} onDragOver={(e) => e.preventDefault()} onDrop={drop}>
              <Field label={t('upload.file')} help={t('upload.fileHelp')}>
                <input
                  type="file"
                  accept="image/png,.png"
                  onChange={(e) => pick(e.currentTarget.files?.[0])}
                />
              </Field>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" name="private" />
              {t('upload.private')}
            </label>
            <small>{t('upload.publicHelp')}</small>
            <div className={styles.formFooter}>
              <Button type="submit" disabled={busy || !file}>
                {t(busy ? 'upload.busy' : 'upload.submit')}
              </Button>
            </div>
          </section>
          <section className="panel panel-primary">
            <h2 className="panel-header">{t('upload.guide')}</h2>
            <p>{t('upload.guideBody')}</p>
          </section>
        </div>
        <SkinViewer localFile={file ?? undefined} type={type} name={name || t('upload.preview')} />
      </form>
    </>
  )
}
