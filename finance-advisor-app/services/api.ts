/**
 * API Service — communicates with the FastAPI backend.
 */
import { Platform } from 'react-native';
import { API_BASE_URL, API_BASE_URL_IOS, API_BASE_URL_WEB } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getBaseUrl(): string {
  if (Platform.OS === 'web') return API_BASE_URL_WEB;
  if (Platform.OS === 'ios') return API_BASE_URL_IOS;
  return API_BASE_URL; // Android
}

// Allow runtime override via settings
let _customBaseUrl: string | null = null;

export async function setBaseUrl(url: string) {
  _customBaseUrl = url;
  await AsyncStorage.setItem('api_base_url', url);
}

export async function loadBaseUrl() {
  const stored = await AsyncStorage.getItem('api_base_url');
  if (stored) _customBaseUrl = stored;
}

function baseUrl(): string {
  return _customBaseUrl || getBaseUrl();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Recommendation {
  name: string;
  type: string;
  return_pct: number;
  rationale: string;
  min_credit: number;
}

export interface StructuredReport {
  session_id: string;
  health_score: number;
  risk_profile: string;
  goals: string[];
  plan_steps: string[];
  recommendations: Recommendation[];
  agent_commentary: string;
  report_markdown: string;
}

export interface HealthStatus {
  status: string;
  db_connected: boolean;
  catalog_loaded: boolean;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getAdvice(message: string, sessionId: string = 'default'): Promise<StructuredReport> {
  const res = await fetch(`${baseUrl()}/advise/structured`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${baseUrl()}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
