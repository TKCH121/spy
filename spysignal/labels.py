"""Buy (+1) / Hold (0) / Sell (-1) labels, volatility-scaled.

Signal at close t -> earliest trade at open t+1, so the label is the return we could
actually capture:

    fwd_ret_t = log(open_{t+H+1} / open_{t+1})
    scale_t   = sigma_60(t) * sqrt(H)            # daily vol known at close t
    Buy  if fwd_ret_t >  k * scale_t
    Sell if fwd_ret_t < -k * scale_t
    Hold otherwise

Scaling by volatility means "Buy" means "a big up move *for current conditions*", so the
class mix stays stable across calm and wild years and volatility alone can't predict Hold.
k is fitted on the training period only.
"""

import numpy as np
import pandas as pd

from spysignal.config import HOLD_SHARE, HORIZON


def forward_return(df: pd.DataFrame, horizon: int = HORIZON) -> pd.Series:
    o = df["open"]
    return np.log(o.shift(-(horizon + 1)) / o.shift(-1)).rename("fwd_ret")


def threshold_scale(df: pd.DataFrame, horizon: int = HORIZON) -> pd.Series:
    r = np.log(df["close"] / df["close"].shift(1))
    return (r.rolling(60, min_periods=60).std() * np.sqrt(horizon)).rename("scale")


def fit_k(fwd_ret: pd.Series, scale: pd.Series, hold_share: float = HOLD_SHARE) -> float:
    """k such that `hold_share` of the given (training) rows fall inside +-k*scale."""
    z = (fwd_ret / scale).dropna()
    return float(z.abs().quantile(hold_share))


def make_labels(fwd_ret: pd.Series, scale: pd.Series, k: float) -> pd.Series:
    y = pd.Series(0.0, index=fwd_ret.index)
    y[fwd_ret > k * scale] = 1
    y[fwd_ret < -k * scale] = -1
    y[fwd_ret.isna() | scale.isna()] = np.nan
    return y.rename("label")
