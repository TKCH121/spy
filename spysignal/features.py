"""Features. Each one is computed from data up to and including the close of day t.

Every rolling window looks backwards only, and every feature is a return, a ratio or a
z-score, so the absolute price level (and its dividend adjustment) never matters.
The truncation test in tests/test_leakage.py enforces "no peeking" for every column.
"""

import numpy as np
import pandas as pd

# name -> (family, one-line reason it might predict anything)
FEATURES = {
    "trend_8_24":   ("trend", "fast trend: EMA gap / volatility (MACD done properly, as CTAs use it)"),
    "trend_16_48":  ("trend", "medium trend, same construction"),
    "trend_32_96":  ("trend", "slow trend, same construction"),
    "mom_12_1":     ("trend", "12-month momentum skipping the last month (Moskowitz et al. 2012)"),
    "zscore_20":    ("reversal", "std devs from the 20-day mean: Bollinger %B without the branding"),
    "ret_5d_z":     ("reversal", "last week's return in units of volatility (short-term reversal)"),
    "vol_20":       ("volatility", "realized volatility; volatility clusters so it is forecastable"),
    "vol_ratio":    ("volatility", "5-day vs 60-day volatility: is risk rising or calming?"),
    "range_vol":    ("volatility", "Parkinson high-low volatility: uses intraday range, less noisy"),
    "vix":          ("market state", "option-implied 30-day volatility"),
    "vrp":          ("market state", "VIX minus realized vol: variance risk premium (Bollerslev et al. 2009)"),
    "vix_term":     ("market state", "VIX / VIX3M: above 1 means near-term panic (inverted curve)"),
    "volume_ratio": ("volume", "volume vs its 60-day average; raw volume is not comparable across years"),
    "amihud":       ("volume", "illiquidity |return| per dollar traded, vs its 1-year norm (Amihud 2002)"),
    "tom":          ("calendar", "next 5 days include the turn of the month (Lakonishok & Smidt 1988)"),
}

# Not model inputs: only for the EDA check of whether VWAP adds anything over a plain average.
EDA_ONLY = ["px_sma20", "px_vwap20"]


def _daily_vol(log_ret: pd.Series, n: int) -> pd.Series:
    return log_ret.rolling(n, min_periods=n).std()


def _trend(close: pd.Series, fast: int, slow: int, vol: pd.Series) -> pd.Series:
    ema_f = close.ewm(span=fast, adjust=False, min_periods=slow).mean()
    ema_s = close.ewm(span=slow, adjust=False, min_periods=slow).mean()
    return (ema_f / ema_s - 1) / vol


def _weekdays_to_month_end(index: pd.DatetimeIndex) -> pd.Series:
    """Weekdays after t up to the month's last weekday. Calendar-only, no market data."""
    days = index.values.astype("datetime64[D]")
    month_end = (index + pd.offsets.MonthEnd(0)).values.astype("datetime64[D]")
    one = np.timedelta64(1, "D")
    return pd.Series(np.busday_count(days + one, month_end + one), index=index)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Model features plus the EDA-only columns, one row per trading day."""
    c, h, l = df["close"], df["high"], df["low"]
    r = np.log(c / c.shift(1))
    vol5, vol20, vol60 = _daily_vol(r, 5), _daily_vol(r, 20), _daily_vol(r, 60)

    sma20 = c.rolling(20, min_periods=20).mean()
    typical = (h + l + c) / 3
    vwap20 = (typical * df["volume"]).rolling(20, min_periods=20).sum() / df["volume"].rolling(
        20, min_periods=20
    ).sum()

    dollar_vol = df["unadj_close"] * df["volume"]
    illiq = (r.abs() / dollar_vol).rolling(20, min_periods=20).mean()

    out = pd.DataFrame(
        {
            "trend_8_24": _trend(c, 8, 24, vol60),
            "trend_16_48": _trend(c, 16, 48, vol60),
            "trend_32_96": _trend(c, 32, 96, vol60),
            "mom_12_1": np.log(c.shift(21) / c.shift(252)),
            "zscore_20": (c - sma20) / c.rolling(20, min_periods=20).std(),
            "ret_5d_z": np.log(c / c.shift(5)) / (vol20 * np.sqrt(5)),
            "vol_20": vol20 * np.sqrt(252),
            "vol_ratio": vol5 / vol60,
            "range_vol": np.sqrt(
                (np.log(h / l) ** 2).rolling(20, min_periods=20).mean() / (4 * np.log(2)) * 252
            ),
            "vix": df["vix"] / 100,
            "vrp": df["vix"] / 100 - vol20 * np.sqrt(252),
            "vix_term": df["vix"] / df["vix3m"],
            "volume_ratio": np.log(df["volume"] / df["volume"].rolling(60, min_periods=60).mean()),
            "amihud": np.log(illiq / illiq.rolling(252, min_periods=252).mean()),
            "tom": (_weekdays_to_month_end(df.index) <= 5).astype(float),
            "px_sma20": c / sma20 - 1,
            "px_vwap20": c / vwap20 - 1,
        },
        index=df.index,
    )
    return out.replace([np.inf, -np.inf], np.nan)
