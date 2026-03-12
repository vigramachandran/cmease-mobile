/**
 * Action Map Store
 *
 * Infrastructure for future server-side action map updates.
 * Currently: returns hardcoded maps from navigation-agent.ts (via AsyncStorage cache).
 * Future: GET /api/agent/action-maps will deliver updated selectors without an app release.
 *
 * The CMEASE_AGENT string already embeds the default maps. This store is the
 * hook point for hot-patching them when the server has newer selectors.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const CACHE_KEY = 'cmease_action_maps_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ProviderActionMap {
  domain: string;
  version: number;
  quizUrls: string[];
  quizSelectors: string[];
  popups: string[];
  terms: string[];
  startActivity: string[];
  nextPage: string[];
  claimCredit: string[];
  evalContainer: string[];
  videoNext: string[];
  continueBtn: string[];
}

interface CachedMaps {
  maps: ProviderActionMap[];
  fetchedAt: number;
}

/**
 * Returns cached action maps from AsyncStorage.
 * Returns null if no cache exists or cache is stale.
 */
export async function getCachedActionMaps(): Promise<ProviderActionMap[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedMaps = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    return cached.maps;
  } catch {
    return null;
  }
}

/**
 * Saves action maps to AsyncStorage cache.
 */
export async function cacheActionMaps(maps: ProviderActionMap[]): Promise<void> {
  try {
    const payload: CachedMaps = { maps, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Non-fatal — will just use embedded defaults next time
  }
}

/**
 * Clears the cached action maps (e.g. for testing or forced refresh).
 */
export async function clearActionMapCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

/**
 * Attempts to fetch fresh action maps from the server.
 * Falls back silently on any error — the agent uses its embedded defaults.
 *
 * Endpoint: GET /api/agent/action-maps (not yet implemented on backend)
 * When it ships, the response shape should match ProviderActionMap[].
 */
export async function refreshActionMaps(): Promise<ProviderActionMap[] | null> {
  try {
    // The endpoint doesn't exist yet — this will fail gracefully
    const response = await fetch(
      'https://cmease-api-production.up.railway.app/api/agent/action-maps'
    );
    if (!response.ok) return null;
    const maps: ProviderActionMap[] = await response.json();
    await cacheActionMaps(maps);
    return maps;
  } catch {
    return null;
  }
}

/**
 * Main entry point. Returns server maps if fresh cache exists,
 * otherwise returns null (caller falls back to embedded maps in CMEASE_AGENT).
 *
 * Call this on player mount to warm the cache for future use.
 */
export async function getActionMaps(): Promise<ProviderActionMap[] | null> {
  const cached = await getCachedActionMaps();
  if (cached) return cached;

  // Background refresh — don't await, let player load immediately
  refreshActionMaps().catch(() => {});
  return null;
}
