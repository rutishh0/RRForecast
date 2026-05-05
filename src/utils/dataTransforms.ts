import type { ShopVisitRecord, ForecastRecord, KPIData, PipelineStage } from '../types';

// ============================================================
// Shop Visit KPIs
// ============================================================
export function computeShopVisitKPIs(records: ShopVisitRecord[]): KPIData[] {
  const total = records.length;

  // Use inductionStatus (v2 tracker) or status, whichever is populated
  const getStatus = (r: ShopVisitRecord) => (r.inductionStatus || r.status || '').toLowerCase();

  const withStatus = records.filter(r => getStatus(r) !== '');

  const completed = records.filter(r => {
    const s = getStatus(r);
    return s.includes('complete') || s.includes('done');
  }).length;

  const cancelled = records.filter(r => getStatus(r).includes('cancel')).length;

  const inProgress = records.filter(r => {
    const s = getStatus(r);
    return s && !s.includes('hold') && !s.includes('complete') && !s.includes('done') && !s.includes('cancel');
  }).length;

  const contributions = records
    .map(r => r.totalSvContribution)
    .filter((v): v is number => v !== null && v > 0);
  const avgContribution = contributions.length > 0
    ? contributions.reduce((a, b) => a + b, 0) / contributions.length
    : 0;

  return [
    { label: 'Total Records', value: total, color: 'gold', icon: 'database' },
    { label: 'With Status', value: withStatus.length, color: 'info', icon: 'activity' },
    { label: 'In Progress', value: inProgress, color: 'warning', icon: 'clock' },
    { label: 'Completed', value: completed, color: 'success', icon: 'check-circle' },
    { label: 'Cancelled', value: cancelled, color: 'danger', icon: 'x-circle' },
    { label: 'Avg SV Contribution', value: avgContribution.toFixed(2), color: 'default', icon: 'trending-up' },
  ];
}

// ============================================================
// Shop Visit Pipeline Stages
// ============================================================
export function computePipelineStages(records: ShopVisitRecord[]): PipelineStage[] {
  const stages: PipelineStage[] = [
    { id: 'forecasted', label: 'Forecasted', color: '#60A5FA', records: [] },
    { id: 'requested', label: 'Requested', color: '#818CF8', records: [] },
    { id: 'workscope', label: 'Workscope Agreed', color: '#A78BFA', records: [] },
    { id: 'in-shop', label: 'In Shop', color: '#F59E0B', records: [] },
    { id: 'testing', label: 'Testing', color: '#FB923C', records: [] },
    { id: 'arc', label: 'ARC', color: '#34D399', records: [] },
    { id: 'complete', label: 'Complete', color: '#10B981', records: [] },
    { id: 'on-hold', label: 'On Hold', color: '#EF4444', records: [] },
  ];

  for (const r of records) {
    // Use inductionStatus (v2 tracker) or status field, whichever is populated
    const s = (r.inductionStatus || r.status || '').toLowerCase();
    if (s.includes('cancel')) {
      // Cancelled records — skip pipeline (don't clutter the active view)
      continue;
    } else if (s.includes('hold')) {
      stages[7].records.push(r);
    } else if (s.includes('complete') || s.includes('done')) {
      stages[6].records.push(r);
    } else if (s.includes('arc')) {
      stages[5].records.push(r);
    } else if (s.includes('test')) {
      stages[4].records.push(r);
    } else if (s === 'inducted' || s.includes('in shop')) {
      stages[3].records.push(r);
    } else if (s.includes('workscope') || s.includes('agreed')) {
      stages[2].records.push(r);
    } else if (s.includes('request') || s.includes('mfa') || s.includes('slot planned') || s.includes('awaiting')) {
      stages[1].records.push(r);
    } else if (r.lessor || r.operator) {
      stages[0].records.push(r);
    }
  }

  return stages;
}

// ============================================================
// Forecast KPIs
// ============================================================
export function computeForecastKPIs(records: ForecastRecord[]): KPIData[] {
  const total = records.length;

  const engineTypes = records.reduce((acc, r) => {
    const t = r.engineType.trim() || 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const t700 = Object.entries(engineTypes)
    .filter(([k]) => k.includes('700'))
    .reduce((s, [, v]) => s + v, 0);
  const xwb = Object.entries(engineTypes)
    .filter(([k]) => k.toLowerCase().includes('xwb'))
    .reduce((s, [, v]) => s + v, 0);

  const onWing = records.filter(r => r.wingStatus.toLowerCase().includes('on')).length;
  const offWing = records.filter(r => r.wingStatus.toLowerCase().includes('off')).length;

  // Upcoming within 90 days
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcoming = records.filter(r => {
    const d = parseDate(r.removalDate);
    return d && d >= now && d <= in90;
  }).length;

  return [
    { label: 'Total Forecasted', value: total, color: 'gold', icon: 'calendar' },
    { label: 'Trent 700', value: t700, color: 'info', icon: 'cog' },
    { label: 'Trent XWB', value: xwb, color: 'default', icon: 'cog' },
    { label: 'On-Wing', value: onWing, subtitle: `Off-Wing: ${offWing}`, color: 'success', icon: 'plane' },
    { label: 'Next 90 Days', value: upcoming, color: 'warning', icon: 'alert-triangle' },
  ];
}

// ============================================================
// Monthly removal distribution for bar chart
// ============================================================
export interface MonthlyRemoval {
  month: string;
  trent700: number;
  xwb: number;
  other: number;
  total: number;
}

export function computeMonthlyRemovals(records: ForecastRecord[]): MonthlyRemoval[] {
  const months: Record<string, MonthlyRemoval> = {};

  for (const r of records) {
    const d = parseDate(r.removalDate);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

    if (!months[key]) {
      months[key] = { month: label, trent700: 0, xwb: 0, other: 0, total: 0 };
    }

    const et = r.engineType.toLowerCase();
    if (et.includes('700')) months[key].trent700++;
    else if (et.includes('xwb')) months[key].xwb++;
    else months[key].other++;
    months[key].total++;
  }

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

// ============================================================
// Lessor breakdown
// ============================================================
export interface LessorBreakdownItem {
  name: string;
  count: number;
}

export function computeLessorBreakdown(records: ForecastRecord[]): LessorBreakdownItem[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const name = r.lessor.trim() || 'Unknown';
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================
// Engine type breakdown (pie/donut chart)
// ============================================================
export interface EngineTypeItem {
  name: string;
  value: number;
  color: string;
}

export function computeEngineTypeBreakdown(records: ForecastRecord[]): EngineTypeItem[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const t = r.engineType.trim() || 'Unknown';
    counts[t] = (counts[t] || 0) + 1;
  }

  const palette = ['#C5A44E', '#60A5FA', '#34D399', '#F59E0B', '#A78BFA', '#FB923C'];
  return Object.entries(counts)
    .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))
    .sort((a, b) => b.value - a.value);
}

// ============================================================
// Date parsing helper (DD/MM/YY or DD/MM/YYYY)
// ============================================================
export function parseDate(s: string): Date | null {
  if (!s) return null;
  const str = s.trim();

  // Try DD/MM/YY or DD/MM/YYYY
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (day > 0 && month > 0 && year > 2000) {
      return new Date(year, month - 1, day);
    }
  }

  // Fallback: native parse
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ============================================================
// Generic sort helper
// ============================================================
export function sortRecords<T extends Record<string, any>>(
  records: T[],
  key: string,
  direction: 'asc' | 'desc'
): T[] {
  return [...records].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    const numA = typeof va === 'number' ? va : parseFloat(va);
    const numB = typeof vb === 'number' ? vb : parseFloat(vb);

    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }
    const strA = String(va).toLowerCase();
    const strB = String(vb).toLowerCase();
    return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}
