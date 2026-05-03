'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Trash2, Loader2, PackageOpen } from 'lucide-react';

interface Holding {
  id: string; symbol: string; name: string; quantity: number;
  buyPrice: number; currentPrice: number; currentValue: number;
  invested: number; pnl: number; pnlPercent: number;
  dayChange: number; dayChangePercent: number;
}

interface Props {
  holdings: Holding[];
  loading: boolean;
  onRemove: (id: string) => void;
}

const PnLCell = ({ value, percent }: { value: number; percent: number }) => {
  const pos = value >= 0;
  return (
    <div>
      <div style={{ fontWeight: 700, color: pos ? '#10b981' : '#ef4444', fontSize: 14 }} className="mono">
        {pos ? '+' : ''}₹{Math.abs(value).toFixed(2)}
      </div>
      <div style={{ fontSize: 12, color: pos ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
        {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {pos ? '+' : ''}{percent}%
      </div>
    </div>
  );
};

const ShimmerRow = () => (
  <tr>
    {[140, 90, 80, 100, 90, 100, 70].map((w, i) => (
      <td key={i} style={{ padding: '16px 12px' }}>
        <div className="shimmer" style={{ height: 16, width: w, borderRadius: 4 }} />
      </td>
    ))}
  </tr>
);

export default function HoldingsTable({ holdings, loading, onRemove }: Props) {
  const headers = ['Stock', 'Qty', 'Buy Price', 'Current', 'Value', 'P&L', 'Action'];

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Holdings</h3>
        <span style={{ fontSize: 13, color: '#4a5568' }}>{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {headers.map((h) => (
                <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: 12, color: '#4a5568', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ShimmerRow key={i} />)
            ) : holdings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <PackageOpen size={40} color="#1e293b" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: '#4a5568', fontSize: 14 }}>No holdings yet. Add your first NIFTY50 stock!</div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {holdings.map((h, i) => (
                  <motion.tr key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row-hover"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {/* Stock */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{h.symbol.replace('.NS','')}</div>
                      <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>{h.name?.length > 22 ? h.name.slice(0,22)+'…' : h.name}</div>
                    </td>
                    {/* Qty */}
                    <td style={{ padding: '14px 12px', fontSize: 14 }} className="mono">{h.quantity}</td>
                    {/* Buy Price */}
                    <td style={{ padding: '14px 12px', fontSize: 14, color: '#94a3b8' }} className="mono">₹{h.buyPrice.toFixed(2)}</td>
                    {/* Current */}
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }} className="mono">₹{h.currentPrice.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: h.dayChange >= 0 ? '#10b981' : '#ef4444', marginTop: 2 }}>
                        {h.dayChange >= 0 ? '+' : ''}{h.dayChangePercent?.toFixed(2)}% today
                      </div>
                    </td>
                    {/* Value */}
                    <td style={{ padding: '14px 12px', fontWeight: 600, fontSize: 14 }} className="mono">
                      ₹{h.currentValue.toFixed(0)}
                    </td>
                    {/* P&L */}
                    <td style={{ padding: '14px 12px' }}>
                      <PnLCell value={h.pnl} percent={h.pnlPercent} />
                    </td>
                    {/* Action */}
                    <td style={{ padding: '14px 12px' }}>
                      <button id={`remove-${h.id}`} className="btn-danger" onClick={() => onRemove(h.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
