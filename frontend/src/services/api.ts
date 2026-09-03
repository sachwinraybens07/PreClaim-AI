import type {
  AuthUser,
  CaseDetail,
  CaseListItem,
  CopilotMessage,
  CoverageResult,
  DashboardData,
  DenialAnalytics,
  DocumentItem,
  ActionItem,
  SimulationResult,
} from "../types";

const TOKEN_KEY = "preclaim_token";

/**
 * Base URL for API requests.
 *
 * - If VITE_API_URL is set (e.g. in production, pointing at the deployed
 *   backend), requests go to `${VITE_API_URL}/api`.
 * - If it's unset (local development), requests fall back to the relative
 *   `/api` path, which Vite's dev server proxies to localhost:4000
 *   (see vite.config.ts).
 */
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = RAW_API_BASE_URL ? `${RAW_API_BASE_URL.replace(/\/+$/, "")}/api` : "/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Please check your connection and try again.");
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message || "Something went wrong. Please try again.";
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export interface LoginPayload {
  email?: string;
  password?: string;
  demo?: boolean;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface CreateCasePayload {
  patientName: string;
  patientIdentifier?: string;
  dateOfBirth?: string;
  payer: string;
  planName?: string;
  memberId?: string;
  diagnosis: string;
  diagnosisCode?: string;
  procedure: string;
  procedureCode?: string;
  provider?: string;
  treatmentDate?: string;
  urgency: "STANDARD" | "URGENT" | "EMERGENCY";
  availableDocumentTypes?: string[];
}

export const casesApi = {
  createCase: (payload: CreateCasePayload) =>
    request<CaseDetail>("/cases", { method: "POST", body: JSON.stringify(payload) }),
  getCases: () => request<CaseListItem[]>("/cases"),
  getCase: (id: string) => request<CaseDetail>(`/cases/${id}`),
  analyzeCase: (id: string) => request<CaseDetail>(`/cases/${id}/analyze`, { method: "POST" }),
  getDocuments: (id: string) => request<DocumentItem[]>(`/cases/${id}/documents`),
  updateDocument: (documentId: string, status: string) =>
    request<DocumentItem>(`/documents/${documentId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getActions: (id: string) => request<ActionItem[]>(`/cases/${id}/actions`),
  updateAction: (actionId: string, status: string) =>
    request<ActionItem>(`/actions/${actionId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  simulateRisk: (id: string, selectedDocumentTypes: string[]) =>
    request<SimulationResult>(`/cases/${id}/simulate`, {
      method: "POST",
      body: JSON.stringify({ selectedDocumentTypes }),
    }),
  getCoverage: (id: string) => request<CoverageResult>(`/cases/${id}/coverage`),
  askCopilot: (id: string, message: string) =>
    request<CopilotMessage>(`/cases/${id}/copilot`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getCopilotHistory: (id: string) => request<CopilotMessage[]>(`/cases/${id}/copilot`),
};

export const dashboardApi = {
  getDashboard: () => request<DashboardData>("/dashboard"),
};

export const denialsApi = {
  getDenialAnalytics: (filters: { payer?: string; procedure?: string; reason?: string }) => {
    const params = new URLSearchParams();
    if (filters.payer) params.set("payer", filters.payer);
    if (filters.procedure) params.set("procedure", filters.procedure);
    if (filters.reason) params.set("reason", filters.reason);
    const qs = params.toString();
    return request<DenialAnalytics>(`/denials${qs ? `?${qs}` : ""}`);
  },
};
