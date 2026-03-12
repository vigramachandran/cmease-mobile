import Constants from 'expo-constants';
import {
  ComplianceGap,
  ComplianceStatus,
  Course,
  Credit,
  NPIData,
  ParseResult,
  Playlist,
  UserLicense,
  UserProfile,
} from './types';

const API_BASE =
  (Constants.expoConfig?.extra?.apiUrl as string) ??
    'https://cmease-api-production.up.railway.app';

// Token getter — set by auth store after login
let _getToken: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function configureApi(
  getToken: () => string | null,
  onUnauthorized: () => void
) {
  _getToken = getToken;
  _onUnauthorized = onUnauthorized;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = _getToken?.();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      _onUnauthorized?.();
      return { data: null, error: 'Session expired. Please sign in again.' };
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
      } catch {
        // ignore JSON parse errors
      }
      return { data: null, error: errorMessage };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: 'Network error. Please check your connection.',
    };
  }
}

async function uploadRequest<T>(
  path: string,
  body: FormData
): Promise<{ data: T | null; error: string | null }> {
  const token = _getToken?.();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body,
    });

    if (response.status === 401) {
      _onUnauthorized?.();
      return { data: null, error: 'Session expired. Please sign in again.' };
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
      } catch {
        // ignore
      }
      return { data: null, error: errorMessage };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: 'Network error. Please check your connection.',
    };
  }
}

export const api = {
  profile: {
    get: () => request<UserProfile>('/api/profile'),
    update: (data: Partial<UserProfile>) =>
      request<UserProfile>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  npi: {
    lookup: (npi: string) => request<NPIData>(`/api/npi/${npi}`),
  },

  compliance: {
    status: () => request<ComplianceStatus>('/api/compliance/status'),
  },

  credits: {
    list: () => request<Credit[]>('/api/credits'),
    create: (data: {
      title: string;
      provider: string;
      category: string;
      hours: number;
      completionDate: string;
    }) =>
      request<Credit>('/api/credits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    parseCertificate: (file: FormData) =>
      uploadRequest<ParseResult>('/api/credits/parse', file),
  },

  playlist: {
    gaps: () => request<ComplianceGap[]>('/api/playlist/gaps'),
    generate: () =>
      request<Playlist>('/api/playlist/generate', { method: 'POST' }),
    active: () => request<Playlist | null>('/api/playlist/active'),
    save: (playlist: Playlist) =>
      request<{ id: string }>('/api/playlist', {
        method: 'POST',
        body: JSON.stringify(playlist),
      }),
    complete: (playlistId: string, courseIndex: number) =>
      request<void>(`/api/playlist/${playlistId}/complete/${courseIndex}`, {
        method: 'POST',
      }),
  },

  courses: {
    list: (params?: { specialty?: string; topic?: string }) => {
      const query = new URLSearchParams();
      if (params?.specialty) query.set('specialty', params.specialty);
      if (params?.topic) query.set('topic', params.topic);
      const qs = query.toString();
      return request<Course[]>(`/api/courses${qs ? `?${qs}` : ''}`);
    },
  },

  licenses: {
    list: () => request<UserLicense[]>('/api/licenses'),
    create: (data: { state: string; expirationDate: string; licenseNumber?: string; licenseType?: string }) =>
      request<UserLicense>('/api/licenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { state?: string; expirationDate?: string; licenseNumber?: string; licenseType?: string }) =>
      request<UserLicense>(`/api/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/api/licenses/${id}`, { method: 'DELETE' }),
  },
};
