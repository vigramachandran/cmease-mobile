import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CMEase',
  slug: 'cmease-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'cmease',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF5F5',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cmease.mobile',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FAF5F5',
    },
    package: 'com.cmease.mobile',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: 'https://vwvjwakpbnzzhutywjpc.supabase.co',
    supabaseAnonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dmp3YWtwYm56emh1dHl3anBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjM4ODAsImV4cCI6MjA4ODUzOTg4MH0.-6VHuQXsiSAYQ3KFY2IWdehYn8Ar1UUSsXIWQTBnw8I',
    apiUrl: 'https://cmease-api-production.up.railway.app',
    eas: {
      projectId: 'cmease-mobile',
    },
  },
});
