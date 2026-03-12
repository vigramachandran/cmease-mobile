/**
 * Cookie Manager — Expo Go compatible wrapper.
 *
 * @react-native-cookies/cookies requires a native module that isn't in Expo Go.
 * This module wraps it with a try/catch and exposes a unified interface.
 * The JS-only path uses document.cookie via WebView message passing.
 */

let _NativeCookies: any = null;
try {
  // Will succeed in EAS/bare workflow; throws in Expo Go
  _NativeCookies = require('@react-native-cookies/cookies').default;
} catch {
  // Expo Go — use JS fallback via WebView injection
}

export const isNativeCookiesAvailable = _NativeCookies !== null;

/**
 * Clears all cookies for a URL using the native module.
 * No-op in Expo Go.
 */
export async function clearCookiesForUrl(url: string): Promise<void> {
  if (!_NativeCookies) return;
  try {
    await _NativeCookies.clearByName(url, '');
  } catch {
    try {
      await _NativeCookies.clearAll();
    } catch {
      // ignore
    }
  }
}

/**
 * Get all cookies for a URL using the native module.
 * Returns null in Expo Go.
 */
export async function getNativeCookies(
  url: string
): Promise<Record<string, { value: string }> | null> {
  if (!_NativeCookies) return null;
  try {
    return await _NativeCookies.get(url);
  } catch {
    return null;
  }
}

/**
 * Builds an injectedJavaScriptBeforeContentLoaded string that sets
 * all stored cookies via document.cookie before the page renders.
 *
 * cookieString format: "name1=value1; name2=value2" (from document.cookie)
 */
export function buildCookieInjectionScript(cookieString: string | null): string {
  if (!cookieString) return 'true;';
  // Escape for safe embedding in a JS string literal
  const escaped = cookieString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `
    (function() {
      try {
        var pairs = "${escaped}".split('; ');
        pairs.forEach(function(pair) {
          if (pair.trim()) {
            document.cookie = pair.trim() + '; path=/';
          }
        });
      } catch(e) {}
    })();
    true;
  `;
}

/**
 * JS to inject into a WebView that continuously posts the current
 * document.cookie string back to React Native via postMessage.
 * Used during the provider login flow to capture session cookies.
 */
export const COOKIE_CAPTURE_SCRIPT = `
  (function() {
    function sendCookies() {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'cookies',
          url: window.location.href,
          cookies: document.cookie
        }));
      } catch(e) {}
    }
    // Send immediately and after any navigation
    sendCookies();
    window.addEventListener('load', sendCookies);
    // Poll every 2s to catch SPA navigations
    setInterval(sendCookies, 2000);
    true;
  })();
  true;
`;
