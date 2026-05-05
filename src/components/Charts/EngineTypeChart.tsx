import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { EngineTypeItem } from '../../utils/dataTransforms';

interface EngineTypeChartProps {
  data: EngineTypeItem[];
}

// Map the old hex colors from dataTransforms to the new premium palette if needed
const COLOR_MAPPING: Record<string, string> = {
  '#C5A44E': '#C5A44E', // Gold
  '#60A5FA': '#1E40AF', // Change light blue to navy for XWB
  '#5A6B85': '#94A3B8', // Lighter slate for other
  '#6366F1': '#60A5FA', // Sky blue for Trent 1000
  '#10B981': '#059669', // Emerald
};

export default function EngineTypeChart({ data }: EngineTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-rr-border rounded-xl p-6 flex flex-col items-center justify-center h-[360px] text-rr-text-muted shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#F6F5F2] flex items-center justify-center mb-3">
          <span className="text-xl">🍩</span>
        </div>
        <p className="text-[14px] font-bold text-rr-navy">No engine type data</p>
        <p className="text-[12px]">Please add forecast records.</p>
      </div>
    );
  }

  // Pre-process colors to use the new mapped palette if it exists
  const mappedData = data.map(item => ({
    ...item,
    color: COLOR_MAPPING[item.color] || item.color
  }));

  return (
    <div className="bg-white border border-rr-border rounded-xl shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="mb-2">
        <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-rr-navy tracking-tight">
          Engine Type Distribution
        </h3>
        <p className="text-[12px] font-medium text-rr-text-muted mt-0.5">
          Breakdown of forecasted removals by family
        </p>
      </div>
      <div style={{ width: '100%', height: 320, marginTop: -8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mappedData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              stroke="none"
              cornerRadius={4}
            >
              {mappedData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
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
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 700, color: '#475467' }}
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
