import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useToast, Button, Badge } from '../components/UI'
import { Icon } from '../components/Icons'
import { permissionLabel } from '../api/enums'
import { t } from '../i18n/zh-CN'

export function Landing() {
  const { account } = useAuth()
  return <div className="landing-page">
    <section className="hero landing-hero">
      <div className="hero-copy">
        <p className="eyebrow"><span />{t('landingEyebrow')}</p>
        <h1>{t('landingTitle').split('\n').map((line, index) => <span key={index}>{line}</span>)}</h1>
        <p>{t('landingText')}</p>
        <div className="landing-actions">
          <a className="button button-primary" href={account ? '#/dashboard' : '#/register'}>{t(account ? 'enterDashboard' : 'startAdventure')}<Icon name="arrow" size={18} /></a>
          <a className="button" href="#/library"><Icon name="grid" size={18} />{t('exploreLibrary')}</a>
        </div>
        <small className="landing-note">{t('landingNote')}</small>
      </div>
      <div className="voxel-scene" aria-hidden="true"><div className="sun" /><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="mountain mountain-back" /><div className="mountain" /><div className="voxel-tree tree-one"><i /><b /></div><div className="voxel-tree tree-two"><i /><b /></div><div className="grass-platform"><i /><i /><i /><i /><i /></div><div className="block-character"><div className="char-head"><i /><i /></div><div className="char-body" /><div className="char-arm left" /><div className="char-arm right" /><div className="char-leg left" /><div className="char-leg right" /></div><span className="scene-label">{t('englishScene')}</span></div>
    </section>
    <div className="landing-promises">
      <span><Icon name="shirt" size={18} />{t('skinAndCape')}</span>
      <span><Icon name="users" size={18} />{t('multiplePlayers')}</span>
      <span><Icon name="book" size={18} />{t('launcherConnect')}</span>
    </div>
    <section className="landing-features">
      <div className="landing-section-heading">
        <p className="eyebrow">{t('landingFeaturesEyebrow')}</p>
        <h2>{t('landingFeaturesTitle')}</h2>
        <p>{t('landingFeaturesText')}</p>
      </div>
      <div className="landing-feature-grid">
        {([
          { icon: 'grid', title: 'featureDiscoverTitle', text: 'featureDiscoverText', href: '#/library', action: 'exploreLibrary' },
          { icon: 'box', title: 'featureClosetTitle', text: 'featureClosetText', href: '#/closet', action: 'closet' },
          { icon: 'user', title: 'featurePlayersTitle', text: 'featurePlayersText', href: '#/players', action: 'players' },
        ] as const).map((feature, index) => <article className="panel landing-feature" key={feature.title}>
          <div className="landing-feature-top"><span className="feature-icon"><Icon name={feature.icon} size={28} /></span><small>{String(index + 1).padStart(2, '0')}</small></div>
          <h3>{t(feature.title)}</h3>
          <p>{t(feature.text)}</p>
          <a href={feature.href}>{t(feature.action)}<Icon name="arrow" size={16} /></a>
        </article>)}
      </div>
    </section>
    <section className="landing-start">
      <div className="landing-section-heading"><h2>{t('landingStepsTitle')}</h2></div>
      <ol className="landing-steps">
        {(['1', '2', '3'] as const).map((number, index) => <li key={number}>
          <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
          <h3>{t((['landingStep1', 'landingStep2', 'landingStep3'] as const)[index])}</h3>
          <p>{t((['landingStep1Text', 'landingStep2Text', 'landingStep3Text'] as const)[index])}</p>
        </li>)}
      </ol>
    </section>
    <section className="landing-connect">
      <div><p className="eyebrow">{t('landingConnectEyebrow')}</p><h2>{t('landingConnectTitle')}</h2><p>{t('landingConnectText')}</p></div>
      <a className="button button-primary" href="#/guide">{t('readGuide')}<Icon name="arrow" size={18} /></a>
    </section>
  </div>
}

export function Dashboard() {
  const auth = useAuth()
  return <><section className="dashboard-hero"><p className="eyebrow">{t('englishWelcome')}</p><h1>{t('dashboardTitle')}</h1><p>{t('dashboardText')}</p><a href="#/library" className="button button-primary">{t('discover')}<Icon name="arrow" /></a></section><h2>{t('quickStart')}</h2><div className="quick-grid">{([{ key: 'closet', icon: 'box' }, { key: 'players', icon: 'user' }, { key: 'uploads', icon: 'upload' }, { key: 'guide', icon: 'book' }] as const).map(item => <a className="panel quick-card" href={`#/${item.key}`} key={item.key}><Icon name={item.icon} size={28} /><h2>{t(item.key)}</h2><Icon name="arrow" /></a>)}</div><section className="panel account-summary"><div><p className="eyebrow">{t('englishAccount')}</p><h2>{auth.account?.email}</h2></div><Badge>{permissionLabel(auth.account?.permission || 0)}</Badge><a href="#/account">{t('account')} →</a></section></>
}
export function Guide() {
  const [address, setAddress] = useState(import.meta.env.VITE_PUBLIC_API_ORIGIN || location.origin)
  const toast = useToast()
  return <><div className="page-heading"><div><p className="eyebrow">{t('englishGuide')}</p><h1>{t('connectTitle')}</h1><p>{t('connectText')}</p></div></div><section className="panel guide-panel stack"><h2>{t('authAddress')}</h2><p>{t('authAddressHint')}</p><div className="toolbar"><input aria-label={t('authAddress')} type="url" value={address} onChange={event => setAddress(event.target.value)} /><Button variant="primary" onClick={async () => { try { await navigator.clipboard.writeText(address)
    toast(t('copied')) } catch { toast(t('copyFailed')) } }}>{t('copy')}</Button></div><ol className="guide-steps">{(['guideStep1', 'guideStep2', 'guideStep3'] as const).map((key, index) => <li key={key}><span>{String(index + 1).padStart(2, '0')}</span><p>{t(key)}</p></li>)}</ol><p className="notice">{t('guideBoundary')}</p></section></>
}
