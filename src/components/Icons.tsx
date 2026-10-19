import type { ReactNode } from 'react'

type IconProps = { size?: number; className?: string }

// 像素风格：16×16 视框、直角、crispEdges，不引入图标库。
function Svg({ size = 16, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 7l6-4.5L14 7" />
      <path d="M3.5 6.5V14h9V6.5" />
      <path d="M6.5 14V10h3v4" />
    </Svg>
  )
}

export function IconLibrary(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </Svg>
  )
}

export function IconCloset(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4" width="12" height="9" />
      <path d="M2 4l1.5-2h9L14 4" />
      <path d="M2 7.5h12" />
      <rect x="7" y="7" width="2" height="3" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconPlayer(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="2" width="8" height="7" />
      <rect x="5" y="4.5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="9" y="4.5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="6" y="7" width="4" height="1" fill="currentColor" stroke="none" />
      <path d="M6 9v3M10 9v3" />
      <path d="M3 14h10" />
    </Svg>
  )
}

export function IconAccount(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="2" width="6" height="6" />
      <path d="M2 14c0-3 2.5-4 6-4s6 1 6 4" />
    </Svg>
  )
}

export function IconAdmin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V4z" />
      <path d="M6 8l1.5 1.5L10.5 6.5" />
    </Svg>
  )
}

export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6.5" y="6.5" width="3" height="3" fill="currentColor" stroke="none" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" />
    </Svg>
  )
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 2a6 6 0 100 12 5 5 0 010-12z" />
    </Svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </Svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 3l10 10M13 3L3 13" />
    </Svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3v10M3 8h10" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8.5l3 3 7-7" />
    </Svg>
  )
}

export function IconWarning(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2l6 12H2z" />
      <path d="M8 6.5v3.5" />
      <rect x="7.3" y="11.4" width="1.4" height="1.4" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconEdit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 11.5L10.5 4l2 2L5 13.5H3z" />
      <path d="M9 5.5l1.5 1.5" />
    </Svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 4.5h11" />
      <path d="M5.5 4.5V3h5v1.5" />
      <path d="M4 4.5V14h8V4.5" />
      <path d="M6.5 7v4.5M9.5 7v4.5" />
    </Svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 11V2.5" />
      <path d="M4.5 6L8 2.5 11.5 6" />
      <path d="M2 11v3h12v-3" />
    </Svg>
  )
}

export function IconCopy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="8" height="8" />
      <rect x="6" y="6" width="8" height="8" />
    </Svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 3L5 8l5 5" />
    </Svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3l5 5-5 5" />
    </Svg>
  )
}

export function IconSkin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 2l2 1 2-1 3 2-1.5 2-1-.5V14H5.5V5.5l-1 .5L3 4z" />
    </Svg>
  )
}

export function IconCape(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 2h6v12l-3-2-3 2z" />
      <path d="M8 2v10" />
    </Svg>
  )
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2v8.5" />
      <path d="M4.5 7L8 10.5 11.5 7" />
      <path d="M2 13h12" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="2.5" width="8" height="8" />
      <path d="M10 10l3.5 3.5" />
    </Svg>
  )
}

export function IconPoints(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 1.5L14 6l-6 8.5L2 6z" />
      <path d="M2 6h12" />
      <path d="M5 6l3 8.5L11 6" />
    </Svg>
  )
}
