const express = require('express');
const axios = require('axios');
const { priceCache } = require('../utils/cache');

const router = express.Router();

// Direct Yahoo Finance v8 API (no crumb needed for chart endpoint)
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};

async function fetchStockData(symbol) {
  // Try chart API (v8 — no crumb needed)
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const response = await axios.get(chartUrl, { headers: YF_HEADERS, timeout: 10000 });
  const result = response.data?.chart?.result?.[0];
  if (!result) throw new Error('No chart data returned');

  const meta = result.meta;
  return {
    symbol: meta.symbol || symbol,
    name: meta.shortName || meta.longName || symbol,
    price: meta.regularMarketPrice || meta.chartPreviousClose,
    change: (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0),
    changePercent: meta.chartPreviousClose
      ? (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100)
      : 0,
    open: meta.regularMarketOpen || null,
    high: meta.regularMarketDayHigh || null,
    low: meta.regularMarketDayLow || null,
    volume: meta.regularMarketVolume || null,
    marketCap: meta.marketCap || null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
    currency: meta.currency || 'INR',
    timestamp: new Date().toISOString(),
  };
}

// Valid NIFTY50 symbols with metadata
const NIFTY50_SYMBOLS = [
  { symbol: 'ADANIENT.NS',   name: 'Adani Enterprises',        sector: 'Energy' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports',              sector: 'Industrials' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals',         sector: 'Healthcare' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints',             sector: 'Consumer' },
  { symbol: 'AXISBANK.NS',   name: 'Axis Bank',                sector: 'Financials' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto',               sector: 'Automobiles' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv',            sector: 'Financials' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance',            sector: 'Financials' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel',            sector: 'Telecom' },
  { symbol: 'BPCL.NS',       name: 'BPCL',                     sector: 'Energy' },
  { symbol: 'BRITANNIA.NS',  name: 'Britannia Industries',     sector: 'Consumer' },
  { symbol: 'CIPLA.NS',      name: 'Cipla',                    sector: 'Healthcare' },
  { symbol: 'COALINDIA.NS',  name: 'Coal India',               sector: 'Energy' },
  { symbol: 'DIVISLAB.NS',   name: "Divi's Laboratories",      sector: 'Healthcare' },
  { symbol: 'DRREDDY.NS',    name: "Dr. Reddy's Laboratories", sector: 'Healthcare' },
  { symbol: 'EICHERMOT.NS',  name: 'Eicher Motors',            sector: 'Automobiles' },
  { symbol: 'GRASIM.NS',     name: 'Grasim Industries',        sector: 'Materials' },
  { symbol: 'HCLTECH.NS',    name: 'HCL Technologies',         sector: 'IT' },
  { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank',                sector: 'Financials' },
  { symbol: 'HDFCLIFE.NS',   name: 'HDFC Life Insurance',      sector: 'Financials' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp',            sector: 'Automobiles' },
  { symbol: 'HINDALCO.NS',   name: 'Hindalco Industries',      sector: 'Materials' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever',       sector: 'Consumer' },
  { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank',               sector: 'Financials' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank',            sector: 'Financials' },
  { symbol: 'INFY.NS',       name: 'Infosys',                  sector: 'IT' },
  { symbol: 'ITC.NS',        name: 'ITC',                      sector: 'Consumer' },
  { symbol: 'JSWSTEEL.NS',   name: 'JSW Steel',                sector: 'Materials' },
  { symbol: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank',      sector: 'Financials' },
  { symbol: 'LT.NS',         name: 'Larsen & Toubro',          sector: 'Industrials' },
  { symbol: 'LTIM.NS',       name: 'LTIMindtree',              sector: 'IT' },
  { symbol: 'M&M.NS',        name: 'Mahindra & Mahindra',      sector: 'Automobiles' },
  { symbol: 'MARUTI.NS',     name: 'Maruti Suzuki',            sector: 'Automobiles' },
  { symbol: 'NESTLEIND.NS',  name: 'Nestle India',             sector: 'Consumer' },
  { symbol: 'NTPC.NS',       name: 'NTPC',                     sector: 'Utilities' },
  { symbol: 'ONGC.NS',       name: 'ONGC',                     sector: 'Energy' },
  { symbol: 'POWERGRID.NS',  name: 'Power Grid Corp',          sector: 'Utilities' },
  { symbol: 'RELIANCE.NS',   name: 'Reliance Industries',      sector: 'Energy' },
  { symbol: 'SBILIFE.NS',    name: 'SBI Life Insurance',       sector: 'Financials' },
  { symbol: 'SBIN.NS',       name: 'State Bank of India',      sector: 'Financials' },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance',          sector: 'Financials' },
  { symbol: 'SUNPHARMA.NS',  name: 'Sun Pharma',               sector: 'Healthcare' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products',   sector: 'Consumer' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors',              sector: 'Automobiles' },
  { symbol: 'TATASTEEL.NS',  name: 'Tata Steel',               sector: 'Materials' },
  { symbol: 'TCS.NS',        name: 'Tata Consultancy Services',sector: 'IT' },
  { symbol: 'TECHM.NS',      name: 'Tech Mahindra',            sector: 'IT' },
  { symbol: 'TITAN.NS',      name: 'Titan Company',            sector: 'Consumer' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement',         sector: 'Materials' },
  { symbol: 'WIPRO.NS',      name: 'Wipro',                    sector: 'IT' },
];

// ── GET /api/stock/nifty50 ───────────────────────────────────
router.get('/nifty50', (req, res) => {
  res.json({ symbols: NIFTY50_SYMBOLS });
});

// ── GET /api/stock/:symbol ───────────────────────────────────
router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const niftyEntry = NIFTY50_SYMBOLS.find(s => s.symbol === symbol);
    const data = await fetchStockData(symbol);

    // Enrich with our metadata
    if (niftyEntry) {
      data.name = niftyEntry.name;
      data.sector = niftyEntry.sector;
    }

    priceCache.set(symbol, data);
    res.json({ ...data, cached: false });
  } catch (err) {
    console.error(`Stock fetch error [${symbol}]:`, err.message);
    res.status(500).json({ error: `Failed to fetch data for ${symbol}.`, details: err.message });
  }
});

module.exports = router;
module.exports.fetchStockData = fetchStockData;
module.exports.YF_HEADERS = YF_HEADERS;
