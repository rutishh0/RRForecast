// V5/src/services/api.ts
//
// Frontend HTTP client. JWT in Authorization header. 401 → clear token, redirect.
// Replaces V4's PHP session-cookie pattern.

import type {
  User, DashboardItem, DashboardSummary, Message, PostitNote,
  PostitContextType, FeatureRequest, ShopVisitRecord, ForecastRecord,
} from "@/src/types";

const API_BASE = "/api";

function authHeader(): Record<string, string> {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(init.headers ?? {}) },
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/";   // back to root, App boot will render LoginScreen
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ============================================================
// Auth
// ============================================================
export const authAPI = {
  siteGateCheck: (code: string) =>
    call<{ ok: true }>("/auth/site-gate-check", { method: "POST", body: JSON.stringify({ code }) }),

  login: (siteCode: string, username: string, password: string) =>
    call<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ siteCode, username, password }),
    }),

  logout: () => call<{ ok: true }>("/auth/logout", { method: "POST" }),

  check: () => call<{ authenticated: boolean; user?: User }>("/auth/check"),

  register: (data: {
    username: string; password: string; displayName: string;
    role?: "admin" | "manager" | "user"; jobTitle?: string; email?: string;
  }) => call<{ userId: number }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: true }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ============================================================
// Users
// ============================================================
export const usersAPI = {
  list:    () => call<{ users: User[] }>("/users"),
  me:      () => call<{ user: User }>("/users/me"),
  get:     (id: number) => call<{ user: User }>(`/users/${id}`),
  update:  (id: number, data: Partial<User>) =>
    call<{ user: User }>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete:  (id: number) =>
    call<{ ok: true }>(`/users/${id}`, { method: "DELETE" }),
};

// ============================================================
// Dashboard items
// ============================================================
export const dashboardAPI = {
  list: (type?: DashboardItem["itemType"]) =>
    call<{ items: DashboardItem[] }>(`/dashboard${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  summary:  () => call<DashboardSummary>("/dashboard/summary"),
  upcoming: () => call<{ items: DashboardItem[] }>("/dashboard/upcoming"),
  create:   (item: Partial<DashboardItem>) =>
    call<{ item: DashboardItem }>("/dashboard", { method: "POST", body: JSON.stringify(item) }),
  update:   (id: number, data: Partial<DashboardItem>) =>
    call<{ item: DashboardItem }>(`/dashboard/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete:   (id: number) =>
    call<{ ok: true }>(`/dashboard/${id}`, { method: "DELETE" }),
};

// ============================================================
// Messages
// ============================================================
export const messagesAPI = {
  inbox:       () => call<{ messages: Message[] }>("/messages/inbox"),
  sent:        () => call<{ messages: Message[] }>("/messages/sent"),
  unreadCount: () => call<{ count: number }>("/messages/unread-count"),
  send:        (recipientId: number, subject: string | undefined, body: string) =>
    call<{ message: Message }>("/messages", {
      method: "POST",
      body: JSON.stringify({ recipientId, subject, body }),
    }),
  read:        (id: number) =>
    call<{ ok: true }>(`/messages/${id}/read`, { method: "POST" }),
  delete:      (id: number) =>
    call<{ ok: true }>(`/messages/${id}`, { method: "DELETE" }),
};

// ============================================================
// Post-its
// ============================================================
export const postitsAPI = {
  list: (contextType: PostitContextType, contextId?: string) =>
    call<{ postits: PostitNote[] }>(
      `/postits?context_type=${encodeURIComponent(contextType)}${contextId ? `&context_id=${encodeURIComponent(contextId)}` : ""}`,
    ),
  listAll: () => call<{ postits: PostitNote[] }>("/postits/all"),
  create: (data: {
    contextType: PostitContextType;
    contextId?: string;
    content: string;
    color?: string;
    positionX?: number;
    positionY?: number;
  }) => call<{ postit: PostitNote }>("/postits", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, content: string) =>
    call<{ postit: PostitNote }>(`/postits/${id}`, { method: "PUT", body: JSON.stringify({ content }) }),
  delete: (id: number) =>
    call<{ ok: true }>(`/postits/${id}`, { method: "DELETE" }),
  markRead: (id: number) =>
    call<{ ok: true }>(`/postits/${id}/read`, { method: "POST" }),
  unreadCount: () => call<{ count: number }>("/postits/unread-count"),
};

// ============================================================
// Feature requests (NO uploadImage)
// ============================================================
export const featureRequestsAPI = {
  list:         () => call<{ requests: FeatureRequest[] }>("/feature-requests"),
  view:         (id: number) => call<{ request: FeatureRequest }>(`/feature-requests/${id}`),
  create:       (data: { title: string; description: string }) =>
    call<{ request: FeatureRequest }>("/feature-requests", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, data: { status?: string; adminNotes?: string }) =>
    call<{ request: FeatureRequest }>(`/feature-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete:       (id: number) =>
    call<{ ok: true }>(`/feature-requests/${id}`, { method: "DELETE" }),
  pendingCount: () => call<{ count: number }>("/feature-requests/pending-count"),
};

// ============================================================
// Engine data (NEW)
// ============================================================
export const engineDataAPI = {
  get: () =>
    call<{ shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[]; uploadedAt: string | null }>(
      "/engine-data",
    ),
  upload: (rawXlsxBase64: string, parsedRows: { shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[] }) =>
    call<{ shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[]; uploadedAt: string; warnings?: string[] }>(
      "/engine-data/upload",
      { method: "POST", body: JSON.stringify({ rawXlsxBase64, parsedRows }) },
    ),
};
