"""vectorbt backtest of model signals vs SPY Buy & Hold.

Rules (long/cash):
  Buy  -> be fully invested in SPY
  Sell -> move to cash
  Hold -> keep whatever position we already have (avoids paying fees for indecision)

The signal is made at close t and the order fills at the *open of t+1*. The portfolio is
marked at daily (dividend-adjusted) opens. Every trade pays FEE on the traded value.
"""

import pandas as pd
import vectorbt as vbt

from spysignal.config import FEE


def signals_to_position(signals: pd.Series) -> pd.Series:
    """Target exposure decided at close t: 1 (long) or 0 (cash)."""
    pos = signals.map({1: 1.0, -1: 0.0, 0: float("nan")})
    return pos.ffill().fillna(0.0).rename("position")


def run(signals: pd.Series, open_px: pd.Series, fee: float = FEE) -> vbt.Portfolio:
    """Backtest signals (indexed by decision date) on adjusted opens."""
    open_px = open_px.loc[signals.index[0]:]
    target = signals_to_position(signals).reindex(open_px.index).ffill().fillna(0.0)
    executed = target.shift(1).fillna(0.0)          # decided at close t, filled at open t+1
    changed = executed.ne(executed.shift(1).fillna(0.0))
    size = executed.where(changed)                  # only trade when the target changes
    return vbt.Portfolio.from_orders(
        close=open_px, size=size, size_type="targetpercent", fees=fee, freq="1D", init_cash=10_000
    )


def buy_and_hold(open_px: pd.Series, fee: float = FEE) -> vbt.Portfolio:
    return vbt.Portfolio.from_holding(open_px, fees=fee, freq="1D", init_cash=10_000)


def summary(pf: vbt.Portfolio) -> pd.Series:
    """Headline numbers. Annualised with 252 trading days."""
    rets = pf.returns()
    years = len(rets) / 252
    value = pf.value()
    return pd.Series(
        {
            "total_return": value.iloc[-1] / value.iloc[0] - 1,
            "cagr": (value.iloc[-1] / value.iloc[0]) ** (1 / years) - 1,
            "ann_vol": rets.std() * 252 ** 0.5,
            "sharpe": rets.mean() / rets.std() * 252 ** 0.5,
            "max_drawdown": pf.max_drawdown(),
            "orders": int(pf.orders.count()),
            "fees_paid": float(pf.orders.records_readable["Fees"].sum()),
            "time_in_market": float((pf.asset_value() > 0).mean()),
        }
    )
