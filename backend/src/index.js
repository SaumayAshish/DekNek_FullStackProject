require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stock');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Allowed Origins (FIXED) ───────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL, // production (Vercel)
  'http://localhost:3000',  // local dev
  'http://localhost:3001',  // optional local port
].filter(Boolean); // removes undefined values

// ── Security Middleware ──────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
}));

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Please wait before trying again.' },
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stock', stockRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Portfolio Tracker API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── Root Route (optional but useful) ─────────────────────────
app.get('/', (req, res) => {
  res.send('🚀 Portfolio Tracker API is running');
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found.`,
  });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  res.status(500).json({
    error: 'Something went wrong on the server.',
  });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Portfolio Tracker API running on port ${PORT}`);
  console.log(`📊 Health: /api/health`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;