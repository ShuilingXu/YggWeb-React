const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  box: 'm3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11',
  shirt: 'm8 3-5 3-2 5 4 2 1-3v11h12V10l1 3 4-2-2-5-5-3c0 4-8 4-8 0Z',
  user: 'M8 3h8v8H8zM4 21v-5l8-3 8 3v5',
  users: 'M6 3h6v7H6zM2 21v-6l7-3 7 3v6M16 4h4v6h-4M18 13l4 2v6',
  upload: 'M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6',
  settings: 'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM9 9h6v6H9z',
  book: 'M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3zM12 5v17',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  search: 'M3 3h11v11H3zM14 14l7 7',
  plus: 'M12 4v16M4 12h16',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
  menu: 'M3 5h18M3 12h18M3 19h18',
  close: 'M5 5l14 14M19 5 5 19',
  check: 'm4 12 5 5L20 6',
  warning: 'm12 2 10 19H2ZM12 8v6M12 17v1',
  flag: 'M4 22V3h16l-4 5 4 5H4',
  list: 'M8 4h13M8 12h13M8 20h13M3 3v2M3 11v2M3 19v2',
  heart: 'M12 21 2 11V5l5-3 5 5 5-5 5 3v6Z',
  lock: 'M6 10V3h12v7M4 10h16v12H4zM12 14v4',
  download: 'M12 3v13m-5-5 5 5 5-5M3 17v4h18v-4',
  logout: 'M10 3H3v18h7M8 12h14m-5-5 5 5-5 5',
  home: 'm2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8',
} as const
export type IconName = keyof typeof paths
export function Icon({ name, size = 20 }: { name: IconName
  size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" aria-hidden="true"><path d={paths[name]} /></svg> }
