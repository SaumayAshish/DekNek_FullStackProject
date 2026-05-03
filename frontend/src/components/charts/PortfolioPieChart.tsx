'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#ec4899','#14b8a6','#f97316','#6366f1',
];

interface Holding { symbol: string; currentValue: number; }
interface Props { holdings: Holding[]; }

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0];
    return (
      <div style={{ background: '#0d1f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
        <div style={{ color: d.payload.fill }}>₹{d.value.toFixed(0)}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>{d.payload.percent?.toFixed(1)}%</div>
      </div>
    );
  }
  return null;
};

export default function PortfolioPieChart({ holdings }: Props) {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  const data = holdings.map((h, i) => ({
    name: h.symbol.replace('.NS', ''),
    value: parseFloat(h.currentValue.toFixed(2)),
    percent: (h.currentValue / total) * 100,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
            paddingAngle={2} dataKey="value" stroke="none">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflow: 'auto' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
              <span style={{ color: '#94a3b8' }}>{d.name}</span>
            </div>
            <span style={{ color: '#64748b' }}>{d.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
