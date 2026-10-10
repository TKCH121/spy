"""Leakage tests: the assignment says the code will be audited for look-ahead bias."""

import numpy as np
import pandas as pd
import pytest

from spysignal import backtest
from spysignal.config import EMBARGO, HORIZON
from spysignal.features import FEATURES, build_features
from spysignal.labels import fit_k, forward_return, make_labels, threshold_scale
from spysignal.splits import split_masks


@pytest.fixture(scope="module")
def market() -> pd.DataFrame:
    """Synthetic random-walk market: 3 years of business days."""
    rng = np.random.default_rng(0)
    idx = pd.bdate_range("2015-01-01", periods=800)
    close = 100 * np.exp(np.cumsum(rng.normal(0.0003, 0.01, len(idx))))
    open_ = close * np.exp(rng.normal(0, 0.003, len(idx)))
    high = np.maximum(open_, close) * 1.004
    low = np.minimum(open_, close) * 0.996
    vix = 15 + np.abs(rng.normal(0, 3, len(idx)))
    return pd.DataFrame(
        {
            "open": open_, "high": high, "low": low, "close": close,
            "volume": rng.integers(5e7, 1e8, len(idx)).astype(float),
            "unadj_close": close, "vix": vix, "vix3m": vix + 1,
        },
        index=idx,
    )


@pytest.mark.parametrize("cut", [300, 450, 799])
def test_features_do_not_use_future_rows(market, cut):
    """Features for day t must be identical whether or not later days exist."""
    full = build_features(market).iloc[:cut]
    truncated = build_features(market.iloc[:cut])
    pd.testing.assert_frame_equal(full, truncated)


def test_every_model_feature_is_computed(market):
    feats = build_features(market)
    assert set(FEATURES) <= set(feats.columns)
    assert feats[list(FEATURES)].iloc[300:].notna().all().all()


def test_forward_return_starts_at_next_open(market):
    t = 400
    fwd = forward_return(market)
    o = market["open"].to_numpy()
    assert fwd.iloc[t] == pytest.approx(np.log(o[t + HORIZON + 1] / o[t + 1]))


def test_label_ignores_prices_after_its_window(market):
    t = 400
    shocked = market.copy()
    shocked.iloc[t + HORIZON + 2:, :4] *= 2.0      # change everything after open t+H+1
    assert forward_return(shocked).iloc[t] == forward_return(market).iloc[t]


def test_threshold_scale_uses_only_past(market):
    full = threshold_scale(market).iloc[:500]
    truncated = threshold_scale(market.iloc[:500])
    pd.testing.assert_series_equal(full, truncated)


def test_k_gives_requested_hold_share(market):
    fwd, scale = forward_return(market), threshold_scale(market)
    k = fit_k(fwd, scale)
    y = make_labels(fwd, scale, k).dropna()
    assert (y == 0).mean() == pytest.approx(1 / 3, abs=0.01)


def test_split_embargo():
    idx = pd.bdate_range("2020-06-01", "2023-06-30")
    masks = split_masks(idx, pd.Series(True, index=idx))
    pos = {k: np.flatnonzero(m.to_numpy()) for k, m in masks.items()}
    for earlier, later in [("train", "val"), ("val", "test")]:
        last_label_end = pos[earlier].max() + HORIZON + 1
        assert last_label_end < pos[later].min()
        assert pos[later].min() - pos[earlier].max() - 1 >= EMBARGO


def test_backtest_trades_at_next_open():
    idx = pd.bdate_range("2021-01-01", periods=6)
    px = pd.Series([100.0, 100.0, 110.0, 121.0, 121.0, 121.0], index=idx)
    signals = pd.Series([0, 1, 0, -1, 0, 0], index=idx)   # Buy decided at close of day 1
    pf = backtest.run(signals, px, fee=0.0)
    held = pf.asset_value() > 0
    assert held.tolist() == [False, False, True, True, False, False]
    # bought at day-2 open (110), sold at day-4 open (121): +10%
    assert pf.value().iloc[-1] == pytest.approx(10_000 * 121 / 110)


def test_fees_are_charged_on_each_trade():
    idx = pd.bdate_range("2021-01-01", periods=5)
    px = pd.Series(100.0, index=idx)
    signals = pd.Series([1, 0, -1, 0, 0], index=idx)
    pf = backtest.run(signals, px, fee=0.001)
    assert pf.value().iloc[-1] == pytest.approx(10_000 * (1 - 0.001) ** 2, rel=1e-4)
