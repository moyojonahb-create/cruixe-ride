/** Keep sign-in within the application and preserve the requested journey. */
export function authDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some((character) => character.charCodeAt(0) <= 32)) return '/ride';
  try {
    const url = new URL(value, 'https://cruixe.invalid');
    if (url.origin !== 'https://cruixe.invalid' || ['/auth', '/login', '/signup', '/reset-password'].includes(url.pathname)) return '/ride';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/ride';
  }
}

export function authEntryPath(path: '/auth' | '/signup', destination: string): string {
  return `${path}?next=${encodeURIComponent(authDestination(destination))}`;
}
