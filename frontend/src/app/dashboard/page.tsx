'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Plus, RefreshCw, LogOut,
  Wallet, BarChart2, Activity, Brain, ChevronRight,
  AlertTriangle, Loader2
} from 'lucide-react';
import { portfolioAPI } from '@/lib/api';
import { getUser, clearAuth, isAuthenticated } from '@/lib/auth';
import toast from 'react-hot-toast';
import AddStockModal from '@/components/portfolio/AddStockModal';
import HoldingsTable from '@/components/portfolio/HoldingsTable';
import PortfolioPieChart from '@/components/charts/PortfolioPieChart';
import Link from 'next/link';

interface Holding {
  id: string; symbol: string; name: string; quantity: number;
  buyPrice: number; currentPrice: number; currentValue: number;
  invested: number; pnl: number; pnlPercent: number;
  dayChange: number; dayChangePercent: number; addedAt: string;
}
interface Summary {
  totalInvested: number; currentValue: number; totalPnL: number;
  pnlPercent: number; holdingsCount: number;
}

const KPICard = ({ title, value, sub, icon: Icon, color, isLoading }: any) => (
  <div className="glass-card" style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{title}</span>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    {isLoading ? (
      <div className="shimmer" style={{ height: 32, width: '70%', marginBottom: 8 }} />
    ) : (
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#f0f4f8' }}>{value}</div>
    )}
    {isLoading ? (
      <div className="shimmer" style={{ height: 16, width: '50%', marginTop: 8 }} />
    ) : (
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{sub}</div>
    )}
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const fetchPortfolio = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await portfolioAPI.get();
      setHoldings(res.data.holdings);
      setSummary(res.data.summary);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error('Failed to load portfolio.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchPortfolio(true), 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const handleRemove = async (id: string) => {
    try {
      await portfolioAPI.remove(id);
      toast.success('Holding removed.');
      fetchPortfolio(true);
    } catch {
      toast.error('Failed to remove holding.');
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const formatINR = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  const pnlPositive = (summary?.totalPnL ?? 0) >= 0;

  return (
    <div style={{ minHeight: '100vh', background: '#050b18' }}>
      {/* ── Navbar ── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }} className="gradient-text">PortfolioAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pulse-dot" style={{ marginRight: 4 }} />
          {lastUpdated && <span style={{ fontSize: 12, color: '#4a5568' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => fetchPortfolio(true)} disabled={refreshing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', padding: 8, borderRadius: 8, transition: 'color 0.2s' }}
            title="Refresh">
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <Link href="/advisor">
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Brain size={14} /> AI Advisor
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>{user?.name}</span>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', padding: 6 }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p style={{ color: '#4a5568', fontSize: 14, marginTop: 4 }}>Here's your NIFTY50 portfolio overview</p>
          </div>
          <button id="add-stock-btn" className="btn-primary" onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <Plus size={16} /> Add Stock
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <KPICard title="Portfolio Value" isLoading={loading}
            value={summary ? formatINR(summary.currentValue) : '₹0'}
            sub={`${summary?.holdingsCount || 0} holdings`}
            icon={Wallet} color="#3b82f6" />
          <KPICard title="Total Invested" isLoading={loading}
            value={summary ? formatINR(summary.totalInvested) : '₹0'}
            sub="Cost basis"
            icon={BarChart2} color="#8b5cf6" />
          <KPICard title="Total P&L" isLoading={loading}
            value={summary ? `${pnlPositive ? '+' : ''}${formatINR(summary.totalPnL)}` : '₹0'}
            sub={summary ? `${summary.pnlPercent >= 0 ? '+' : ''}${summary.pnlPercent}% overall` : '0%'}
            icon={pnlPositive ? TrendingUp : TrendingDown}
            color={pnlPositive ? '#10b981' : '#ef4444'} />
          <KPICard title="Day Change" isLoading={loading}
            value={holdings.length > 0
              ? formatINR(holdings.reduce((s, h) => s + h.dayChange * h.quantity, 0))
              : '₹0'}
            sub={holdings.length > 0
              ? `${(holdings.reduce((s, h) => s + h.dayChangePercent, 0) / (holdings.length || 1)).toFixed(2)}% avg`
              : 'No holdings'}
            icon={Activity} color="#06b6d4" />
        </div>

        {/* ── Main Content ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* Holdings Table */}
          <div>
            <HoldingsTable holdings={holdings} loading={loading} onRemove={handleRemove} />
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pie Chart */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Asset Allocation</h3>
              {holdings.length > 0 ? (
                <PortfolioPieChart holdings={holdings} />
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a5568', fontSize: 14 }}>
                  Add stocks to see allocation
                </div>
              )}
            </div>

            {/* AI CTA */}
            <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Brain size={20} color="#8b5cf6" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>AI Recommendations</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                Get XGBoost-powered BUY/HOLD/SELL signals for all NIFTY50 stocks with SHAP explanations.
              </p>
              <Link href="/advisor">
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  View AI Advisor <ChevronRight size={14} />
                </button>
              </Link>
            </div>

            {/* Risk Notice */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                  AI recommendations are for educational purposes. Not financial advice. Always do your own research before investing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddStockModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { setShowAddModal(false); fetchPortfolio(true); }}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
