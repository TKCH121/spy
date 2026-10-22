"""One decision a week — the brief's literal reading ("predict the optimal action over
the next 5 trading days").

After the close on the last trading day of each week (normally Friday), the model's
prediction for the next 5 trading days becomes the week's action. The trade fills at the
next open (normally Monday) and the position is then held all week:
Buy -> invested, Sell -> cash, Hold -> keep last week's position.

Positions returned here are indexed by decision date, like src.backtest.to_positions and
src.v2.positions_from_er, so they go through src.v2.held_from_positions unchanged."""

import pandas as pd

from src import v2


def week_end_days(index: pd.DatetimeIndex) -> pd.DatetimeIndex:
    """Last trading day of each calendar week (Friday, or Thursday before a holiday)."""
    iso = index.isocalendar()
    last = pd.Series(index, index=index).groupby([iso["year"], iso["week"]]).max()
    return pd.DatetimeIndex(last.to_numpy())


def _hold_between_decisions(decided: pd.Series, index: pd.DatetimeIndex, start: int) -> pd.Series:
    """Spread week-end decisions over every day until the next decision."""
    return decided.reindex(index).ffill().fillna(start).astype(int)


def weekly_positions_from_actions(actions: pd.Series, start: int = 0) -> pd.Series:
    """v1-style actions (1 Buy, 0 Hold, -1 Sell), acted on at week ends only."""
    days = week_end_days(actions.index)
    pos, out = start, []
    for a in actions.loc[days].to_numpy():
        pos = 1 if a == 1 else (0 if a == -1 else pos)
        out.append(pos)
    return _hold_between_decisions(pd.Series(out, index=days), actions.index, start)


def weekly_positions_from_er(
    er: pd.Series, default: str, hurdle: float = v2.ROUND_TRIP
) -> pd.Series:
    """v2/v3 expected-return rule, applied to week-end values only."""
    days = week_end_days(er.index)
    start = 1 if default == "long" else 0
    return _hold_between_decisions(
        v2.positions_from_er(er.loc[days], default, hurdle), er.index, start
    )


def weekly_weights_from_risk(
    p_risk: pd.Series, half_at: float, zero_at: float, start: float = 1.0
) -> pd.Series:
    """Partial positions from a week-end risk probability: 100% below `half_at`, 50% from
    `half_at` to below `zero_at`, 0% at or above `zero_at`. Held until the next week end."""
    days = week_end_days(p_risk.index)
    p = p_risk.loc[days]
    w = pd.Series(1.0, index=days).where(p < half_at, 0.5).where(p < zero_at, 0.0)
    return w.reindex(p_risk.index).ffill().fillna(start)
