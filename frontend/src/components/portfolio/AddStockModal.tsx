'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { portfolioAPI, stockAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const NIFTY50 = [
  'ADANIENT.NS','ADANIPORTS.NS','APOLLOHOSP.NS','ASIANPAINT.NS','AXISBANK.NS',
  'BAJAJ-AUTO.NS','BAJAJFINSV.NS','BAJFINANCE.NS','BHARTIARTL.NS','BPCL.NS',
  'BRITANNIA.NS','CIPLA.NS','COALINDIA.NS','DIVISLAB.NS','DRREDDY.NS',
  'EICHERMOT.NS','GRASIM.NS','HCLTECH.NS','HDFCBANK.NS','HDFCLIFE.NS',
  'HEROMOTOCO.NS','HINDALCO.NS','HINDUNILVR.NS','ICICIBANK.NS','INDUSINDBK.NS',
  'INFY.NS','ITC.NS','JSWSTEEL.NS','KOTAKBANK.NS','LT.NS',
  'LTIM.NS','M&M.NS','MARUTI.NS','NESTLEIND.NS','NTPC.NS',
  'ONGC.NS','POWERGRID.NS','RELIANCE.NS','SBILIFE.NS','SBIN.NS',
  'SHRIRAMFIN.NS','SUNPHARMA.NS','TATACONSUM.NS','TATAMOTORS.NS','TATASTEEL.NS',
  'TCS.NS','TECHM.NS','TITAN.NS','ULTRACEMCO.NS','WIPRO.NS',
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({ onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [form, setForm] = useState({ quantity: '', buy_price: '' });
  const [submitting, setSubmitting] = useState(false);

  const filtered = NIFTY50.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const fetchQuote = async (symbol: string) => {
    setQuoteLoading(true);
    setQuote(null);
    try {
      const res = await stockAPI.getQuote(symbol);
      setQuote(res.data);
      setForm((f) => ({ ...f, buy_price: res.data.price?.toFixed(2) || '' }));
    } catch {
      toast.error(`Failed to fetch price for ${symbol}`);
    } finally {
      setQuoteLoading(false);
    }
  };

  const selectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearch(symbol.replace('.NS', ''));
    fetchQuote(symbol);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSymbol) { toast.error('Please select a stock.'); return; }
    if (!form.quantity || !form.buy_price) { toast.error('Fill in quantity and price.'); return; }
    setSubmitting(true);
    try {
      await portfolioAPI.add({
        stock_symbol: selectedSymbol,
        quantity: parseFloat(form.quantity),
        buy_price: parseFloat(form.buy_price),
      });
      toast.success(`${selectedSymbol.replace('.NS','')} added to portfolio! 📈`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100 }} />

      {/* Modal */}
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101, padding: 24 }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Stock to Portfolio</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stock Search */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Search NIFTY50 Stock</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
                <input id="stock-search" type="text" className="input-field" style={{ paddingLeft: 38 }}
                  placeholder="e.g. RELIANCE, TCS, HDFCBANK..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setSelectedSymbol(''); }} />
              </div>
              {/* Dropdown */}
              {search && !selectedSymbol && filtered.length > 0 && (
                <div style={{ marginTop: 4, background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, maxHeight: 200, overflow: 'auto' }}>
                  {filtered.slice(0, 10).map((s) => (
                    <button key={s} id={`stock-option-${s}`} onClick={() => selectSymbol(s)}
                      style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#f0f4f8', cursor: 'pointer', textAlign: 'left', fontSize: 14, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      <span style={{ fontWeight: 600 }}>{s.replace('.NS','')}</span>
                      <span style={{ color: '#4a5568', marginLeft: 8, fontSize: 12 }}>.NS</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Quote */}
            {quoteLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 14 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Fetching live price...
              </div>
            )}
            {quote && (
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{quote.name || quote.symbol}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{quote.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 20 }} className="mono">₹{quote.price?.toFixed(2)}</div>
                    <div style={{ fontSize: 13, color: quote.change >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      {quote.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {[['52W High', `₹${quote.fiftyTwoWeekHigh?.toFixed(0)}`], ['52W Low', `₹${quote.fiftyTwoWeekLow?.toFixed(0)}`], ['Volume', quote.volume ? (quote.volume/1e6).toFixed(1)+'M' : 'N/A']].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: '#4a5568' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }} className="mono">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Quantity</label>
                  <input id="stock-quantity" type="number" step="0.001" min="0.001" className="input-field" placeholder="e.g. 10"
                    value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Buy Price (₹)</label>
                  <input id="stock-buy-price" type="number" step="0.01" min="0.01" className="input-field" placeholder="e.g. 2450.50"
                    value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} required />
                </div>
              </div>

              {/* Preview */}
              {form.quantity && form.buy_price && (
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
                  Total invested: <span style={{ fontWeight: 700, color: '#10b981' }} className="mono">
                    ₹{(parseFloat(form.quantity) * parseFloat(form.buy_price)).toFixed(2)}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button id="add-stock-submit" type="submit" className="btn-primary" disabled={submitting || !selectedSymbol}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
                  {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</> : 'Add to Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
