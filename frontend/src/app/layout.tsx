import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300','400','500','600','700','800','900'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500'],
  variable: '--font-mono',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'PortfolioAI — NIFTY50 Smart Tracker',
  description:
    'AI-powered NIFTY50 portfolio tracker with XGBoost recommendations, live prices, P&L analysis, and SHAP-explained insights.',
  keywords: 'NIFTY50, portfolio tracker, AI stocks, XGBoost, investment, India stocks',
  openGraph: {
    title: 'PortfolioAI — NIFTY50 Smart Tracker',
    description: 'Track your NIFTY50 portfolio with AI-powered recommendations.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1f35',
              color: '#f0f4f8',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

