"""Summarise the EDA for the slides: writes outputs/eda_slides.json.

Same data and definitions as notebooks/01_eda.ipynb (price snapshot, 15 features, v1's
±1% close→close label). Run from the repo root:  python presentation/_build/eda_data.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from src import config  # noqa: E402
from src.data import load_snapshot  # noqa: E402
from src.dataset import build_dataset  # noqa: E402
from src.features import FEATURE_COLS  # noqa: E402

raw = load_snapshot()
close = raw["Close"]
r = close.pct_change().dropna()

month_end = close.resample("ME").last()
lags = list(range(1, 11))
ds = build_dataset(raw)
lab = ds["label"].dropna().astype(int)
by_year = (
    lab.groupby(lab.index.year).value_counts(normalize=True).unstack().reindex(columns=config.CLASSES)
)
by_year = by_year.loc[2010:2024]
train = ds.loc[config.TRAIN[0] : config.TRAIN[1], FEATURE_COLS]
corr = train.corr()

out = {
    "price_monthly": {
        "dates": [d.strftime("%Y-%m") for d in month_end.index],
        "close": [round(float(x), 2) for x in month_end],
    },
    "acf_returns": [round(float(r.autocorr(k)), 3) for k in lags],
    "acf_abs_returns": [round(float(r.abs().autocorr(k)), 3) for k in lags],
    "excess_kurtosis": round(float(r.kurt()), 1),
    "days_beyond_3sd": int((r.abs() > 3 * r.std()).sum()),
    "days_expected_beyond_3sd_if_normal": round(float(len(r) * 0.0027), 0),
    "n_days": int(len(r)),
    "class_share_by_year": {
        "years": [int(y) for y in by_year.index],
        **{
            config.CLASS_NAMES[c]: [round(float(v), 3) for v in by_year[c].fillna(0)]
            for c in config.CLASSES
        },
    },
    "feature_corr": {
        "features": FEATURE_COLS,
        "matrix": [[round(float(v), 2) for v in row] for row in corr.to_numpy()],
        "pairs_above_0.8": int(((corr.abs() > 0.8).sum().sum() - len(FEATURE_COLS)) // 2),
    },
}
(config.OUTPUT_DIR / "eda_slides.json").write_text(json.dumps(out, indent=1))
print(
    {
        k: v
        for k, v in out.items()
        if k in ("acf_returns", "acf_abs_returns", "excess_kurtosis", "days_beyond_3sd", "days_expected_beyond_3sd_if_normal", "n_days")
    }
)
print("Sell share by year:", dict(zip(out["class_share_by_year"]["years"], out["class_share_by_year"]["Sell"])))
print("feature pairs |corr| > 0.8:", out["feature_corr"]["pairs_above_0.8"])
