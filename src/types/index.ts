// V5/src/types/index.ts
//
// All collab-side types use camelCase to match the new Prisma-backed API responses.
// Engine data types are re-exported from lib/excel/parse for single-source-of-truth.

export type { ShopVisitRecord, ForecastRecord, ParsedWorkbook } from "@/lib/excel/parse";

// ============================================================
// User & auth
// ============================================================

export type Role = "admin" | "manager" | "user";

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  email?: string | null;
  jobTitle?: string | null;
  avatarColor?: string | null;
  createdAt?: string;
  lastLogin?: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export type UploadMode = "combined" | "shop-only" | "forecast-only";

// ============================================================
// Dashboard items
// ============================================================

export type DashboardItemType = "deadline" | "todo" | "action_item" | "meeting";
export type DashboardPriority = "low" | "medium" | "high" | "critical";
export type DashboardStatus = "pending" | "in_progress" | "completed" | "overdue";

export interface DashboardItem {
  id: number;
  userId: number;
  itemType: DashboardItemType;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: DashboardPriority;
  status: DashboardStatus;
  relatedEsn?: string | null;
  relatedEngineType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  deadlinesApproaching: number;
  todosPending: number;
  actionItemsPending: number;
  meetingsUpcoming: number;
}

// ============================================================
// Messages
// ============================================================

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  subject?: string | null;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;

  sender?: { id: number; displayName: string; avatarColor?: string | null; jobTitle?: string | null };
  recipient?: { id: number; displayName: string; avatarColor?: string | null; jobTitle?: string | null };
}

// ============================================================
// Post-it notes
// ============================================================

export type PostitContextType = "engine" | "engine_map" | "shop_visit_forecast" | "engine_forecast" | "general";

export interface PostitNote {
  id: number;
  authorId: number;
  contextType: PostitContextType;
  contextId?: string | null;
  content: string;
  color?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  createdAt: string;
  updatedAt: string;

  author?: { id: number; displayName: string; avatarColor?: string | null };
  isRead?: number; // unread tracker count, frontend-only
}

// ============================================================
// Feature requests (NO IMAGES)
// ============================================================

export type FeatureRequestStatus = "submitted" | "under_review" | "in_progress" | "completed" | "declined";

export interface FeatureRequest {
  id: number;
  requesterId: number;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;

  requester?: { id: number; displayName: string; avatarColor?: string | null; jobTitle?: string | null };
}

// ============================================================
// MRO Facility (kept from V4)
// ============================================================

export type MROFacilityType =
  | "rr-maintenance"
  | "authorised-jv"
  | "authorised-independent"
  | "customer-owned";

export interface MROFacility {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: MROFacilityType;
}

// ============================================================
// Misc UI
// ============================================================

export interface KPIData {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "gold" | "success" | "warning" | "danger" | "info" | "default";
  icon?: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  records: import("@/lib/excel/parse").ShopVisitRecord[];
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}
