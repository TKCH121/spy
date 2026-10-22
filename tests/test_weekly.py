"""One decision a week (src/weekly.py)."""

import numpy as np
import pandas as pd

from src import v2, weekly


def test_week_ends_are_last_trading_day_of_each_week():
    idx = pd.bdate_range("2024-03-25", "2024-04-12").drop(pd.Timestamp("2024-03-29"))  # Good Friday
    ends = weekly.week_end_days(idx)
    assert list(ends) == [
        pd.Timestamp("2024-03-28"),
        pd.Timestamp("2024-04-05"),
        pd.Timestamp("2024-04-12"),
    ]


def test_actions_only_change_position_at_week_ends():
    idx = pd.bdate_range("2024-01-01", "2024-01-26")  # four Mon-Fri weeks
    actions = pd.Series(1, index=idx)  # Buy every day...
    actions[idx.weekday == 4] = [-1, 1, 0, -1]  # ...but Fridays say Sell, Buy, Hold, Sell
    pos = weekly.weekly_positions_from_actions(actions, start=0)
    fridays = pos[idx.weekday == 4].tolist()
    assert fridays == [0, 1, 1, 0]
    # constant from each Friday until the next one
    for i, d in enumerate(idx[:-1]):
        if d.weekday() != 4:
            assert pos.iloc[i + 1] == pos.iloc[i] or idx[i + 1].weekday() == 4
    assert (pos.loc[:"2024-01-04"] == 0).all()  # before the first decision: start state


def test_trade_fills_at_next_open_and_is_held_all_week():
    idx = pd.bdate_range("2024-01-01", "2024-01-19")
    actions = pd.Series(0, index=idx)
    actions.loc["2024-01-05"] = 1  # Buy decided on Friday 5 Jan
    held = v2.held_from_positions(weekly.weekly_positions_from_actions(actions, start=0))
    assert held.loc["2024-01-05"] == 0  # not yet invested on the decision day
    assert (held.loc["2024-01-08":"2024-01-12"] == 1).all()  # Monday open through the week


def test_expected_return_rule_uses_week_end_values_only():
    idx = pd.bdate_range("2024-01-01", "2024-01-19")
    er = pd.Series(-0.01, index=idx)  # far below the exit line every weekday...
    er[idx.weekday == 4] = 0.001  # ...except on Fridays
    pos = weekly.weekly_positions_from_er(er, "long")
    assert (pos == 1).all()  # never exits, because Fridays are fine
    er[idx.weekday == 4] = [-0.01, 0.0, 0.001]
    pos = weekly.weekly_positions_from_er(er, "long")
    assert pos[idx.weekday == 4].tolist() == [0, 1, 1]
    assert np.array_equal(pos.loc["2024-01-08":"2024-01-11"], [0, 0, 0, 0])


def test_weekly_weights_follow_risk_bands():
    idx = pd.bdate_range("2024-01-01", "2024-01-26")
    p = pd.Series(0.05, index=idx)
    p[idx.weekday == 4] = [0.10, 0.25, 0.45, 0.10]
    w = weekly.weekly_weights_from_risk(p, half_at=0.20, zero_at=0.40)
    assert w[idx.weekday == 4].tolist() == [1.0, 0.5, 0.0, 1.0]
    assert (w.loc[:"2024-01-04"] == 1.0).all()


def test_weight_simulator_matches_all_in_simulator(synthetic_ohlcv):
    prices = synthetic_ohlcv.loc["2023-01-01":"2024-12-31"]
    rng = np.random.default_rng(3)
    held = pd.Series((rng.random(len(prices)) > 0.5).astype(int), index=prices.index)
    held = held.rolling(5).max().fillna(0).astype(int)
    rf = pd.Series(0.0002, index=prices.index)
    a = v2.simulate(held, prices, rf)
    b = v2.simulate_weights(held.astype(float), prices, rf)
    assert np.allclose(a["value"], b["value"], rtol=1e-10)
    assert np.allclose(a["fees"], b["fees"], rtol=1e-10, atol=1e-9)


def test_half_position_pays_costs_on_half_and_earns_interest_on_cash(synthetic_ohlcv):
    prices = synthetic_ohlcv.iloc[:3]
    held = pd.Series([0.5, 0.5, 0.5], index=prices.index)
    sim = v2.simulate_weights(held, prices, pd.Series(0.001, index=prices.index))
    o0 = prices["Open"].iloc[0]
    fill = o0 * 1.0005
    shares = 50_000 / (fill * 1.001)
    assert np.isclose(sim["fees"].iloc[0], shares * fill * 0.001)
    cash = 50_000 * 1.001**2
    assert np.isclose(sim["value"].iloc[2], cash + shares * prices["Close"].iloc[2])
