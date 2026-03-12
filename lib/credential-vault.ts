import * as SecureStore from 'expo-secure-store';

const KEY_PREFIX = 'cmease_cookies_';

const KNOWN_PROVIDERS = [
  'medscape.com',
  'aafp.org',
  'pri-med.com',
  'edhub.ama-assn.org',
];

interface StoredSession {
  cookies: string;
  connectedAt: string;
  lastVerifiedAt: string;
}

// SecureStore keys must be alphanumeric + underscore/hyphen, max 255 chars
function toKey(domain: string): string {
  return (KEY_PREFIX + domain.replace(/\./g, '_').replace(/-/g, '_')).slice(0, 255);
}

export async function saveCookies(domain: string, cookies: string): Promise<void> {
  const value: StoredSession = {
    cookies,
    connectedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(toKey(domain), JSON.stringify(value));
}

export async function getCookies(domain: string): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(toKey(domain));
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    return session.cookies;
  } catch {
    return null;
  }
}

export async function getSession(domain: string): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(toKey(domain));
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function removeCookies(domain: string): Promise<void> {
  await SecureStore.deleteItemAsync(toKey(domain));
}

export async function isConnected(domain: string): Promise<boolean> {
  const cookies = await getCookies(domain);
  return cookies !== null && cookies.length > 0;
}

export async function getConnectedProviders(): Promise<string[]> {
  const results = await Promise.all(
    KNOWN_PROVIDERS.map(async (domain) => {
      const connected = await isConnected(domain);
      return connected ? domain : null;
    })
  );
  return results.filter((d): d is string => d !== null);
}
