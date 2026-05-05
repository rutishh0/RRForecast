import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyRemoval } from '../../utils/dataTransforms';

interface RemovalTimelineProps {
  data: MonthlyRemoval[];
}

export default function RemovalTimeline({ data }: RemovalTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-rr-border rounded-xl p-6 flex flex-col items-center justify-center h-[360px] text-rr-text-muted shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#F6F5F2] flex items-center justify-center mb-3">
          <span className="text-xl">📊</span>
        </div>
        <p className="text-[14px] font-bold text-rr-navy">No timeline data available</p>
        <p className="text-[12px]">Please add forecast records to see removals over time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-rr-border rounded-xl shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-rr-navy tracking-tight">
            Monthly Removal Forecast
          </h3>
          <p className="text-[12px] font-medium text-rr-text-muted mt-0.5">
            Expected engine removals over the coming 12 months
          </p>
        </div>
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#F2F4F7" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#667085', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#EAECF0', strokeWidth: 2 }}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              tick={{ fill: '#667085', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickMargin={12}
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
              itemStyle={{
                fontWeight: 700,
                paddingTop: '4px'
              }}
              labelStyle={{
                color: '#667085',
                marginBottom: '8px',
                borderBottom: '1px solid #F2F4F7',
                paddingBottom: '4px'
              }}
              cursor={{ fill: 'rgba(249, 250, 251, 0.8)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 600, color: '#475467', paddingTop: '16px' }}
              iconType="circle"
              iconSize={8}
            />
            {/* Premium RR Colors: Gold, Navy, Sky Blue */}
            <Bar dataKey="trent700" name="Trent 700" fill="#C5A44E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="xwb" name="Trent XWB" fill="#1E40AF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="other" name="Other" fill="#60A5FA" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
