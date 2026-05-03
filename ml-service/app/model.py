"""
Predictor: loads trained XGBoost + scaler and generates recommendations with SHAP explanations.
"""

import os
import numpy as np
import joblib
import shap
import warnings
warnings.filterwarnings("ignore")

from .features import fetch_features, FEATURE_COLS
from .nifty50 import SYMBOL_MAP

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH  = os.path.join(MODELS_DIR, "xgb_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

LABEL_MAP   = {0: "SELL", 1: "HOLD", 2: "BUY"}
COLOR_MAP   = {"BUY": "#10b981", "HOLD": "#f59e0b", "SELL": "#ef4444"}

_model   = None
_scaler  = None
_explainer = None


def _load():
    global _model, _scaler, _explainer
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Run: python -m app.train to train first."
            )
        _model  = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        _explainer = shap.TreeExplainer(_model)
    return _model, _scaler, _explainer


def _shap_reasons(shap_vals: np.ndarray, pred_class: int) -> list[dict]:
    """Return top-5 feature contributions for the predicted class."""
    class_shap = shap_vals[0][pred_class]   # shape: (n_features,)
    sorted_idx = np.argsort(np.abs(class_shap))[::-1][:5]
    reasons = []
    for i in sorted_idx:
        feat  = FEATURE_COLS[i]
        value = float(class_shap[i])
        reasons.append({
            "feature":       feat,
            "impact":        round(value, 4),
            "direction":     "positive" if value > 0 else "negative",
            "description":   _describe_feature(feat, value),
        })
    return reasons


def _describe_feature(feat: str, impact: float) -> str:
    direction = "bullish" if impact > 0 else "bearish"
    descriptions = {
        "rsi":              f"RSI indicates {'oversold (buy signal)' if impact > 0 else 'overbought (sell signal)'}",
        "macd_hist":        f"MACD histogram shows {direction} momentum",
        "ret_21d":          f"1-month return is {direction}",
        "ret_63d":          f"3-month momentum is {direction}",
        "price_vs_52w_high": f"Price is {'near 52-week high' if impact < 0 else 'well below 52-week high (potential upside)'}",
        "price_vs_sma50":   f"Price is {'above' if impact > 0 else 'below'} 50-day moving average",
        "price_vs_sma200":  f"Long-term trend is {direction}",
        "vol_20d":          f"Volatility is {'favorable' if impact > 0 else 'elevated (risk factor)'}",
        "pct_b":            f"Bollinger Band position is {direction}",
        "stoch_k":          f"Stochastic oscillator shows {direction} signal",
        "vol_ratio":        f"Volume is {'above average (confirmation)' if impact > 0 else 'below average (weak signal)'}",
        "atr_ratio":        f"ATR suggests {'moderate' if impact > 0 else 'high'} risk",
        "ret_1d":           f"Recent price action is {direction}",
        "ret_5d":           f"Weekly momentum is {direction}",
        "price_vs_52w_low": f"Price is {'well above 52-week low' if impact > 0 else 'near 52-week low'}",
        "price_vs_sma20":   f"Short-term trend vs 20-day SMA is {direction}",
    }
    return descriptions.get(feat, f"{feat} contributes a {direction} signal")


def predict(symbol: str) -> dict:
    """Full prediction pipeline for a single symbol."""
    model, scaler, explainer = _load()

    features = fetch_features(symbol)
    if features is None:
        raise ValueError(f"Could not fetch features for {symbol}")

    X_raw   = np.array([[features[f] for f in FEATURE_COLS]])
    X_scaled = scaler.transform(X_raw)

    proba   = model.predict_proba(X_scaled)[0]
    pred    = int(np.argmax(proba))
    label   = LABEL_MAP[pred]
    confidence = float(round(proba[pred], 4))

    # SHAP explanations
    shap_vals = explainer.shap_values(X_scaled)
    reasons   = _shap_reasons(shap_vals, pred)

    meta = SYMBOL_MAP.get(symbol, {})

    return {
        "symbol":         symbol,
        "name":           meta.get("name", symbol),
        "sector":         meta.get("sector", "Unknown"),
        "recommendation": label,
        "confidence":     confidence,
        "confidence_pct": round(confidence * 100, 1),
        "color":          COLOR_MAP[label],
        "probabilities":  {
            "SELL": round(float(proba[0]), 4),
            "HOLD": round(float(proba[1]), 4),
            "BUY":  round(float(proba[2]), 4),
        },
        "features": {k: round(v, 4) for k, v in features.items() if k != "current_price"},
        "current_price":  features["current_price"],
        "shap_reasons":   reasons,
        "summary":        _build_summary(label, confidence, reasons),
    }


def _build_summary(label: str, confidence: float, reasons: list) -> str:
    top = reasons[0]["description"] if reasons else ""
    conf_str = f"{round(confidence * 100, 1)}%"
    if label == "BUY":
        return f"Model recommends BUY with {conf_str} confidence. {top}."
    elif label == "SELL":
        return f"Model recommends SELL with {conf_str} confidence. {top}."
    else:
        return f"Model suggests HOLD with {conf_str} confidence. Insufficient directional signal."
