require('dotenv').config();
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const BASE = `${SUPABASE_URL}/rest/v1`;

// Generic query helper with 15s timeout
async function query(path, method = 'GET', data = null, params = {}) {
  const config = {
    method,
    url: `${BASE}${path}`,
    headers: { ...headers },
    timeout: 30000,
    params,
  };
  if (data) config.data = data;

  const res = await axios(config);
  return res.data;
}

// ── Table helpers ────────────────────────────────────────────

async function select(table, filters = {}) {
  // Build PostgREST query params
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${value}`;
  }
  params['select'] = '*';
  return query(`/${table}`, 'GET', null, params);
}

async function selectOne(table, filters = {}) {
  const rows = await select(table, filters);
  return rows?.[0] || null;
}

async function insert(table, data, returning = true) {
  const hdrs = { ...headers };
  if (returning) hdrs['Prefer'] = 'return=representation';
  const res = await axios.post(`${BASE}/${table}`, data, { headers: hdrs, timeout: 30000 });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

async function update(table, data, filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${value}`;
  }
  const res = await axios.patch(`${BASE}/${table}`, data, {
    headers: { ...headers, 'Prefer': 'return=representation' },
    params,
    timeout: 30000,
  });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

async function remove(table, filters = {}) {
  const params = {};
  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${value}`;
  }
  const res = await axios.delete(`${BASE}/${table}`, {
    headers: { ...headers, 'Prefer': 'return=representation' },
    params,
    timeout: 30000,
  });
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

module.exports = { select, selectOne, insert, update, remove };
