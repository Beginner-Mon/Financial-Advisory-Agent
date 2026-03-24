/**
 * API Service — Full typed service layer for all backend endpoints.
 * Step 7.3 — API Service Layer
 */
import { Platform } from 'react-native';
import { API_BASE_URL, API_BASE_URL_IOS, API_BASE_URL_WEB } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Base URL Management
// ---------------------------------------------------------------------------
function getBaseUrl(): string {
  if (Platform.OS === 'web') return API_BASE_URL_WEB;
  if (Platform.OS === 'ios') return API_BASE_URL_IOS;
  return API_BASE_URL;
}

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
// Generic request helper
// ---------------------------------------------------------------------------
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.detail?.error || err.error || `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Advisory
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

// Bank
export interface Account {
  account_id: string;
  user_id: string;
  type: string;
  balance: number;
  currency: string;
  account_no: string;
  status: string;
}

export interface Transaction {
  txn_id: string;
  account_id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  reference: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Card {
  card_id: string;
  user_id: string;
  type: string;
  last_four: string;
  status: string;
  spend_limit: number;
  network: string;
}

// Products
export interface Product {
  id: string;
  name: string;
  product_type: string;
  category: string;
  sub_type: string;
  agent_flow: string;
  cta_label: string;
  risk_level: string;
  eligible_goals: string[];
  summary: Record<string, any>;
  detail: Record<string, any>;
  [key: string]: any;
}

export interface CompareResult {
  products: Product[];
  agent_note: string;
  category: string;
}

// Execution
export interface ExecutionStepResult {
  session_id: string;
  step: string;
  status: 'done' | 'paused';
  step_index: number;
  total_steps: number;
  input_type: string | null;
  prompt: string | null;
  options: string[] | null;
  filled_value: string | null;
  agent_log: string[];
  agent_log_entry: string;
  complete: boolean;
  reference_no: string | null;
}

export interface ExecutionProgress {
  session_id: string;
  product_id: string;
  product_type: string;
  step_index: number;
  filled_data: Record<string, any>;
  agent_log: string[];
  status: string;
  expires_at: string;
}

// Orders
export interface Order {
  order_id: string;
  user_id: string;
  product_id: string;
  product_name?: string;
  product_type: string;
  status: string;
  source?: string;
  form_data?: any;
  agent_log: string[];
  reference_no: string;
  created_at: string;
}

// Goals
export interface Goal {
  goal_id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  created_at: string;
}

// Transfer
export interface TransferChallenge {
  transfer_id: string;
  otp_sent_to: string;
  expires_in_seconds: number;
  message: string;
}

export interface TransferResult {
  reference_no: string;
  amount: number;
  status: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Advisory API
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

// ---------------------------------------------------------------------------
// Banking API
// ---------------------------------------------------------------------------

export function getAccounts(userId: string): Promise<Account[]> {
  return apiGet<Account[]>(`/accounts/${userId}`);
}

export function getTransactions(
  accountId: string,
  params?: { page?: number; limit?: number; category?: string; search?: string }
): Promise<TransactionListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.category) qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString();
  return apiGet<TransactionListResponse>(`/accounts/${accountId}/txns${query ? `?${query}` : ''}`);
}

export function getCards(userId: string): Promise<Card[]> {
  return apiGet<Card[]>(`/cards/${userId}`);
}

export function freezeCard(cardId: string, freeze: boolean): Promise<Card> {
  return apiPatch<Card>(`/cards/${cardId}/freeze`, { freeze });
}

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export function initiateTransfer(body: {
  from_account: string;
  to_account: string;
  amount: number;
  reference?: string;
}): Promise<TransferChallenge> {
  return apiPost<TransferChallenge>('/transfers', body);
}

export function confirmTransfer(transferId: string, otp: string): Promise<TransferResult> {
  return apiPost<TransferResult>(`/transfers/${transferId}/confirm`, { otp });
}

// ---------------------------------------------------------------------------
// Products / Discover
// ---------------------------------------------------------------------------

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export function getProducts(type?: string, page: number = 1, limit: number = 10): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  if (type) qs.set('type', type);
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  const query = qs.toString();
  return apiGet<ProductListResponse>(`/products${query ? `?${query}` : ''}`);
}

export function getProductDetail(productId: string): Promise<Product> {
  return apiGet<Product>(`/products/${productId}`);
}

export function compareProducts(ids: string[]): Promise<CompareResult> {
  return apiPost<CompareResult>('/products/compare', { ids });
}

export function getPromotions(): Promise<Product[]> {
  return apiGet<Product[]>('/promotions');
}

export function activatePromotion(promoId: string, userId: string): Promise<any> {
  return apiPost(`/promotions/${promoId}/activate`, { user_id: userId });
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

export function startExecution(body: {
  product_id: string;
  product_type: string;
  user_id?: string;
  session_id?: string;
}): Promise<ExecutionStepResult> {
  return apiPost<ExecutionStepResult>('/execute/start', body);
}

export function resumeExecution(body: {
  session_id: string;
  input_type?: string;
  value?: any;
}): Promise<ExecutionStepResult> {
  return apiPost<ExecutionStepResult>('/execute/resume', body);
}

export function getExecutionProgress(sessionId: string): Promise<ExecutionProgress> {
  return apiGet<ExecutionProgress>(`/execute/progress/${sessionId}`);
}

export function cancelExecution(sessionId: string): Promise<any> {
  if (!sessionId) return Promise.resolve();
  return apiDelete(`/execute/cancel/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Orders / Agent History
// ---------------------------------------------------------------------------

export function getOrders(userId: string): Promise<Order[]> {
  return apiGet<Order[]>(`/orders/${userId}`);
}

export function getAgentHistory(userId: string): Promise<Order[]> {
  return apiGet<Order[]>(`/agent-history/${userId}`);
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export function getGoals(userId: string): Promise<Goal[]> {
  return apiGet<Goal[]>(`/goals/${userId}`);
}

export function createGoal(body: {
  user_id: string;
  name: string;
  target_amount: number;
  deadline?: string;
}): Promise<Goal> {
  return apiPost<Goal>('/goals', body);
}

export function updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
  return apiPatch<Goal>(`/goals/${goalId}`, updates);
}

export function deleteGoal(goalId: string): Promise<any> {
  return apiDelete(`/goals/${goalId}`);
}

// ---------------------------------------------------------------------------
// Traditional Application
// ---------------------------------------------------------------------------
export interface TraditionalApplyRequest {
  product_id: string;
  product_type: string;
  form_data: Record<string, any>;
  session_id: string;
}

export interface TraditionalApplyResponse {
  order_id: string;
  reference_no: string;
  product_name: string;
  product_type: string;
  message: string;
  next_steps: string;
  key_details: { label: string; value: string }[];
}

export function traditionalApply(body: TraditionalApplyRequest): Promise<TraditionalApplyResponse> {
  return apiPost<TraditionalApplyResponse>('/traditional/apply', body);
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
}

export function authRegister(email: string, password: string, name: string = ''): Promise<AuthTokenResponse> {
  return apiPost<AuthTokenResponse>('/auth/register', { email, password, name });
}

export function authLogin(email: string, password: string): Promise<AuthTokenResponse> {
  return apiPost<AuthTokenResponse>('/auth/login', { email, password });
}

// ---------------------------------------------------------------------------
// Chat & Step-by-Step Profile Collection
// ---------------------------------------------------------------------------

export interface ProfileQuestion {
  field: string;
  prompt: string;
  type: 'number' | 'choice' | 'multi_choice';
  options?: string[];
  required: boolean;
}

export interface ProfileStepInfo {
  step: string;
  group: string;
  questions: ProfileQuestion[];
}

export interface ProfileProgress {
  filled: number;
  total: number;
  percentage: number;
  filled_fields?: string[];
  missing_fields?: string[];
}

export interface ChatResponse {
  type: 'answer' | 'profile_step' | 'recommendation';
  message: string;
  session_id?: string;
  step_info?: ProfileStepInfo;
  progress?: ProfileProgress;
}

export interface ProfileStepResponse {
  session_id: string;
  current_step: string | null;
  step_info: ProfileStepInfo | null;
  progress: ProfileProgress;
  has_enough_info: boolean;
  is_complete: boolean;
  collected_data: Record<string, any>;
  partial_note: string | null;
  normalized_profile?: Record<string, any>;
}

export function sendChat(message: string, sessionId: string = '', userId: string = ''): Promise<ChatResponse> {
  return apiPost<ChatResponse>('/chat', { message, session_id: sessionId, user_id: userId });
}

export function submitProfileStep(body: {
  session_id: string;
  step: string;
  values?: Record<string, any>;
  skip?: boolean;
}): Promise<ProfileStepResponse> {
  return apiPost<ProfileStepResponse>('/profile/step', body);
}

export function getProfileProgress(sessionId: string): Promise<ProfileStepResponse> {
  return apiGet<ProfileStepResponse>(`/profile/progress/${sessionId}`);
}

// ---------------------------------------------------------------------------
// AI-Powered Smart Pre-Fill
// ---------------------------------------------------------------------------

export interface PrefillSuggestions {
  product_type: string;
  suggestions: Record<string, any>;
  is_ai_generated: boolean;
  editable: boolean;
  badge: string;
}

export function getSmartPrefill(productType: string, userId: string = '', productId: string = ''): Promise<PrefillSuggestions> {
  return apiPost<PrefillSuggestions>('/recommend/prefill', {
    product_type: productType,
    user_id: userId,
    product_id: productId,
  });
}
