/**
 * Formas de respuesta que consume `admin-velora`. Reflejan sus tipos en
 * `src/types/*` (AdminUser, RevenueBundle, moderation, dashboard...).
 */

export type AdminUserRole = 'athlete' | 'coach' | 'admin';
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED';
export type AdminUserTier = 'FREE' | 'PREMIUM' | 'PRO_COACHING';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  tier: AdminUserTier;
  status: AdminUserStatus;
  createdAt: string;
  followers: number;
  activities: number;
}

export interface DashboardStatsDto {
  totalUsers: number;
  totalCoaches: number;
  premiumUsers: number;
  mrr: number;
}

export interface ActivityPointDto {
  date: string;
  signups: number;
}

export interface ActivityItemDto {
  id: string;
  athlete: string;
  type: string;
  at: string;
}

export interface RevenueSummaryDto {
  mrr: number;
  growthPct: number;
  activeSubscriptions: number;
  byTier: Record<AdminUserTier, number>;
}

export interface TieredRevenuePointDto {
  month: string;
  free: number;
  premium: number;
  pro: number;
}

export interface TierShareDto {
  tier: AdminUserTier;
  count: number;
  pct: number;
}

export interface MrrBreakdownDto {
  premiumCount: number;
  proCount: number;
  premiumPrice: number;
  proPrice: number;
  total: number;
  churnRate: number;
  projection3m: number;
}

export interface RevenueBundleDto {
  summary: RevenueSummaryDto;
  tiered: TieredRevenuePointDto[];
  shares: TierShareDto[];
  breakdown: MrrBreakdownDto;
}

export interface RevenueCoachDto {
  id: string;
  rank: number;
  name: string;
  mrr: number;
  athletes: number;
  rating: number;
}

export interface ChurnPointDto {
  day: string;
  rate: number;
}

export interface TopCoachDto {
  id: string;
  rank: number;
  name: string;
  revenue: number;
  athletes: number;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ModerationActionType = 'approve' | 'reject' | 'delete' | 'ban';
export type ReportedUserStatus = 'ACTIVE' | 'WARNED' | 'BANNED';

export interface FlaggedCommentDto {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
  severity: Severity;
  flagsCount: number;
  reportedBy: string;
  reportReason: string;
  reportedAt: string;
}

export interface ReportedUserDto {
  id: string;
  name: string;
  reportsCount: number;
  status: ReportedUserStatus;
}

export interface ModerationHistoryEntryDto {
  id: string;
  at: string;
  action: ModerationActionType;
  admin: string;
  target: string;
  reason: string;
}

export interface ModerationStatsDto {
  reported: number;
  approved: number;
  rejected: number;
  banned: number;
  reportedToday: number;
  resolved: number;
  pending: number;
}

export interface SystemHealthDto {
  status: string;
  db: 'up' | 'down';
  database: 'up' | 'down';
  api: 'up' | 'degraded' | 'down';
  uptime: number;
  uptimePct: number;
  latencyMs: { p50: number; p95: number; p99: number };
  checkedAt: string;
  startedAt: string;
  timestamp: string;
}

export interface HealthMetricsDto {
  responseTime: { minutesAgo: number; ms: number }[];
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
}

export interface ErrorRatePointDto {
  day: string;
  rate: number;
}

export interface UptimeStatsDto {
  last24h: number;
  last7d: number;
  last30d: number;
  trend: number[];
}
