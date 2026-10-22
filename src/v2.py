"""v2 strategy (docs/v2_design_note.md): expected-return rule, default-long / default-cash
position rules, a backtest in which cash earns the T-bill rate, and the evidence checks
(random-timing benchmark, block bootstrap).

Positions are decided after the close of day t and held from the OPEN of t+1, as in v1.
The simulator reproduces vectorbt's all-in / all-out fills (cross-checked in
tests/test_v2_strategy.py with zero interest) and adds overnight interest on cash."""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score

from src import config

ROUND_TRIP = 2 * (config.FEES + config.SLIPPAGE)  # C3: 0.30%
DEFAULTS = ("long", "cash")


# --- C2: expected-return score ------------------------------------------------------


def class_means(y: pd.Series, r_fwd: pd.Series) -> dict:
    """Mean forward return of each class, from the training rows of one fit only."""
    return r_fwd.groupby(y.astype(int)).mean().reindex(config.CLASSES).to_dict()


def expected_return(proba: pd.DataFrame, mu: dict) -> pd.Series:
    """E[r] = sum_k P_k * mu_k. proba columns are the classes [-1, 0, 1]."""
    return sum(proba[k] * mu[k] for k in config.CLASSES)


# --- C4: position rules -------------------------------------------------------------


def positions_from_er(er: pd.Series, default: str, hurdle: float = ROUND_TRIP) -> pd.Series:
    """Position (1 invested / 0 cash) decided at the close of each day.

    default-long: start invested; exit when E[r] < -hurdle; re-enter when E[r] >= 0.
    default-cash: start in cash; enter when E[r] > hurdle; exit when E[r] <= 0."""
    if default not in DEFAULTS:
        raise ValueError(default)
    pos, out = (1 if default == "long" else 0), []
    for e in er.to_numpy():
        if default == "long":
            pos = 0 if (pos == 1 and e < -hurdle) else (1 if (pos == 0 and e >= 0) else pos)
        else:
            pos = 1 if (pos == 0 and e > hurdle) else (0 if (pos == 1 and e <= 0) else pos)
        out.append(pos)
    return pd.Series(out, index=er.index, dtype=int)


# --- C7: T-bill cash rate ---------------------------------------------------------------


def download_tbill_snapshot() -> Path:
    """Save the 13-week T-bill yield (yfinance ^IRX, percent p.a.) as a dated snapshot."""
    import yfinance as yf

    df = yf.download("^IRX", start=config.START, end=config.END, auto_adjust=False,
                     progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    path = config.RAW_DIR / f"irx_{pd.Timestamp.today():%Y%m%d}.csv"
    df[["Close"]].rename(columns={"Close": "IRX"}).rename_axis("Date").to_csv(path)
    return path


def load_tbill_daily(calendar: pd.DatetimeIndex, path=None) -> pd.Series:
    """Daily cash return on the SPY calendar: IRX(t-1) / 100 / 252 (known before day t)."""
    path = path or sorted(config.RAW_DIR.glob("irx_*.csv"))[-1]
    irx = pd.read_csv(path, index_col=0, parse_dates=True)["IRX"]
    return (irx.reindex(calendar.union(irx.index)).ffill().reindex(calendar)
            .shift(1).fillna(0.0) / 100 / 252)


# --- backtest ---------------------------------------------------------------------------


def simulate(held: pd.Series, prices: pd.DataFrame, rf_daily=None, fees=config.FEES,
             slippage=config.SLIPPAGE, init_cash=config.INIT_CASH) -> pd.DataFrame:
    """All-in / all-out backtest. held[d] = 1 if invested during day d (switches fill at
    Open(d)). Cash earns rf_daily overnight. Returns value, cash return and fees by day."""
    prices = prices.loc[held.index]
    rf = np.zeros(len(held)) if rf_daily is None else rf_daily.reindex(held.index).to_numpy()
    o, c, h = prices["Open"].to_numpy(), prices["Close"].to_numpy(), held.to_numpy()
    cash, shares, prev, values, fee_s = float(init_cash), 0.0, 0, [], []
    for i in range(len(h)):
        fee = 0.0
        if i > 0 and shares == 0:
            cash *= 1 + rf[i]
        if h[i] == 1 and prev == 0:
            fill = o[i] * (1 + slippage)
            shares = cash / (fill * (1 + fees))
            fee, cash = shares * fill * fees, 0.0
        elif h[i] == 0 and prev == 1:
            gross = shares * o[i] * (1 - slippage)
            fee, cash, shares = gross * fees, gross * (1 - fees), 0.0
        prev = h[i]
        values.append(cash + shares * c[i])
        fee_s.append(fee)
    return pd.DataFrame({"value": values, "fees": fee_s}, index=held.index)


def held_from_positions(pos: pd.Series, start: int = 0) -> pd.Series:
    """Decision at close t -> held during day t+1. `start` is the position on the first
    day (1 for default-long, whose rule starts invested; 0 otherwise)."""
    return pos.shift(1).fillna(start).astype(int)


def summarize(sim: pd.DataFrame, held: pd.Series, rf_daily=None, name: str = "",
              init_cash=config.INIT_CASH) -> dict:
    v = sim["value"]
    r = pd.concat([pd.Series([init_cash]), pd.Series(v.to_numpy())]).pct_change().dropna()
    rf = pd.Series(0.0 if rf_daily is None else rf_daily.reindex(v.index).to_numpy())
    ex = r.to_numpy() - rf.to_numpy()
    years = len(r) / 252
    total = v.iloc[-1] / init_cash - 1
    return {
        "strategy": name,
        "final_value": round(float(v.iloc[-1]), 2),
        "total_return": round(float(total), 4),
        "cagr": round(float((1 + total) ** (1 / years) - 1), 4),
        "ann_vol": round(float(r.std() * np.sqrt(252)), 4),
        "sharpe_excess": round(float(ex.mean() / ex.std() * np.sqrt(252)), 3) if ex.std() > 0 else 0.0,
        "max_drawdown": round(float((v / v.cummax() - 1).min()), 4),
        "round_trips": int(((held == 1) & (held.shift(1, fill_value=0) == 0)).sum()),
        "exposure": round(float(held.mean()), 3),
        "total_fees": round(float(sim["fees"].sum()), 2),
    }


def buy_and_hold_held(index: pd.Index) -> pd.Series:
    """Benchmark: invested from the first open."""
    return pd.Series(1, index=index, dtype=int)


# --- evidence: random timing, bootstrap, attribution ---------------------------------------


def spells(held: pd.Series) -> list:
    """Run-length encoding: [(state, length), ...]."""
    h = held.to_numpy()
    edges = np.flatnonzero(np.diff(h)) + 1
    starts = np.r_[0, edges]
    ends = np.r_[edges, len(h)]
    return [(int(h[s]), int(e - s)) for s, e in zip(starts, ends)]


def random_timing_paths(held: pd.Series, n: int = 1000, seed: int = config.SEED):
    """Random position paths with the strategy's exact exposure and number of switches:
    the invested-spell lengths and the cash-spell lengths are each shuffled, and the
    alternating order and starting state are kept."""
    rng = np.random.default_rng(seed)
    sp = spells(held)
    ins = [l for s, l in sp if s == 1]
    outs = [l for s, l in sp if s == 0]
    for _ in range(n):
        a, b = list(rng.permutation(ins)), list(rng.permutation(outs))
        seq = []
        for s, _l in sp:
            seq += [s] * (a.pop() if s == 1 else b.pop())
        yield pd.Series(seq, index=held.index, dtype=int)


def random_timing_benchmark(held, prices, rf_daily=None, n: int = 1000) -> pd.Series:
    """Final values of n random-timing paths under the same costs and cash rate."""
    return pd.Series([simulate(p, prices, rf_daily)["value"].iloc[-1]
                      for p in random_timing_paths(held, n)])


def _block_indices(n: int, block: int, rng) -> np.ndarray:
    starts = rng.integers(0, n, size=int(np.ceil(n / block)))
    return (starts[:, None] + np.arange(block)).ravel()[:n] % n


def bootstrap_sharpe_diff(r_a: pd.Series, r_b: pd.Series, rf=None, block: int = 20,
                          n: int = 2000, seed: int = config.SEED) -> np.ndarray:
    """Circular block bootstrap of Sharpe(a) - Sharpe(b) on paired daily excess returns."""
    rng = np.random.default_rng(seed)
    rf = np.zeros(len(r_a)) if rf is None else np.asarray(rf)
    a, b = np.asarray(r_a) - rf, np.asarray(r_b) - rf
    out = []
    for _ in range(n):
        i = _block_indices(len(a), block, rng)
        sa, sb = a[i].std(), b[i].std()
        out.append((a[i].mean() / sa if sa > 0 else 0) * np.sqrt(252)
                   - (b[i].mean() / sb if sb > 0 else 0) * np.sqrt(252))
    return np.array(out)


def bootstrap_f1_diff(y, p_model, p_base, block: int = 20, n: int = 2000,
                      seed: int = config.SEED) -> np.ndarray:
    """Circular block bootstrap of macro-F1(model) - macro-F1(baseline)."""
    rng = np.random.default_rng(seed)
    y, pm, pb = map(np.asarray, (y, p_model, p_base))
    out = []
    for _ in range(n):
        i = _block_indices(len(y), block, rng)
        f = lambda p: f1_score(y[i], p[i], labels=config.CLASSES, average="macro", zero_division=0)
        out.append(f(pm) - f(pb))
    return np.array(out)


def out_of_market_attribution(held: pd.Series, prices: pd.DataFrame) -> pd.DataFrame:
    """Each cash spell: dates and SPY's open-to-open move while the strategy was out
    (positive = the exit cost money, negative = it saved money)."""
    rows, i = [], 0
    o = prices.loc[held.index, "Open"]
    for s, l in spells(held):
        if s == 0 and i > 0:
            end = min(i + l, len(held) - 1)
            rows.append({"out_from": held.index[i].date(), "back_in": held.index[end].date(),
                         "days": l, "spy_move": round(float(o.iloc[end] / o.iloc[i] - 1), 4)})
        i += l
    return pd.DataFrame(rows)
