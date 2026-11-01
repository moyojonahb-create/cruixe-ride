export type RiderTab = 'home' | 'activity' | 'ride' | 'wallet' | 'account';
export const riderTabs: ReadonlyArray<{ id: RiderTab; label: string; path: string }> = [
  { id: 'home', label: 'Home', path: '/ride' },
  { id: 'activity', label: 'Activity', path: '/history' },
  { id: 'ride', label: 'Ride', path: '/ride?view=choose' },
  { id: 'wallet', label: 'Wallet', path: '/wallet' },
  { id: 'account', label: 'Account', path: '/profile' },
];
export function activeRiderTab(pathname: string, search = ''): RiderTab | null {
  if (pathname === '/ride') return ['choose', 'locations'].includes(new URLSearchParams(search).get('view') || '') ? 'ride' : 'home';
  if (pathname.startsWith('/ride/')) return 'ride';
  if (pathname === '/history' || pathname === '/ride-history') return 'activity';
  if (pathname === '/wallet') return 'wallet';
  if (pathname === '/profile' || pathname === '/edit-profile') return 'account';
  return null;
}
export function showRiderNavigation(pathname: string, search = ''): boolean {
  return (pathname === '/ride' && ['choose', 'locations'].includes(new URLSearchParams(search).get('view') || '')) ||
    ['/history', '/wallet', '/profile', '/edit-profile'].includes(pathname);
}
