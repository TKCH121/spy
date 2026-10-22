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
