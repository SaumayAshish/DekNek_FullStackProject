"""
XGBoost model training for NIFTY50 stock recommendations.

Strategy:
- Download 2 years of daily data for all NIFTY50 stocks
- Create sliding-window samples (features at day T → label based on 30-day forward return)
- Label:  BUY (2) if fwd_ret > +5%, SELL (0) if < -5%, HOLD (1) otherwise
- Train XGBoost multi-class classifier
- Save model + feature scaler to disk
"""

import os
import numpy as np
import pandas as pd
import yfinance as yf
import joblib
import warnings
warnings.filterwarnings("ignore")

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

from .features import compute_rsi, compute_macd, compute_bollinger, FEATURE_COLS
from .nifty50 import SYMBOLS

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH   = os.path.join(MODELS_DIR, "xgb_model.pkl")
SCALER_PATH  = os.path.join(MODELS_DIR, "scaler.pkl")

LABEL_NAMES  = {0: "SELL", 1: "HOLD", 2: "BUY"}
FWD_DAYS     = 21     # ~1 month forward return window
BUY_THRESH   = 0.05
SELL_THRESH  = -0.05


def build_dataset():
    """Download 2yr data, slide window, compute features + labels."""
    all_rows = []

    for symbol in SYMBOLS:
        try:
            df = yf.download(symbol, period="2y", interval="1d",
                             progress=False, auto_adjust=True)
            if df is None or len(df) < 120:
                continue

            close  = df["Close"].squeeze()
            volume = df["Volume"].squeeze()
            high   = df["High"].squeeze()
            low    = df["Low"].squeeze()

            # Compute indicators over full history
            rsi      = compute_rsi(close)
            macd, sig = compute_macd(close)
            macd_h   = macd - sig
            pct_b    = compute_bollinger(close)

            ret_1d  = close.pct_change(1)
            ret_5d  = close.pct_change(5)
            ret_21d = close.pct_change(21)
            ret_63d = close.pct_change(63)

            vol_ratio   = volume / (volume.rolling(20).mean() + 1e-9)
            high_52w    = high.rolling(252).max()
            low_52w     = low.rolling(252).min()
            p_vs_52high = close / (high_52w + 1e-9)
            p_vs_52low  = close / (low_52w + 1e-9)
            vol_20d     = close.pct_change().rolling(20).std() * np.sqrt(252)

            tr = pd.concat([
                high - low,
                (high - close.shift()).abs(),
                (low  - close.shift()).abs()
            ], axis=1).max(axis=1)
            atr       = tr.rolling(14).mean()
            atr_ratio = atr / (close + 1e-9)

            sma20  = close.rolling(20).mean()
            sma50  = close.rolling(50).mean()
            sma200 = close.rolling(200).mean()

            p_vs_sma20  = close / (sma20 + 1e-9) - 1
            p_vs_sma50  = close / (sma50 + 1e-9) - 1
            p_vs_sma200 = close / (sma200 + 1e-9) - 1

            low14  = low.rolling(14).min()
            high14 = high.rolling(14).max()
            stoch_k = (close - low14) / ((high14 - low14) + 1e-9) * 100

            # Forward return label
            fwd_ret = close.shift(-FWD_DAYS) / (close + 1e-9) - 1

            feat_df = pd.DataFrame({
                "ret_1d":            ret_1d,
                "ret_5d":            ret_5d,
                "ret_21d":           ret_21d,
                "ret_63d":           ret_63d,
                "rsi":               rsi,
                "macd_hist":         macd_h,
                "pct_b":             pct_b,
                "vol_ratio":         vol_ratio,
                "price_vs_52w_high": p_vs_52high,
                "price_vs_52w_low":  p_vs_52low,
                "vol_20d":           vol_20d,
                "atr_ratio":         atr_ratio,
                "price_vs_sma20":    p_vs_sma20,
                "price_vs_sma50":    p_vs_sma50,
                "price_vs_sma200":   p_vs_sma200,
                "stoch_k":           stoch_k,
                "fwd_ret":           fwd_ret,
            }).dropna()

            # Create labels
            feat_df["label"] = 1  # HOLD
            feat_df.loc[feat_df["fwd_ret"] > BUY_THRESH,  "label"] = 2  # BUY
            feat_df.loc[feat_df["fwd_ret"] < SELL_THRESH, "label"] = 0  # SELL

            all_rows.append(feat_df)
            print(f"  ✓ {symbol}: {len(feat_df)} samples")

        except Exception as e:
            print(f"  ✗ {symbol}: {e}")

    if not all_rows:
        raise RuntimeError("No data collected for training.")

    full = pd.concat(all_rows, ignore_index=True)
    return full


def train():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("📥 Downloading NIFTY50 data for training...")
    data = build_dataset()

    X = data[FEATURE_COLS].values
    y = data["label"].values

    print(f"\n📊 Dataset: {len(X)} samples | BUY={sum(y==2)} HOLD={sum(y==1)} SELL={sum(y==0)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    print("\n🔄 Training XGBoost...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    print("\n📈 Evaluation:")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=["SELL", "HOLD", "BUY"]))

    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\n✅ Model saved → {MODEL_PATH}")
    print(f"✅ Scaler saved → {SCALER_PATH}")


if __name__ == "__main__":
    train()
