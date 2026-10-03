import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  if (Platform.OS === 'android') {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) return `http://${host}:8000`;
    }
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  DEFAULT_USER_ID: 'dev-user',
  DEV_TOKEN: 'dev-token',
  POLL_INTERVAL_MS: 3000,
  POLL_TIMEOUT_MS: 180000,
};
