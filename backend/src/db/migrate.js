require('dotenv').config();
const pool = require('./pool');

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Portfolio Holdings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(30) NOT NULL,
  stock_name   VARCHAR(100),
  quantity     NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  buy_price    NUMERIC(15, 2) NOT NULL CHECK (buy_price > 0),
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

-- ============================================================
-- Transactions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(30) NOT NULL,
  type         VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity     NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  price        NUMERIC(15, 2) NOT NULL CHECK (price > 0),
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(stock_symbol);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    await client.query(schema);
    console.log('✅ Database schema created successfully!');
    console.log('   Tables: users, portfolio, transactions');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
