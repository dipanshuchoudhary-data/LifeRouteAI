export const PATHS = {
  home: '/',
  talk: '/talk',
  health: '/health',
  chart: '/health/chart',
  safety: '/safety',
  family: '/family',
  more: '/more',
  explain: '/explain',
  memory: '/memory',
  food: '/food',
  tasks: '/tasks',
  help: '/help',
  settings: '/settings',
  emergency: '/emergency',
  referral: '/emergency/referral',
}

const MORE = new Set(['more', 'explain', 'memory', 'food', 'tasks', 'help', 'settings'])

export function pathFor(tab, sub = '') {
  if (sub === 'profile' || sub === 'settings') return PATHS.settings
  if (tab === 'more' && sub && PATHS[sub]) return PATHS[sub]
  if (tab === 'health' && sub === 'chart') return PATHS.chart
  return PATHS[tab] || PATHS.home
}

export function navIdFromPath(pathname) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/health')) return 'health'
  if (pathname.startsWith('/emergency')) return 'safety'
  if (pathname.startsWith('/family') || pathname.startsWith('/safety')) return 'more'
  const part = pathname.split('/').filter(Boolean)[0] || 'home'
  if (MORE.has(part)) return 'more'
  return part
}
