// V5/lib/queries/chat-context.ts
//
// Builds the live snapshot of application state we feed into the ForeSight
// chat prompt. The snapshot is per-user (it includes the caller's dashboard
// items, post-its, and messages) and cached for 60s to keep latency down on
// rapid follow-up turns. The cache is invalidated whenever a write endpoint
// mutates one of the underlying tables (callers may opt in by importing
// invalidateChatContextCache).
//
// Excluded by design: passwordHash, JWTs, raw chat history, ai_requests,
// settings — none of those should ever be visible to the model.

import { prisma } from "../db/prisma.js";

const TTL_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DASHBOARD_DAYS = 30;
const RECENT_POSTITS_DAYS = 30;
const RECENT_MESSAGES_DAYS = 14;

const _cache = new Map<number, { value: ChatContext; readAt: number }>();

export function invalidateChatContextCache(userId?: number): void {
  if (userId === undefined) _cache.clear();
  else _cache.delete(userId);
}

export interface ChatContextSummary {
  shopVisitsTotal: number;
  forecastsTotal: number;
  shopVisitsByEngineType: Record<string, number>;
  upcomingRemovals30d: number;
  myDashboardCounts: { pending: number; in_progress: number; completed: number; overdue: number };
  myUnreadMessages: number;
  lastEngineDataUpload: string | null;
}

export interface ChatContext {
  generatedAt: string;
  legend: typeof LEGEND;
  summary: ChatContextSummary;
  myDashboardItems: unknown[];
  myRecentPostits: unknown[];
  teamRecentPostits: unknown[];
  myRecentMessages: { inbox: unknown[]; sent: unknown[] };
  recentFeatureRequests: unknown[];
  users: unknown[];
}

const LEGEND = {
  priority: {
    critical: "Top of the queue, escalation candidate.",
    high: "Needs movement this week.",
    medium: "Standard priority.",
    low: "Backlog.",
  },
  status: {
    pending: "Not yet started.",
    in_progress: "Active work.",
    completed: "Done.",
    overdue: "Past due date.",
  },
  itemType: {
    deadline: "Time-bound deliverable.",
    todo: "Personal to-do.",
    action_item: "Action assigned by leadership.",
    meeting: "Calendar event with prep work.",
  },
} as const;

export async function getChatContext(userId: number): Promise<ChatContext> {
  const now = Date.now();
  const slot = _cache.get(userId);
  if (slot && now - slot.readAt < TTL_MS) return slot.value;

  const dashboardSince = new Date(now - RECENT_DASHBOARD_DAYS * DAY_MS);
  const postitsSince = new Date(now - RECENT_POSTITS_DAYS * DAY_MS);
  const messagesSince = new Date(now - RECENT_MESSAGES_DAYS * DAY_MS);

  const [
    myDashboardItems,
    myRecentPostits,
    teamRecentPostits,
    myInboxMessages,
    mySentMessages,
    myUnreadCount,
    shopVisitsTotal,
    forecastsTotal,
    shopVisitGroups,
    upcomingRemovals,
    lastUpload,
    recentFeatureRequests,
    users,
  ] = await Promise.all([
    prisma.dashboardItem
      .findMany({
        where: {
          userId,
          OR: [{ createdAt: { gte: dashboardSince } }, { updatedAt: { gte: dashboardSince } }],
        },
        orderBy: { dueDate: "asc" },
        take: 100,
      })
      .catch(() => []),
    prisma.postitNote
      .findMany({
        where: { authorId: userId, createdAt: { gte: postitsSince } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      .catch(() => []),
    prisma.postitNote
      .findMany({
        where: { createdAt: { gte: postitsSince }, NOT: { authorId: userId } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { author: { select: { id: true, displayName: true, jobTitle: true } } },
      })
      .catch(() => []),
    prisma.message
      .findMany({
        where: { recipientId: userId, createdAt: { gte: messagesSince } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { sender: { select: { id: true, displayName: true, jobTitle: true } } },
      })
      .catch(() => []),
    prisma.message
      .findMany({
        where: { senderId: userId, createdAt: { gte: messagesSince } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { recipient: { select: { id: true, displayName: true, jobTitle: true } } },
      })
      .catch(() => []),
    prisma.message.count({ where: { recipientId: userId, isRead: false } }).catch(() => 0),
    prisma.shopVisit.count().catch(() => 0),
    prisma.forecast.count().catch(() => 0),
    prisma.shopVisit
      .groupBy({ by: ["engineType"], _count: { _all: true } })
      .catch(() => [] as Array<{ engineType: string | null; _count: { _all: number } }>),
    countUpcomingRemovals(now),
    prisma.shopVisit
      .findFirst({ orderBy: { uploadedAt: "desc" }, select: { uploadedAt: true } })
      .catch(() => null),
    prisma.featureRequest
      .findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, updatedAt: true },
      })
      .catch(() => []),
    prisma.user
      .findMany({
        where: { isActive: true },
        select: { id: true, displayName: true, role: true, jobTitle: true },
        orderBy: { displayName: "asc" },
      })
      .catch(() => []),
  ]);

  const dashboardCounts = countDashboardStatuses(myDashboardItems);
  const shopVisitsByEngineType: Record<string, number> = {};
  for (const g of shopVisitGroups as Array<{ engineType: string | null; _count: { _all: number } }>) {
    shopVisitsByEngineType[g.engineType ?? "unknown"] = g._count._all;
  }

  const value: ChatContext = {
    generatedAt: new Date(now).toISOString(),
    legend: LEGEND,
    summary: {
      shopVisitsTotal,
      forecastsTotal,
      shopVisitsByEngineType,
      upcomingRemovals30d: upcomingRemovals,
      myDashboardCounts: dashboardCounts,
      myUnreadMessages: myUnreadCount,
      lastEngineDataUpload: lastUpload?.uploadedAt ? lastUpload.uploadedAt.toISOString() : null,
    },
    myDashboardItems,
    myRecentPostits,
    teamRecentPostits,
    myRecentMessages: { inbox: myInboxMessages, sent: mySentMessages },
    recentFeatureRequests,
    users,
  };

  _cache.set(userId, { value, readAt: now });
  return value;
}

function countDashboardStatuses(
  items: Array<{ status: "pending" | "in_progress" | "completed" | "overdue" }> | unknown[],
): { pending: number; in_progress: number; completed: number; overdue: number } {
  const acc = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
  for (const it of items as Array<{ status?: string }>) {
    const s = it.status;
    if (s === "pending" || s === "in_progress" || s === "completed" || s === "overdue") {
      acc[s] += 1;
    }
  }
  return acc;
}

async function countUpcomingRemovals(now: number): Promise<number> {
  // ShopVisit.removalDate is a free-text string in V5 schema; coerce + filter
  // in JS rather than push the parse into SQL.
  const horizon = now + 30 * DAY_MS;
  const all = await prisma.shopVisit
    .findMany({ where: { removalDate: { not: null } }, select: { removalDate: true } })
    .catch(() => [] as Array<{ removalDate: string | null }>);
  let count = 0;
  for (const sv of all) {
    if (!sv.removalDate) continue;
    const t = Date.parse(sv.removalDate);
    if (Number.isFinite(t) && t >= now && t <= horizon) count += 1;
  }
  return count;
}
