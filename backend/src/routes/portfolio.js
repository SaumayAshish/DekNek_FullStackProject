const express = require('express');
const axios = require('axios');
const db = require('../db/supabase');
const authMiddleware = require('../middleware/auth');
const { priceCache, mlCache } = require('../utils/cache');

// Yahoo Finance v8 direct API (no crumb needed for chart endpoint)
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};

async function fetchStockQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await axios.get(url, { headers: YF_HEADERS, timeout: 10000 });
  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const meta = result.meta;
  return {
    symbol: meta.symbol || symbol,
    name: meta.shortName || meta.longName || symbol,
    price: meta.regularMarketPrice || meta.chartPreviousClose,
    change: (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0),
    changePercent: meta.chartPreviousClose
      ? (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100)
      : 0,
    currency: meta.currency || 'INR',
  };
}

// Local NIFTY50 metadata (no network call needed for name/sector)
const NIFTY50_META = {
  'ADANIENT.NS': { name: 'Adani Enterprises', sector: 'Energy' },
  'ADANIPORTS.NS': { name: 'Adani Ports', sector: 'Industrials' },
  'APOLLOHOSP.NS': { name: 'Apollo Hospitals', sector: 'Healthcare' },
  'ASIANPAINT.NS': { name: 'Asian Paints', sector: 'Consumer' },
  'AXISBANK.NS': { name: 'Axis Bank', sector: 'Financials' },
  'BAJAJ-AUTO.NS': { name: 'Bajaj Auto', sector: 'Automobiles' },
  'BAJAJFINSV.NS': { name: 'Bajaj Finserv', sector: 'Financials' },
  'BAJFINANCE.NS': { name: 'Bajaj Finance', sector: 'Financials' },
  'BHARTIARTL.NS': { name: 'Bharti Airtel', sector: 'Telecom' },
  'BPCL.NS': { name: 'BPCL', sector: 'Energy' },
  'BRITANNIA.NS': { name: 'Britannia Industries', sector: 'Consumer' },
  'CIPLA.NS': { name: 'Cipla', sector: 'Healthcare' },
  'COALINDIA.NS': { name: 'Coal India', sector: 'Energy' },
  'DIVISLAB.NS': { name: "Divi's Laboratories", sector: 'Healthcare' },
  'DRREDDY.NS': { name: "Dr. Reddy's Laboratories", sector: 'Healthcare' },
  'EICHERMOT.NS': { name: 'Eicher Motors', sector: 'Automobiles' },
  'GRASIM.NS': { name: 'Grasim Industries', sector: 'Materials' },
  'HCLTECH.NS': { name: 'HCL Technologies', sector: 'IT' },
  'HDFCBANK.NS': { name: 'HDFC Bank', sector: 'Financials' },
  'HDFCLIFE.NS': { name: 'HDFC Life Insurance', sector: 'Financials' },
  'HEROMOTOCO.NS': { name: 'Hero MotoCorp', sector: 'Automobiles' },
  'HINDALCO.NS': { name: 'Hindalco Industries', sector: 'Materials' },
  'HINDUNILVR.NS': { name: 'Hindustan Unilever', sector: 'Consumer' },
  'ICICIBANK.NS': { name: 'ICICI Bank', sector: 'Financials' },
  'INDUSINDBK.NS': { name: 'IndusInd Bank', sector: 'Financials' },
  'INFY.NS': { name: 'Infosys', sector: 'IT' },
  'ITC.NS': { name: 'ITC', sector: 'Consumer' },
  'JSWSTEEL.NS': { name: 'JSW Steel', sector: 'Materials' },
  'KOTAKBANK.NS': { name: 'Kotak Mahindra Bank', sector: 'Financials' },
  'LT.NS': { name: 'Larsen & Toubro', sector: 'Industrials' },
  'LTIM.NS': { name: 'LTIMindtree', sector: 'IT' },
  'M&M.NS': { name: 'Mahindra & Mahindra', sector: 'Automobiles' },
  'MARUTI.NS': { name: 'Maruti Suzuki', sector: 'Automobiles' },
  'NESTLEIND.NS': { name: 'Nestle India', sector: 'Consumer' },
  'NTPC.NS': { name: 'NTPC', sector: 'Utilities' },
  'ONGC.NS': { name: 'ONGC', sector: 'Energy' },
  'POWERGRID.NS': { name: 'Power Grid Corp', sector: 'Utilities' },
  'RELIANCE.NS': { name: 'Reliance Industries', sector: 'Energy' },
  'SBILIFE.NS': { name: 'SBI Life Insurance', sector: 'Financials' },
  'SBIN.NS': { name: 'State Bank of India', sector: 'Financials' },
  'SHRIRAMFIN.NS': { name: 'Shriram Finance', sector: 'Financials' },
  'SUNPHARMA.NS': { name: 'Sun Pharma', sector: 'Healthcare' },
  'TATACONSUM.NS': { name: 'Tata Consumer Products', sector: 'Consumer' },
  'TATAMOTORS.NS': { name: 'Tata Motors', sector: 'Automobiles' },
  'TATASTEEL.NS': { name: 'Tata Steel', sector: 'Materials' },
  'TCS.NS': { name: 'Tata Consultancy Services', sector: 'IT' },
  'TECHM.NS': { name: 'Tech Mahindra', sector: 'IT' },
  'TITAN.NS': { name: 'Titan Company', sector: 'Consumer' },
  'ULTRACEMCO.NS': { name: 'UltraTech Cement', sector: 'Materials' },
  'WIPRO.NS': { name: 'Wipro', sector: 'IT' },
};

const router = express.Router();
router.use(authMiddleware);

// Helper: fetch live price (uses cache)
async function getLivePrice(symbol) {
  const cached = priceCache.get(symbol);
  if (cached) return cached.price;

  try {
    const data = await fetchStockQuote(symbol);
    const price = data?.price || null;
    if (price) priceCache.set(symbol, data);
    return price;
  } catch {
    return null;
  }
}

// ── GET /api/portfolio ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const holdings = await db.select('portfolio', { user_id: req.user.id });

    if (!holdings || holdings.length === 0) {
      return res.json({
        holdings: [],
        summary: { totalInvested: 0, currentValue: 0, totalPnL: 0, pnlPercent: 0, holdingsCount: 0 },
      });
    }

    // Fetch live prices in parallel
    const enriched = await Promise.all(
      holdings.map(async (h) => {
        const currentPrice = await getLivePrice(h.symbol);
        const buyPrice = parseFloat(h.avg_buy_price);
        const quantity = parseFloat(h.quantity);
        const invested = buyPrice * quantity;
        const currentValue = currentPrice ? currentPrice * quantity : invested;
        const pnl = currentValue - invested;
        const pnlPercent = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : 0;
        const cached = priceCache.get(h.symbol);

        return {
          id: h.id,
          symbol: h.symbol,
          name: h.name || h.symbol,
          sector: h.sector || 'Unknown',
          quantity,
          buyPrice,
          currentPrice: currentPrice || buyPrice,
          currentValue: parseFloat(currentValue.toFixed(2)),
          invested: parseFloat(invested.toFixed(2)),
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent),
          dayChange: cached?.change || 0,
          dayChangePercent: cached?.changePercent || 0,
          addedAt: h.created_at,
        };
      })
    );

    const totalInvested = enriched.reduce((s, h) => s + h.invested, 0);
    const currentValue = enriched.reduce((s, h) => s + h.currentValue, 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    res.json({
      holdings: enriched,
      summary: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        pnlPercent: parseFloat(pnlPercent),
        holdingsCount: enriched.length,
      },
    });
  } catch (err) {
    console.error('Portfolio GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch portfolio.' });
  }
});

// ── POST /api/portfolio/add ──────────────────────────────────
router.post('/add', async (req, res) => {
  try {
    const { symbol: rawSymbol, stock_symbol, quantity, buy_price, sector } = req.body;
    const resolvedSymbol = rawSymbol || stock_symbol;

    if (!resolvedSymbol || !quantity || !buy_price) {
      return res.status(400).json({ error: 'symbol, quantity, and buy_price are required.' });
    }
    if (quantity <= 0 || buy_price <= 0) {
      return res.status(400).json({ error: 'quantity and buy_price must be positive.' });
    }

    const symbol = resolvedSymbol.toUpperCase();
    const userId = req.user.id;

    // Use local metadata (no blocking network call)
    const meta = NIFTY50_META[symbol] || {};
    const stockName = meta.name || symbol;
    const stockSector = sector || meta.sector || 'Unknown';

    // Check if already in portfolio (upsert with weighted average)
    const [existing] = await db.select('portfolio', { user_id: userId, symbol });

    let holding;
    if (existing) {
      const newQty = parseFloat(existing.quantity) + parseFloat(quantity);
      const newAvgPrice = (
        (parseFloat(existing.quantity) * parseFloat(existing.avg_buy_price) +
          parseFloat(quantity) * parseFloat(buy_price)) /
        newQty
      ).toFixed(2);

      holding = await db.update('portfolio', {
        quantity: newQty,
        avg_buy_price: parseFloat(newAvgPrice),
      }, { id: existing.id });
    } else {
      holding = await db.insert('portfolio', {
        user_id: userId,
        symbol,
        name: stockName,
        sector: stockSector,
        quantity: parseFloat(quantity),
        avg_buy_price: parseFloat(buy_price),
      });
    }

    // Log transaction (fire and forget)
    db.insert('transactions', {
      user_id: userId,
      portfolio_id: holding?.id,
      symbol,
      type: 'BUY',
      quantity: parseFloat(quantity),
      price: parseFloat(buy_price),
    }).catch(e => console.error('Transaction log error:', e.message));

    res.status(201).json({ message: 'Stock added to portfolio.', holding });
  } catch (err) {
    console.error('Portfolio ADD error:', err.message);
    res.status(500).json({ error: 'Failed to add stock.' });
  }
});

// ── DELETE /api/portfolio/:id ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Verify ownership first
    const [holding] = await db.select('portfolio', { id: req.params.id, user_id: req.user.id });
    if (!holding) return res.status(404).json({ error: 'Holding not found or not authorized.' });

    await db.remove('portfolio', { id: req.params.id });

    // Log sell transaction (fire and forget)
    getLivePrice(holding.symbol)
      .then(currentPrice => db.insert('transactions', {
        user_id: req.user.id,
        symbol: holding.symbol,
        type: 'SELL',
        quantity: parseFloat(holding.quantity),
        price: currentPrice || parseFloat(holding.avg_buy_price),
      }))
      .catch(e => console.error('Sell transaction log error:', e.message));

    res.json({ message: 'Holding removed.', removed: holding });
  } catch (err) {
    console.error('Portfolio DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to remove holding.' });
  }
});

// ── GET /api/portfolio/ai/:symbol ────────────────────────────
router.get('/ai/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `ai_${symbol}`;
  const cached = mlCache.get(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      { symbol },
      { timeout: 30000 }
    );
    mlCache.set(cacheKey, response.data);
    res.json({ ...response.data, cached: false });
  } catch (err) {
    console.error('ML service error:', err.message);
    res.status(503).json({ error: 'AI service temporarily unavailable.', details: err.message });
  }
});

// ── GET /api/portfolio/ai-top/recommendations ─────────────────
router.get('/ai-top/recommendations', async (req, res) => {
  const cacheKey = 'top_recommendations';
  const cached = mlCache.get(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const response = await axios.get(
      `${process.env.ML_SERVICE_URL}/recommendations`,
      { timeout: 60000 }
    );
    mlCache.set(cacheKey, response.data);
    res.json({ ...response.data, cached: false });
  } catch (err) {
    console.error('ML recommendations error:', err.message);
    res.status(503).json({ error: 'AI service temporarily unavailable.' });
  }
});

module.exports = router;
