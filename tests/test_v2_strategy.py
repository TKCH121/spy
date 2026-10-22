"""v2 work items 2-4 and the evidence helpers (docs/v2_design_note.md)."""

import numpy as np
import pandas as pd
import pytest

from src import config, v2
from src.backtest import run_backtest


def test_class_means_and_expected_return():
    y = pd.Series([1, 1, 0, -1, -1, 0])
    r = pd.Series([0.03, 0.01, 0.0, -0.02, -0.04, 0.002])
    mu = v2.class_means(y, r)
    assert np.isclose(mu[1], 0.02) and np.isclose(mu[-1], -0.03) and np.isclose(mu[0], 0.001)
    proba = pd.DataFrame({-1: [0.2, 0.6], 0: [0.3, 0.2], 1: [0.5, 0.2]})
    er = v2.expected_return(proba, mu)
    assert np.isclose(er[0], 0.2 * -0.03 + 0.3 * 0.001 + 0.5 * 0.02)
    assert np.isclose(er[1], 0.6 * -0.03 + 0.2 * 0.001 + 0.2 * 0.02)


def test_round_trip_hurdle():
    assert np.isclose(v2.ROUND_TRIP, 0.003)


def test_default_long_rule():
    c = v2.ROUND_TRIP
    er = pd.Series([0.001, -c / 2, -2 * c, -c / 2, -0.0001, 0.0, 0.002])
    assert v2.positions_from_er(er, "long").tolist() == [1, 1, 0, 0, 0, 1, 1]


def test_default_cash_rule():
    c = v2.ROUND_TRIP
    er = pd.Series([0.001, c / 2, 2 * c, c / 2, 0.0001, 0.0, 2 * c])
    assert v2.positions_from_er(er, "cash").tolist() == [0, 0, 1, 1, 1, 0, 1]


def test_simulator_matches_vectorbt_without_interest(synthetic_ohlcv):
    prices = synthetic_ohlcv.loc["2023-01-01":"2024-12-31"]
    rng = np.random.default_rng(1)
    pos = pd.Series((rng.random(len(prices)) > 0.5).astype(int), index=prices.index)
    pos = pos.rolling(7).max().fillna(0).astype(int)  # fewer, longer spells
    ours = v2.simulate(v2.held_from_positions(pos), prices)["value"]
    vbt_value = run_backtest(pos, prices).value()
    assert np.allclose(ours.to_numpy(), vbt_value.to_numpy(), rtol=1e-9)


def test_cash_earns_daily_interest(synthetic_ohlcv):
    prices = synthetic_ohlcv.iloc[:10]
    held = pd.Series(0, index=prices.index)
    rf = pd.Series(0.0002, index=prices.index)
    v = v2.simulate(held, prices, rf)["value"]
    assert np.isclose(v.iloc[-1], config.INIT_CASH * 1.0002 ** 9)


def test_tbill_rate_is_lagged(tmp_path):
    cal = pd.bdate_range("2024-01-01", periods=5)
    pd.DataFrame({"IRX": [5.0, 5.2, 5.4, 5.6, 5.8]}, index=cal.rename("Date")).to_csv(tmp_path / "irx.csv")
    rf = v2.load_tbill_daily(cal, tmp_path / "irx.csv")
    assert rf.iloc[0] == 0.0
    assert np.isclose(rf.iloc[1], 5.0 / 100 / 252)
    assert np.isclose(rf.iloc[4], 5.6 / 100 / 252)


def test_random_timing_keeps_exposure_and_switches():
    held = pd.Series([0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0])
    for p in v2.random_timing_paths(held, n=50):
        assert p.sum() == held.sum()
        assert (p.diff().abs() > 0).sum() == (held.diff().abs() > 0).sum()
        assert p.iloc[0] == held.iloc[0]


def test_held_from_positions_start():
    pos = pd.Series([0, 1, 1])
    assert v2.held_from_positions(pos).tolist() == [0, 0, 1]
    assert v2.held_from_positions(pos, start=1).tolist() == [1, 0, 1]


def test_positions_reject_unknown_default():
    with pytest.raises(ValueError):
        v2.positions_from_er(pd.Series([0.0]), "short")
