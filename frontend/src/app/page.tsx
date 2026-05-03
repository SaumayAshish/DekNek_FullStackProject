'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Brain, BarChart2, ArrowRight, Activity, Zap } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Live NIFTY50 Prices', desc: 'Real-time quotes for all 50 index stocks via Yahoo Finance.' },
  { icon: Brain, title: 'XGBoost AI Advisor', desc: 'ML model trained on 2 years of data gives BUY/HOLD/SELL with confidence scores.' },
  { icon: BarChart2, title: 'SHAP Explanations', desc: 'Understand exactly why the AI recommends each stock — feature-level transparency.' },
  { icon: Shield, title: 'Risk Scoring', desc: 'Annualised volatility-based Low/Medium/High risk labels for each holding.' },
  { icon: Activity, title: 'P&L Tracking', desc: 'Portfolio value, profit/loss, and day change — updated every 60 seconds.' },
  { icon: Zap, title: 'Smart Alerts', desc: 'Instant feedback on portfolio changes and AI-driven opportunities.' },
];

const stats = [
  { value: '50', label: 'NIFTY50 Stocks' },
  { value: '16+', label: 'Technical Features' },
  { value: 'XGBoost', label: 'ML Engine' },
  { value: 'SHAP', label: 'Explainability' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050b18 0%, #0a1628 50%, #050b18 100%)' }}>
      {/* ── Nav ── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }} className="gradient-text">PortfolioAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login">
            <button className="btn-secondary">Sign In</button>
          </Link>
          <Link href="/signup">
            <button className="btn-primary" style={{ position: 'relative' }}>Get Started <ArrowRight size={14} style={{ display: 'inline', marginLeft: 6 }} /></button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '100px 48px 80px', maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: '#60a5fa' }}>
            <div className="pulse-dot" />
            Live NIFTY50 Data + AI Recommendations
          </div>
          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-2px' }}>
            Your{' '}
            <span className="gradient-text">AI-Powered</span>
            <br />
            Portfolio Intelligence
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
            Track NIFTY50 stocks in real-time, analyse profit & loss, and get XGBoost-powered
            investment recommendations with SHAP-explained reasoning.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup">
              <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', position: 'relative' }}>
                Start Tracking Free
                <ArrowRight size={16} style={{ display: 'inline', marginLeft: 8 }} />
              </button>
            </Link>
            <Link href="/login">
              <button className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
                Sign In
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 48px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} className="glass-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 120px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 60, letterSpacing: '-1px' }}>
          Everything you need to <span className="gradient-text">invest smarter</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={20} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#374151', fontSize: 13 }}>
        PortfolioAI © 2026 — Built with Next.js, XGBoost & SHAP
      </footer>
    </div>
  );
}
