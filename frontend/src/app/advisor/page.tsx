'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, Minus, ChevronLeft,
  Loader2, RefreshCw, AlertTriangle, Zap, BarChart3
} from 'lucide-react';
import { portfolioAPI } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import toast from 'react-hot-toast';

const TOP_SYMBOLS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'SBIN.NS','AXISBANK.NS','BHARTIARTL.NS','LT.NS','WIPRO.NS',
  'TATAMOTORS.NS','SUNPHARMA.NS','HCLTECH.NS','ITC.NS','KOTAKBANK.NS',
];

interface Recommendation {
  symbol: string; name: string; sector: string;
  recommendation: 'BUY'|'HOLD'|'SELL';
  confidence: number; confidence_pct: number;
  color: string; summary: string;
  shap_reasons: { feature: string; impact: number; direction: string; description: string }[];
  probabilities: { BUY: number; HOLD: number; SELL: number };
  features: Record<string, number>;
  current_price: number;
}

const REC_ICON = { BUY: TrendingUp, HOLD: Minus, SELL: TrendingDown };
const REC_BADGE = { BUY: 'badge-buy', HOLD: 'badge-hold', SELL: 'badge-sell' };

const FeatureBar = ({ feature, impact, description }: any) => {
  const abs = Math.min(Math.abs(impact) * 100, 100);
  const color = impact > 0 ? '#10b981' : '#ef4444';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>{description}</span>
        <span style={{ color, fontWeight: 700 }} className="mono">{impact > 0 ? '+' : ''}{impact.toFixed(3)}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${abs}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
};

export default function AdvisorPage() {
  const router = useRouter();
  const user = getUser();
  const [predictions, setPredictions] = useState<Record<string, Recommendation>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const fetchPrediction = async (symbol: string) => {
    setLoading((prev) => ({ ...prev, [symbol]: true }));
    try {
      const res = await portfolioAPI.aiRecommend(symbol);
      setPredictions((prev) => ({ ...prev, [symbol]: res.data }));
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.includes('train') || msg.includes('Model not found') || err.response?.status === 503) {
        setModelReady(false);
        toast.error('AI model not trained yet. Train the model first.');
      } else {
        toast.error(`Failed to get prediction for ${symbol.replace('.NS','')}`);
      }
    } finally {
      setLoading((prev) => ({ ...prev, [symbol]: false }));
    }
  };

  const fetchAll = () => {
    setPredictions({});
    TOP_SYMBOLS.forEach((s) => fetchPrediction(s));
  };

  const buys = Object.values(predictions).filter((p) => p.recommendation === 'BUY')
    .sort((a, b) => b.confidence - a.confidence);
  const others = Object.values(predictions).filter((p) => p.recommendation !== 'BUY')
    .sort((a, b) => b.confidence - a.confidence);

  return (
    <div style={{ minHeight: '100vh', background: '#050b18' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <ChevronLeft size={16} /> Dashboard
            </button>
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={18} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>AI Advisor</span>
          </div>
        </div>
        <button onClick={fetchAll} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Zap size={14} /> Run AI Analysis
        </button>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="gradient-text">XGBoost</span> Stock Advisor
          </h1>
          <p style={{ color: '#4a5568', fontSize: 14, marginTop: 6 }}>
            AI-powered BUY/HOLD/SELL signals for top NIFTY50 stocks — with SHAP feature explanations
          </p>
        </div>

        {/* Model Not Ready Banner */}
        {!modelReady && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>AI Model Not Trained</div>
              <div style={{ fontSize: 13, color: '#92400e', marginTop: 4 }}>
                Run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>python -m app.train</code> in the <code>ml-service/</code> directory to train the XGBoost model on 2 years of NIFTY50 data.
              </div>
            </div>
          </div>
        )}

        {/* CTA if no predictions */}
        {Object.keys(predictions).length === 0 && (
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
            <Brain size={48} color="#4a5568" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to analyse NIFTY50</h2>
            <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24 }}>
              Click "Run AI Analysis" to get XGBoost recommendations for {TOP_SYMBOLS.length} top NIFTY50 stocks.
            </p>
            <button onClick={fetchAll} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} /> Run AI Analysis
            </button>
          </div>
        )}

        {/* Loading indicators */}
        {Object.values(loading).some(Boolean) && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 14 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Analysing {Object.values(loading).filter(Boolean).length} stocks...
          </div>
        )}

        {/* BUY recommendations */}
        {buys.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={18} color="#10b981" />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Top BUY Picks</h2>
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{buys.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {buys.map((p) => <RecommendationCard key={p.symbol} pred={p} expanded={expanded} setExpanded={setExpanded} />)}
            </div>
          </div>
        )}

        {/* Others */}
        {others.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#64748b' }}>Other Signals</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {others.map((p) => <RecommendationCard key={p.symbol} pred={p} expanded={expanded} setExpanded={setExpanded} />)}
            </div>
          </div>
        )}

        {/* Per-stock loading skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
          {TOP_SYMBOLS.filter((s) => loading[s] && !predictions[s]).map((s) => (
            <div key={s} className="glass-card" style={{ padding: 24 }}>
              <div className="shimmer" style={{ height: 20, width: '60%', marginBottom: 10 }} />
              <div className="shimmer" style={{ height: 14, width: '40%', marginBottom: 16 }} />
              <div className="shimmer" style={{ height: 36, width: '100%' }} />
            </div>
          ))}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RecommendationCard({ pred, expanded, setExpanded }: { pred: Recommendation; expanded: string | null; setExpanded: (s: string | null) => void }) {
  const Icon = REC_ICON[pred.recommendation];
  const isExpanded = expanded === pred.symbol;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card" style={{ padding: 24, cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => setExpanded(isExpanded ? null : pred.symbol)}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{pred.symbol.replace('.NS','')}</div>
          <div style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>{pred.sector}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={REC_BADGE[pred.recommendation]}>
            <Icon size={11} style={{ display: 'inline', marginRight: 4 }} />
            {pred.recommendation}
          </span>
          <span style={{ fontSize: 12, color: '#4a5568' }}>{pred.confidence_pct}% confidence</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pred.confidence_pct}%`, background: pred.color, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Summary */}
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{pred.summary}</p>

      {/* Price */}
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        Current: <span className="mono" style={{ fontWeight: 700, color: '#f0f4f8' }}>₹{pred.current_price?.toFixed(2)}</span>
      </div>

      {/* Expand arrow */}
      <div style={{ fontSize: 12, color: '#4a5568', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <BarChart3 size={12} />
        {isExpanded ? 'Hide' : 'Show'} SHAP explanations
      </div>

      {/* SHAP details */}
      {isExpanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>Top Contributing Factors</div>
          {pred.shap_reasons?.map((r, i) => (
            <FeatureBar key={i} {...r} />
          ))}
          {/* Probabilities */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['BUY','HOLD','SELL'] as const).map((label) => (
              <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: label === 'BUY' ? '#10b981' : label === 'SELL' ? '#ef4444' : '#f59e0b' }} className="mono">
                  {(pred.probabilities[label] * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
