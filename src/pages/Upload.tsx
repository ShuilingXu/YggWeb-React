import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api/resources'
import { useAsync } from '../lib/useAsync'
import { useAction } from '../lib/useAction'
import { dimensionError } from '../lib/validate'
import { navigate } from '../lib/router'
import { TextureImage } from '../components/TextureImage'
import { Button, Field } from '../components/UI'
import { Icon } from '../components/Icons'
import { t } from '../i18n/zh-CN'
import { typeLabel } from '../api/enums'

export function Upload() {
  const action = useAction()
  const site = useAsync(api.site, [])
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [src, setSrc] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState(0)
  const [visibility, setVisibility] = useState(1)
  const [error, setError] = useState('')
  useEffect(() => { if (!file) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url) }, [file])
  const select = (file?: File) => { setError('')
    if (!file) return
    setFile(file)
    if (!name) setName(file.name.replace(/\.png$/i, '')) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) { setError(t('required'))
      return }
    try {
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
      if (file.type !== 'image/png' || signature.join(',') !== '137,80,78,71,13,10,26,10') { setError(t('invalidPng'))
        return }
      const image = await createImageBitmap(file)
      const invalid = dimensionError(image.width, image.height, type)
        image.close()
      if (invalid) { setError(invalid)
        return }
    } catch { setError(t('invalidPng'))
      return }
    setError('')
    const data = new FormData()
      data.set('file', file)
      data.set('name', name)
      data.set('type', String(type))
      data.set('public', String(visibility))
    void action.run(async signal => { const texture = await api.upload(data, signal)
      navigate(texture?.id ? `/texture/${texture.id}` : '/uploads') }, t('success'))
  }
  return <><div className="page-heading"><div><p className="eyebrow">{t('englishUpload')}</p><h1>{t('upload')}</h1><p>{t('uploadSubtitle')}</p></div></div>{site.value && <p className="notice">{t('uploadPrice', { upload: site.value.uploadCost, private: site.value.privateUploadCost, closet: site.value.closetCost })}</p>}<form className="upload-layout" onSubmit={submit}><section className="panel stack"><div className="dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault()
    select(event.dataTransfer.files[0]) }}><Icon name="upload" size={32} /><h2>{t('dropFile')}</h2><p>{file ? t('fileSelected', { name: file.name }) : t('fileHint')}</p><Button type="button" onClick={() => input.current?.click()}>{t('chooseFile')}</Button><input ref={input} type="file" accept="image/png,.png" aria-label={t('file')} onChange={event => select(event.target.files?.[0])} /></div>{error && <p className="field-error" role="alert">{error}</p>}<Field label={t('name')}><input value={name} onChange={event => setName(event.target.value)} maxLength={50} required /></Field><Field label={t('model')}><select value={type} onChange={event => setType(Number(event.target.value))}>{[0, 1, 2].map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></Field><Field label={t('visibility')} hint={t('privateHint')}><select value={visibility} onChange={event => setVisibility(Number(event.target.value))}><option value={1}>{t('public')}</option><option value={0}>{t('private')}</option></select></Field>{action.error && <p className="field-error" role="alert">{action.error}</p>}<Button type="submit" variant="primary" busy={action.busy}><Icon name="upload" />{t('upload')}</Button></section><aside className="panel upload-preview"><h2>{t('preview')}</h2><TextureImage src={src} empty={!file} /><p>{t('fileHint')}</p></aside></form></>
}
