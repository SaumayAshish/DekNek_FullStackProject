"""
FastAPI ML Service — NIFTY50 AI Recommendation Engine
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from .model import predict
from .features import fetch_features
from .nifty50 import SYMBOLS, SYMBOL_MAP, NIFTY50

app = FastAPI(
    title="NIFTY50 AI Recommendation Engine",
    description="XGBoost-based stock recommendation with SHAP explanations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=4)

# ── In-memory cache ──────────────────────────────────────────
_recommendations_cache: dict = {}
_cache_lock = asyncio.Lock()


class PredictRequest(BaseModel):
    symbol: str


# ── GET /health ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "NIFTY50 ML Service", "version": "1.0.0"}


# ── POST /predict ────────────────────────────────────────────
@app.post("/predict")
async def predict_endpoint(request: PredictRequest):
    symbol = request.symbol.upper()
    if not symbol.endswith(".NS"):
        symbol = symbol + ".NS"

    if symbol not in SYMBOLS:
        raise HTTPException(status_code=400, detail=f"{symbol} is not in the NIFTY50 universe.")

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(executor, predict, symbol)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── GET /recommendations ─────────────────────────────────────
# Returns top BUY picks across all NIFTY50 (run in background or on-demand)
@app.get("/recommendations")
async def recommendations_endpoint(top_n: int = 5):
    """
    Returns top N BUY recommendations across all NIFTY50 stocks.
    Note: This is computationally intensive — uses cached results when available.
    """
    if _recommendations_cache.get("data"):
        data = _recommendations_cache["data"]
        buys = sorted(
            [r for r in data if r["recommendation"] == "BUY"],
            key=lambda x: x["confidence"],
            reverse=True
        )
        return {
            "recommendations": buys[:top_n],
            "total_analyzed": len(data),
            "cached": True,
            "timestamp": _recommendations_cache.get("timestamp"),
        }

    # Run predictions for a subset (top 10 liquid stocks) to avoid timeout
    priority_symbols = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "SBIN.NS", "AXISBANK.NS", "BHARTIARTL.NS", "LT.NS", "WIPRO.NS",
        "TATAMOTORS.NS", "SUNPHARMA.NS", "HCLTECH.NS", "ITC.NS", "KOTAKBANK.NS",
    ]

    loop = asyncio.get_event_loop()
    results = []
    for symbol in priority_symbols:
        try:
            r = await loop.run_in_executor(executor, predict, symbol)
            results.append(r)
        except Exception:
            pass

    buys = sorted(
        [r for r in results if r["recommendation"] == "BUY"],
        key=lambda x: x["confidence"],
        reverse=True
    )

    from datetime import datetime
    _recommendations_cache["data"] = results
    _recommendations_cache["timestamp"] = datetime.utcnow().isoformat()

    return {
        "recommendations": buys[:top_n],
        "total_analyzed": len(results),
        "cached": False,
        "timestamp": _recommendations_cache["timestamp"],
    }


# ── GET /risk/{symbol} ───────────────────────────────────────
@app.get("/risk/{symbol}")
async def risk_endpoint(symbol: str):
    sym = symbol.upper()
    if not sym.endswith(".NS"):
        sym += ".NS"

    loop = asyncio.get_event_loop()
    try:
        features = await loop.run_in_executor(executor, fetch_features, sym)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not features:
        raise HTTPException(status_code=404, detail=f"Could not compute risk for {sym}")

    vol = features.get("vol_20d", 0)
    if vol < 0.20:
        risk_label = "LOW"
        risk_color = "#10b981"
        risk_score = round(vol * 100, 1)
    elif vol < 0.35:
        risk_label = "MEDIUM"
        risk_color = "#f59e0b"
        risk_score = round(vol * 100, 1)
    else:
        risk_label = "HIGH"
        risk_color = "#ef4444"
        risk_score = round(vol * 100, 1)

    return {
        "symbol":         sym,
        "name":           SYMBOL_MAP.get(sym, {}).get("name", sym),
        "risk_label":     risk_label,
        "risk_color":     risk_color,
        "annualised_vol": risk_score,
        "rsi":            round(features.get("rsi", 50), 2),
        "momentum_21d":   round(features.get("ret_21d", 0) * 100, 2),
        "atr_ratio":      round(features.get("atr_ratio", 0), 4),
    }


# ── GET /nifty50 ─────────────────────────────────────────────
@app.get("/nifty50")
def nifty50_list():
    return {"stocks": NIFTY50}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
