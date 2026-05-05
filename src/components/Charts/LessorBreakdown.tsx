import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LessorBreakdownItem } from '../../utils/dataTransforms';

interface LessorBreakdownProps {
  data: LessorBreakdownItem[];
}

export default function LessorBreakdown({ data }: LessorBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-rr-border rounded-xl p-6 flex flex-col items-center justify-center h-[360px] text-rr-text-muted shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#F6F5F2] flex items-center justify-center mb-3">
          <span className="text-xl">📈</span>
        </div>
        <p className="text-[14px] font-bold text-rr-navy">No lessor data available</p>
        <p className="text-[12px]">Please add forecast records.</p>
      </div>
    );
  }

  // Take top 12 lessors
  const top = data.slice(0, 12);

  return (
    <div className="bg-white border border-rr-border rounded-xl shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-rr-navy tracking-tight">
            Lessor Portfolio Breakdown
          </h3>
          <p className="text-[12px] font-medium text-rr-text-muted mt-0.5">
            Distribution of expected removals across top lessors
          </p>
        </div>
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" barSize={20} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#F2F4F7" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#667085', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#EAECF0', strokeWidth: 2 }}
              tickLine={false}
              allowDecimals={false}
              tickMargin={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: '#101828', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={160}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #EAECF0',
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                fontSize: 12,
                fontWeight: 600,
                color: '#101828',
                padding: '12px',
              }}
              labelStyle={{
                color: '#667085',
                marginBottom: '4px',
              }}
              itemStyle={{
                fontWeight: 700,
                color: '#C5A44E'
              }}
              cursor={{ fill: 'rgba(249, 250, 251, 0.8)' }}
            />
            {/* Soft background bar for visual alignment */}
            <Bar dataKey="count" name="Engines" fill="#C5A44E" radius={[0, 6, 6, 0]} background={{ fill: '#F9FAFB', radius: 6 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
