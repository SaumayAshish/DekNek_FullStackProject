const NodeCache = require('node-cache');

// Cache with 60-second TTL for stock prices, 5-min for ML results
const priceCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const mlCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = { priceCache, mlCache };
