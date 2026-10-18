import { useRef, useState, type ChangeEvent } from 'react'
import { ApiError } from '../api/client'
import { textureApi } from '../api/resources'
import { TextureType } from '../api/enums'
import { useAuth } from '../lib/auth'
import { checkDimensions, isPngSignature, type DimensionProblem } from '../lib/validate'
import { Link, navigate } from '../lib/router'
import { t } from '../i18n'
import { PageHeader } from '../components/AppShell'
import { TextureImage } from '../components/TextureImage'
import { Button, Field, Select, TextInput, useToast } from '../components/ui'
import { UploadIcon } from '../components/icons'

const MAX_BYTES = 1024 * 1024

type Dimensions = { width: number; height: number }

const dimensionMessages: Record<DimensionProblem, string> = {
  tooWide: t('upload.tooWide'),
  badCape: t('upload.badCape'),
  dimsNotMultiple: t('upload.dimsNotMultiple'),
  badAlex: t('upload.badAlex'),
  badSteve: t('upload.badSteve'),
}

export function UploadPage() {
  const { status } = useAuth()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dimensions, setDimensions] = useState<Dimensions | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState(String(TextureType.Steve))
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFile(null)
    setDimensions(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('')
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.size > MAX_BYTES) {
      setError(t('upload.tooLarge'))
      return
    }
    const head = new Uint8Array(await selected.slice(0, 8).arrayBuffer())
    if (!isPngSignature(head)) {
      setError(t('upload.notPng'))
      return
    }
    const bitmap = await createImageBitmap(selected)
    const dims = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    const problem = checkDimensions(dims.width, dims.height, Number(type))
    if (problem) {
      setError(dimensionMessages[problem])
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setDimensions(dims)
    setPreviewUrl(URL.createObjectURL(selected))
    if (!name) setName(selected.name.replace(/\.png$/i, ''))
  }

  const submit = async () => {
    setError('')
    if (!file) {
      setError(t('upload.needFile'))
      return
    }
    if (!name.trim()) {
      setError(t('upload.needName'))
      return
    }
    if (dimensions) {
      const problem = checkDimensions(dimensions.width, dimensions.height, Number(type))
      if (problem) {
        setError(dimensionMessages[problem])
        return
      }
    }
    const form = new FormData()
    form.append('name', name.trim())
    form.append('type', type)
    form.append('public', isPublic ? '1' : '0')
    form.append('file', file, file.name)
    setBusy(true)
    try {
      const created = await textureApi.upload(form)
      toast.push(t('upload.success'), 'success')
      navigate(`/texture/${created.id}`)
    } catch (caught) {
      if (caught instanceof ApiError) {
        const message =
          caught.status === 413
            ? t('upload.quota')
            : caught.status === 429
              ? t('upload.rateLimited')
              : caught.status === 400 || caught.status === 415
                ? t('upload.notPng')
                : caught.message
        setError(message)
      } else {
        setError(t('common.errorGeneric'))
      }
    } finally {
      setBusy(false)
    }
  }

  if (status !== 'authenticated') {
    return (
      <>
        <PageHeader title={t('upload.title')} subtitle={t('upload.subtitle')} />
        <div className="notice">
          {t('upload.needLogin')}{' '}
          <Link to={`/login?next=${encodeURIComponent('/upload')}`}>{t('nav.login')}</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t('upload.title')} subtitle={t('upload.subtitle')} />
      <div className="detail-layout">
        <form
          className="card form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          noValidate
        >
          <Field label={t('upload.fileLabel')} htmlFor="upload-file" hint={t('upload.fileHint')}>
            <input
              ref={inputRef}
              id="upload-file"
              className="visually-hidden"
              type="file"
              accept="image/png"
              onChange={(event) => void handleFile(event)}
            />
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <Button onClick={() => inputRef.current?.click()}>
                <UploadIcon /> {file ? t('upload.replaceFile') : t('upload.chooseFile')}
              </Button>
              <span className="muted truncate" style={{ fontSize: 'var(--text-xs)', maxWidth: 240 }}>
                {file ? `${file.name} · ${dimensions?.width}×${dimensions?.height}` : t('upload.noFile')}
              </span>
              {file ? (
                <Button size="sm" variant="ghost" onClick={reset}>
                  {t('common.dismiss')}
                </Button>
              ) : null}
            </div>
          </Field>

          <Field label={t('upload.nameLabel')} htmlFor="upload-name">
            <TextInput
              id="upload-name"
              value={name}
              maxLength={50}
              placeholder={t('upload.namePlaceholder')}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field label={t('upload.typeLabel')} htmlFor="upload-type">
            <Select
              id="upload-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value)
                if (dimensions) {
                  const problem = checkDimensions(dimensions.width, dimensions.height, Number(event.target.value))
                  setError(problem ? dimensionMessages[problem] : '')
                }
              }}
            >
              <option value={String(TextureType.Steve)}>{t('library.modelSteve')}</option>
              <option value={String(TextureType.Alex)}>{t('library.modelAlex')}</option>
              <option value={String(TextureType.Cape)}>{t('library.typeCape')}</option>
            </Select>
          </Field>

          <label className="row" style={{ gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            <span>
              {t('upload.publicLabel')}
              <span className="muted" style={{ display: 'block', fontSize: 'var(--text-xs)' }}>
                {t('upload.publicHint')}
              </span>
            </span>
          </label>

          {error ? (
            <p className="field__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <Button variant="primary" type="submit" loading={busy}>
              {busy ? t('upload.uploading') : t('upload.submit')}
            </Button>
          </div>
        </form>

        <section className="preview-panel">
          <h2 className="section-title">{t('upload.preview')}</h2>
          <div className="preview-panel__stage checker">
            {previewUrl ? (
              <TextureImage src={previewUrl} alt={t('upload.preview')} width={256} height={256} checker={false} />
            ) : (
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                {t('upload.noFile')}
              </p>
            )}
          </div>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {t('upload.subtitle')}
          </p>
        </section>
      </div>
    </>
  )
}
