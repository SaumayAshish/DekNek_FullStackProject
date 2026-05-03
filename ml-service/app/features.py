"""
Feature engineering for NIFTY50 stocks.
Computes technical indicators from 1-year OHLCV data via yfinance.
"""
import numpy as np
import pandas as pd
import yfinance as yf
import warnings
warnings.filterwarnings("ignore")


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / (loss + 1e-9)
    return 100 - (100 / (1 + rs))


def compute_macd(series: pd.Series):
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    return macd, signal


def compute_bollinger(series: pd.Series, period: int = 20):
    sma = series.rolling(period).mean()
    std = series.rolling(period).std()
    upper = sma + 2 * std
    lower = sma - 2 * std
    pct_b = (series - lower) / ((upper - lower) + 1e-9)
    return pct_b


def fetch_features(symbol: str, period: str = "1y") -> dict | None:
    """
    Downloads historical data and computes a rich feature vector.
    Returns a dict of scalar features (latest values).
    """
    try:
        df = yf.download(symbol, period=period, interval="1d", progress=False, auto_adjust=True)
        if df is None or len(df) < 60:
            return None

        close = df["Close"].squeeze()
        volume = df["Volume"].squeeze()
        high = df["High"].squeeze()
        low = df["Low"].squeeze()

        # --- Returns ---
        ret_1d  = close.pct_change(1).iloc[-1]
        ret_5d  = close.pct_change(5).iloc[-1]
        ret_21d = close.pct_change(21).iloc[-1]
        ret_63d = close.pct_change(63).iloc[-1]

        # --- RSI ---
        rsi = compute_rsi(close)
        rsi_val = rsi.iloc[-1]

        # --- MACD ---
        macd, signal = compute_macd(close)
        macd_hist = (macd - signal).iloc[-1]

        # --- Bollinger %B ---
        pct_b = compute_bollinger(close)
        pct_b_val = pct_b.iloc[-1]

        # --- Volume ratio ---
        vol_ratio = volume.iloc[-1] / (volume.rolling(20).mean().iloc[-1] + 1e-9)

        # --- 52-week stats ---
        high_52w = high.rolling(252).max().iloc[-1]
        low_52w  = low.rolling(252).min().iloc[-1]
        price_vs_52w_high = close.iloc[-1] / (high_52w + 1e-9)
        price_vs_52w_low  = close.iloc[-1] / (low_52w + 1e-9)

        # --- Volatility (annualised) ---
        vol_20d = close.pct_change().rolling(20).std().iloc[-1] * np.sqrt(252)

        # --- ATR ratio ---
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs()
        ], axis=1).max(axis=1)
        atr = tr.rolling(14).mean().iloc[-1]
        atr_ratio = atr / (close.iloc[-1] + 1e-9)

        # --- SMA distances ---
        sma20  = close.rolling(20).mean().iloc[-1]
        sma50  = close.rolling(50).mean().iloc[-1]
        sma200 = close.rolling(200).mean().iloc[-1] if len(close) >= 200 else sma50

        price_vs_sma20  = close.iloc[-1] / (sma20 + 1e-9) - 1
        price_vs_sma50  = close.iloc[-1] / (sma50 + 1e-9) - 1
        price_vs_sma200 = close.iloc[-1] / (sma200 + 1e-9) - 1

        # --- Stochastic %K ---
        low14  = low.rolling(14).min()
        high14 = high.rolling(14).max()
        stoch_k = ((close - low14) / ((high14 - low14) + 1e-9) * 100).iloc[-1]

        return {
            "ret_1d":           float(ret_1d),
            "ret_5d":           float(ret_5d),
            "ret_21d":          float(ret_21d),
            "ret_63d":          float(ret_63d),
            "rsi":              float(rsi_val),
            "macd_hist":        float(macd_hist),
            "pct_b":            float(pct_b_val),
            "vol_ratio":        float(vol_ratio),
            "price_vs_52w_high": float(price_vs_52w_high),
            "price_vs_52w_low": float(price_vs_52w_low),
            "vol_20d":          float(vol_20d),
            "atr_ratio":        float(atr_ratio),
            "price_vs_sma20":   float(price_vs_sma20),
            "price_vs_sma50":   float(price_vs_sma50),
            "price_vs_sma200":  float(price_vs_sma200),
            "stoch_k":          float(stoch_k),
            "current_price":    float(close.iloc[-1]),
        }
    except Exception as e:
        print(f"[features] Error for {symbol}: {e}")
        return None


FEATURE_COLS = [
    "ret_1d", "ret_5d", "ret_21d", "ret_63d",
    "rsi", "macd_hist", "pct_b", "vol_ratio",
    "price_vs_52w_high", "price_vs_52w_low",
    "vol_20d", "atr_ratio",
    "price_vs_sma20", "price_vs_sma50", "price_vs_sma200",
    "stoch_k",
]
