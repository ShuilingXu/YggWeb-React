import type { ReactNode } from 'react'
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1.25em"
      height="1.25em"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}
export function MenuIcon() {
  return (
    <Icon>
      <path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" />
    </Icon>
  )
}
export function UserIcon() {
  return (
    <Icon>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-1 2c-5 0-8 3-8 7v1h18v-1c0-4-3-7-8-7z" />
    </Icon>
  )
}
export function PlayersIcon() {
  return (
    <Icon>
      <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm9 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM8 13c-5 0-7 3-7 7v1h14v-1c0-4-2-7-7-7zm8 0-1 .1c2 1.8 3 4 3 7V21h5v-1c0-4-2-7-7-7z" />
    </Icon>
  )
}
export function ClosetIcon() {
  return (
    <Icon>
      <path d="M2 3h20v5H2zm2 7h16v12H4zm5 3v2h6v-2z" fillRule="evenodd" />
    </Icon>
  )
}
export function GalleryIcon() {
  return (
    <Icon>
      <path
        fillRule="evenodd"
        d="M2 3h20v18H2zm2 2v14h16V5zm2 12 4-6 3 4 2-3 3 5zM17 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4"
      />
    </Icon>
  )
}
export function UploadIcon() {
  return (
    <Icon>
      <path d="m12 2-7 7h4v7h6V9h4zM3 17h3v3h12v-3h3v6H3z" />
    </Icon>
  )
}
export function SettingsIcon() {
  return (
    <Icon>
      <path
        fillRule="evenodd"
        d="m10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3zm2 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8"
      />
    </Icon>
  )
}
export function ReportIcon() {
  return (
    <Icon>
      <path d="M4 2h2v20H4zm4 1c5-4 6 4 13 0v11c-7 4-8-4-13 0z" />
    </Icon>
  )
}
export function AuditIcon() {
  return (
    <Icon>
      <path d="M5 2h14v20H5zm3 4v2h8V6zm0 5v2h8v-2zm0 5v2h5v-2z" fillRule="evenodd" />
    </Icon>
  )
}
export function ThemeIcon() {
  return (
    <Icon>
      <path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2v16a8 8 0 0 0 0-16" />
    </Icon>
  )
}
export function ShareIcon() {
  return (
    <Icon>
      <path d="M18 2a4 4 0 1 0 1 8 4 4 0 0 0-1-8zM5 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm13 6a4 4 0 1 0 1 8 4 4 0 0 0-1-8zM7 9l8-4 1 2-8 4zm0 6 1-2 8 4-1 2z" />
    </Icon>
  )
}
export function CloudIcon() {
  return (
    <Icon>
      <path d="M6 8a6 6 0 0 1 11-3 4 4 0 0 1 5 5c5 7-2 11-5 10H6C-2 20-2 8 6 8" />
    </Icon>
  )
}
