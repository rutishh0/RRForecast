import { useMemo } from 'react';
import type { ForecastRecord } from '../types';
import KPICard from './KPICard';
import DataTable from './DataTable';
import RemovalTimeline from './Charts/RemovalTimeline';
import LessorBreakdown from './Charts/LessorBreakdown';
import EngineTypeChart from './Charts/EngineTypeChart';
import {
  computeForecastKPIs,
  computeMonthlyRemovals,
  computeLessorBreakdown,
  computeEngineTypeBreakdown,
} from '../utils/dataTransforms';

interface EngineForecastProps {
  data: ForecastRecord[];
}

const FORECAST_COLUMNS = [
  { key: 'lessor' as const, label: 'Lessor', width: 150 },
  { key: 'lessorCarePlus' as const, label: 'LessorCare+', width: 100 },
  { key: 'operator' as const, label: 'Operator', width: 170 },
  { key: 'esn' as const, label: 'ESN/MSN', width: 90 },
  { key: 'engineType' as const, label: 'Engine Type', width: 100 },
  { key: 'wingStatus' as const, label: 'Wing Status', width: 100 },
  { key: 'removalDate' as const, label: 'Removal Date', width: 110 },
  { key: 'comment' as const, label: 'Comment', width: 220 },
  { key: 'svTypeNeeded' as const, label: 'SV Type Needed', width: 130 },
  { key: 'svPrice' as const, label: 'SV Price', width: 100 },
  { key: 'cashOutEligible' as const, label: 'Cash Out', width: 100 },
  { key: 'profitMillion' as const, label: 'Profit $m', width: 90 },
  { key: 'priority' as const, label: 'Priority', width: 80 },
  { key: 'notes' as const, label: 'Notes', width: 250 },
];

export default function EngineForecast({ data }: EngineForecastProps) {
  const kpis = useMemo(() => computeForecastKPIs(data), [data]);
  const monthlyRemovals = useMemo(() => computeMonthlyRemovals(data), [data]);
  const lessorBreakdown = useMemo(() => computeLessorBreakdown(data), [data]);
  const engineBreakdown = useMemo(() => computeEngineTypeBreakdown(data), [data]);

  return (
    <div className="animate-fade-in">
      {/* View Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#0F1923",
          lineHeight: 1.2,
          marginBottom: 6,
        }}>Engine Removal Forecast</h2>
        <p style={{
          fontSize: 13,
          color: "#8B9AB5",
          fontWeight: 500,
        }}>2026 engine removal forecast and financial outlook</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 stagger-children" style={{ gap: '20px', marginBottom: '40px' }}>
        {kpis.map(kpi => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '20px', marginBottom: '32px' }}>
        <div className="lg:col-span-2">
          <RemovalTimeline data={monthlyRemovals} />
        </div>
        <div>
          <EngineTypeChart data={engineBreakdown} />
        </div>
      </div>

      {/* Lessor Breakdown */}
      <div style={{ marginBottom: '32px' }}>
        <LessorBreakdown data={lessorBreakdown} />
      </div>

      {/* Forecast Data Table */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#0F1923",
          marginBottom: 16,
        }}>
          Detailed Records
        </h3>
        <DataTable
          data={data}
          columns={FORECAST_COLUMNS}
          searchKeys={['lessor', 'operator', 'esn', 'comment', 'notes']}
          filterKeys={[
            { key: 'engineType', label: 'Engine Type' },
            { key: 'lessor', label: 'Lessor' },
            { key: 'wingStatus', label: 'Wing Status' },
            { key: 'priority', label: 'Priority' },
          ]}
        />
      </div>
    </div>
  );
}
