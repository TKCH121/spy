"""Download and load daily data.

SPY prices are dividend-adjusted: each bar's Open/High/Low are scaled by that bar's
Adj Close / Close, so returns between any two prices include dividends. Never use an
adjusted price *level* as a feature (back-adjustment uses later dividends); use returns
and ratios only.
"""

from pathlib import Path

import pandas as pd
import yfinance as yf

from spysignal.config import DATA_START, TICKERS

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
RAW_FILE = DATA_DIR / "raw.csv"


def download(start: str = DATA_START, path: Path = RAW_FILE) -> pd.DataFrame:
    """Fetch SPY, VIX and VIX3M and save one CSV. Run once; everyone then uses the same file."""
    frames = {}
    for name, ticker in TICKERS.items():
        d = yf.download(ticker, start=start, auto_adjust=False, progress=False, actions=False)
        d.columns = d.columns.get_level_values(0)
        frames[name] = d
    spy = frames["spy"]
    out = pd.DataFrame(
        {
            "open": spy["Open"], "high": spy["High"], "low": spy["Low"],
            "close": spy["Close"], "adj_close": spy["Adj Close"], "volume": spy["Volume"],
            # VIX indices are aligned to SPY trading days; a missing print is carried
            # forward one day at most (it is still known before the next open).
            "vix": frames["vix"]["Close"].reindex(spy.index).ffill(limit=1),
            "vix3m": frames["vix3m"]["Close"].reindex(spy.index).ffill(limit=1),
        }
    )
    out.index.name = "date"
    path.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(path)
    return out


def load(path: Path = RAW_FILE) -> pd.DataFrame:
    """Return adjusted OHLCV plus VIX columns, indexed by trading date."""
    raw = pd.read_csv(path, index_col="date", parse_dates=True).sort_index()
    if not raw.index.is_unique:
        raise ValueError("Duplicate dates in raw data.")
    factor = raw["adj_close"] / raw["close"]
    return pd.DataFrame(
        {
            "open": raw["open"] * factor,
            "high": raw["high"] * factor,
            "low": raw["low"] * factor,
            "close": raw["adj_close"],
            "volume": raw["volume"].astype(float),
            "unadj_close": raw["close"],   # only for dollar volume, never as a price level
            "vix": raw["vix"],
            "vix3m": raw["vix3m"],
        },
        index=raw.index,
    )
