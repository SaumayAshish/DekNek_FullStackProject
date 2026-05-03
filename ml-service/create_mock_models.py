"""
Create mock trained XGBoost model and scaler for demonstration.
This allows the app to run even if live training fails due to API issues.
"""

import os
import joblib
import numpy as np
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler

# Create models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODELS_DIR, "xgb_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

print("🔧 Creating mock XGBoost model...")

# Feature names (16 features as defined in features.py)
FEATURE_COLS = [
    "ret_1d", "ret_5d", "ret_21d", "ret_63d",
    "rsi", "macd_hist", "pct_b",
    "vol_ratio", "p_vs_52high", "p_vs_52low", "vol_20d",
    "atr_ratio", "p_vs_sma20", "p_vs_sma50", "p_vs_sma200",
    "stoch_k"
]

# Create dummy training data to initialize the model
np.random.seed(42)
X_dummy = np.random.randn(1000, len(FEATURE_COLS))
y_dummy = np.random.randint(0, 3, 1000)  # 3 classes: SELL(0), HOLD(1), BUY(2)

# Train a simple XGBoost model on dummy data
model = XGBClassifier(
    n_estimators=50,
    max_depth=5,
    learning_rate=0.1,
    random_state=42,
    tree_method='hist',
    device='cpu'
)
model.fit(X_dummy, y_dummy)

# Create and fit scaler
scaler = StandardScaler()
scaler.fit(X_dummy)

# Save model and scaler
joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)

print(f"✅ Mock model saved to {MODEL_PATH}")
print(f"✅ Scaler saved to {SCALER_PATH}")
print("\n⚠️  NOTE: These are MOCK models for demonstration.")
print("For production, run: python -m app.train (when yfinance API is working)")
