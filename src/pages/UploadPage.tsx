import { useEffect, useRef, useState } from 'react'
import { TEXTURE_TYPE, textureTypeLabel } from '../api/enums'
import { uploadTexture } from '../api/resources'
import type { TextureType } from '../api/types'
import { useAuth } from '../components/AuthProvider'
import { Button, Field, Notice, useToast } from '../components/ui'
import { t } from '../i18n/zh-CN'
import { formatBytes } from '../lib/format'
import { navigate } from '../lib/router'
import { useSubmit } from '../lib/useAsync'
import { detectSlimModel, isPngFile, readPngSize, textureDimensionProblem } from '../lib/validate'

const MAX_INPUT_BYTES = 16 * 1024 * 1024

export function UploadPage() {
  const auth = useAuth()
  const { notify } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [type, setType] = useState<TextureType>(TEXTURE_TYPE.STEVE)
  const [detectedAlex, setDetectedAlex] = useState(false)
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [drag, setDrag] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const submit = useSubmit()

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function accept(list: FileList | null): Promise<void> {
    const picked = list?.[0]
    if (!picked) return
    setFileError(null)
    submit.clearError()
    if (!(await isPngFile(picked))) {
      setFileError(t('upload.err.notPng'))
      return
    }
    if (picked.size > MAX_INPUT_BYTES) {
      setFileError(t('upload.err.tooLarge'))
      return
    }
    try {
      const size = await readPngSize(picked)
      const slim = await detectSlimModel(picked)
      setFile(picked)
      setDimensions(size)
      setType(slim ? TEXTURE_TYPE.ALEX : TEXTURE_TYPE.STEVE)
      setDetectedAlex(slim)
      setName((current) => current || picked.name.replace(/\.png$/i, '').slice(0, 50))
    } catch {
      setFileError(t('upload.err.notPng'))
    }
  }

  function validate(): string | null {
    if (!file || !dimensions) return t('upload.err.noFile')
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 50) return t('upload.err.name')
    const problem = textureDimensionProblem(type, dimensions.width, dimensions.height)
    if (problem === 'cape') return t('upload.err.cape')
    if (problem === 'alex') return t('upload.err.alex')
    if (problem === 'dimensions') return t('upload.err.dimensions', { type: textureTypeLabel(type) })
    return null
  }

  function handleSubmit(): void {
    const problem = validate()
    if (problem) {
      setFileError(problem)
      return
    }
    if (!file) return
    setFileError(null)
    void submit.run(async () => {
      const created = await uploadTexture({
        file,
        name: name.trim(),
        type,
        public: isPublic ? 1 : 0,
      })
      notify('ok', t('upload.success'))
      navigate(`/texture/${created.id}`)
    })
  }

  if (!auth.loggedIn) return null

  return (
    <div className="container">
      <div className="page">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t('upload.title')}</h1>
            <p className="page__sub">{t('upload.sub')}</p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="detail">
            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">{t('upload.file')}</span>
              </div>
              <div className="panel__body">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png"
                  className="sr-only"
                  onChange={(event) => void accept(event.target.files)}
                />
                {file && dimensions ? (
                  <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
                    <div className="slot" style={{ width: 168, flex: '0 0 auto' }}>
                      {preview ? (
                        <img className="pixel" src={preview} alt={file.name} style={{ width: '100%' }} />
                      ) : null}
                    </div>
                    <div className="stack grow">
                      <span className="mono">{file.name}</span>
                      <span className="small muted">
                        {t('upload.fileInfo', {
                          width: dimensions.width,
                          height: dimensions.height,
                          size: formatBytes(file.size),
                        })}
                      </span>
                      <span className="badge badge--muted">
                        {t('upload.detected', {
                          type: textureTypeLabel(detectedAlex ? TEXTURE_TYPE.ALEX : TEXTURE_TYPE.STEVE),
                        })}
                      </span>
                      <div className="row">
                        <Button size="sm" onClick={() => inputRef.current?.click()}>
                          {t('upload.replace')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="dropzone"
                    data-drag={drag}
                    role="button"
                    tabIndex={0}
                    aria-label={t('upload.dropHint')}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        inputRef.current?.click()
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDrag(true)
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDrag(false)
                      void accept(event.dataTransfer.files)
                    }}
                  >
                    <span className="dropzone__title">
                      {drag ? t('upload.dropActive') : t('upload.dropHint')}
                    </span>
                    <span className="dropzone__hint">PNG · 64×32 / 64×64 的整数倍 · ≤ 1 MiB（默认）</span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel__head">
                <span className="panel__title">{t('upload.submit')}</span>
              </div>
              <div className="panel__body stack">
                <Field label={t('upload.name')} htmlFor="upload-name" required>
                  <input
                    id="upload-name"
                    className="input"
                    value={name}
                    maxLength={50}
                    placeholder={t('upload.namePlaceholder')}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field label={t('upload.type')} htmlFor="upload-type">
                  <select
                    id="upload-type"
                    className="select"
                    value={type}
                    onChange={(event) => setType(Number(event.target.value) as TextureType)}
                  >
                    <option value={TEXTURE_TYPE.STEVE}>{textureTypeLabel(TEXTURE_TYPE.STEVE)}</option>
                    <option value={TEXTURE_TYPE.ALEX}>{textureTypeLabel(TEXTURE_TYPE.ALEX)}</option>
                    <option value={TEXTURE_TYPE.CAPE}>{textureTypeLabel(TEXTURE_TYPE.CAPE)}</option>
                  </select>
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                  />
                  {t('upload.public')}
                </label>
                <span className="field__hint">{t('upload.publicHint')}</span>

                {fileError ? <Notice tone="danger">{fileError}</Notice> : null}
                {submit.error ? <Notice tone="danger">{submit.error}</Notice> : null}

                <Button type="submit" variant="primary" block disabled={submit.busy}>
                  {submit.busy ? t('common.submitting') : t('upload.submit')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
