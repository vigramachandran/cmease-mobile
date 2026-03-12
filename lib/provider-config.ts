import { ProviderConfig } from './types';

export const PROVIDERS: Record<string, ProviderConfig> = {
  'medscape.com': {
    name: 'Medscape',
    loginUrl:
      'https://login.medscape.com/login/sso/getlogin?urlCache=aHR0cHM6Ly93d3cubWVkc2NhcGUuY29tLw==&ac=401',
    homeUrl: 'https://www.medscape.com',
    icon: 'GraduationCap',
    color: '#0072CE',
    estimatedSessionDays: 90,
    loginSuccessIndicators: [
      '/index/list',
      '/viewarticle/',
      'medscape.com/viewarticle',
    ],
  },
  'aafp.org': {
    name: 'AAFP',
    loginUrl: 'https://login.aafp.org/',
    homeUrl: 'https://www.aafp.org/cme',
    icon: 'BookOpen',
    color: '#003366',
    estimatedSessionDays: 30,
    loginSuccessIndicators: ['/cme/', '/my-cme/'],
  },
  'pri-med.com': {
    name: 'Pri-Med',
    loginUrl: 'https://www.pri-med.com/login',
    homeUrl: 'https://www.pri-med.com',
    icon: 'Stethoscope',
    color: '#E87722',
    estimatedSessionDays: 60,
    loginSuccessIndicators: ['/online-education/', '/dashboard'],
  },
  'edhub.ama-assn.org': {
    name: 'AMA Ed Hub',
    loginUrl: 'https://edhub.ama-assn.org/auth/login',
    homeUrl: 'https://edhub.ama-assn.org',
    icon: 'Award',
    color: '#CF2030',
    estimatedSessionDays: 30,
    loginSuccessIndicators: ['/courses/', '/dashboard'],
  },
};

export const PROVIDER_DOMAINS = Object.keys(PROVIDERS);

export function getDomainFromUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    // Match hostname against known provider domains
    return (
      PROVIDER_DOMAINS.find(
        (domain) => hostname === domain || hostname.endsWith('.' + domain)
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function urlMatchesLoginSuccess(
  url: string,
  domain: string
): boolean {
  const config = PROVIDERS[domain];
  if (!config) return false;
  return config.loginSuccessIndicators.some((indicator) =>
    url.includes(indicator)
  );
}
