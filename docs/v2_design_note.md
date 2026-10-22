# v2 design note — fixed before any v2 code or results

Module 3 Group 7 · written 2026-10-22 · committed before any v2 code, model run or backtest exists.

This note fixes v2's design so that v2 can be judged honestly. Changes after the first v2 result must be listed under **Deviations** (end of this file), with the reason.

## 1. Why v2 exists

v1 (tag `v1`, by Peter Li) is a sound, leakage-free pipeline, and its test result (2023–2024) was +23.7% vs +56.5% for Buy & Hold. A review of v1 found that the shortfall comes partly from a **design flaw rather than bad luck**:

- The classifier's only real skill is spotting **Hold** weeks (test Hold recall 0.62). It cannot separate Buy from Sell.
- The trading rule used only P(Buy) − P(Sell) and **ignored P(Hold)**. So the skill never reached a trade.
- The model was selected on macro-F1 and the rule on validation Sharpe. The best classifier (E06) was not the best trader on validation (Sharpe −0.055 vs +0.19 for E05).
- The strategy defaulted to cash, so its gap to Buy & Hold mixes **lower exposure** (58% invested) with **timing**, and can't be attributed to either.

## 2. Disclosure: what was known when this was written

v2 was designed after reading v1's full results, **including its 2023–2024 test results**. Every v2 change below is justified by v1's training or validation evidence, or by methodology alone. The one choice that test knowledge could bias, staying invested by default, is **not hard-coded**: validation chooses it (§4). The 2023–2024 test is therefore a "second look" and is reported as such. The 2013–2024 walk-forward (§6) gives evidence over a wider range of market regimes.

## 3. Unchanged from v1

Data snapshot `data/raw/spy_20261010.csv`. The 15 features in `src/features.py`. Classes at ±1% over 5 trading days. Train 2010–2020 / Validation 2021–2022 / Test 2023–2024, with 5-row gaps. `TimeSeriesSplit(n_splits=5, gap=5)`. Imbalance handled with `class_weight="balanced"`. Costs of 0.10% fee + 0.05% slippage per side. Fill at the next open. Long-only, no leverage.

## 4. What changes

| # | Change | Exact definition |
|---|---|---|
| C1 | **Primary label** | Open(t+1) → Open(t+6) return (`label_kind="open"`), classed at ±1%. Close→close is kept as a sensitivity check. |
| C2 | **Expected-return score** | E[r](t) = Σ_k P_k(t)·μ_k, for k ∈ {Sell, Hold, Buy}. μ_k is the mean forward return of class k, computed **on the training rows of the same fit only**. |
| C3 | **Cost hurdle** | c = round-trip cost = 2 × (0.10% + 0.05%) = 0.30%. |
| C4 | **Two candidate defaults** | **Default-long:** start invested. Exit when E[r] < −c. Re-enter when E[r] ≥ 0. **Default-cash:** start in cash. Enter when E[r] > c. Exit when E[r] ≤ 0. No minimum-hold rule. |
| C5 | **Hyper-parameter tuning** | CV objective changes from macro-F1 to **log loss**, because the rule consumes probabilities. Macro-F1 is still reported. |
| C6 | **Joint selection** | Candidates = {LR, RF, HGB} × {default-long, default-cash}. Pick the highest **validation after-cost Sharpe** (cash earning the T-bill rate). Break ties by fewer trades. If no candidate beats Buy & Hold's validation Sharpe, report that and still carry the pick forward. |
| C7 | **Cash yield** | Cash earns the 13-week T-bill rate (yfinance `^IRX`), lagged by one day: daily rate = IRX(t−1) / 100 / 252. Sharpe is computed on excess returns over the same rate. The Buy & Hold benchmark is unchanged. |

## 5. Primary strategy (one sentence, used in all write-ups)

> After each close, the frozen model's three class probabilities are turned into an expected 5-day return. The portfolio is either 100% SPY or 100% cash (earning T-bills), and switches at the next open only when that expected return crosses the thresholds of the chosen default (C4), after 0.15% costs per side.

## 6. How performance will be judged

1. **Test 2023–2024, once**, after freezing. Report: classification metrics, return, Sharpe, max drawdown, trades, exposure.
2. **Walk-forward 2013–2024:** yearly refits on all earlier data whose labels are known (training ends more than 5 days before each predicted year). Report per-year and total figures for the frozen configuration. This is reporting only, never used for selection.
3. **Block bootstrap** (circular, block = 20 trading days, 2,000 resamples): 95% CIs for (a) model macro-F1 minus the best baseline's, and (b) strategy Sharpe minus Buy & Hold's.
4. **Random-timing benchmark:** 1,000 random position paths with the **same exposure and the same number of switches** as the strategy, under the same costs. Report the strategy's percentile.
5. **Exit attribution** (default-long) or **entry attribution** (default-cash): for each out-of-market spell, SPY's return over the spell minus costs. The sum explains the gap to Buy & Hold.
6. All candidates are reported, not just the pick.

**What counts as "works":** the strategy ranks above the 95th percentile of random timing on the test period **and** the walk-forward. Beating Buy & Hold's return is not required, and is not expected.

## 7. Reproducibility

Same environment as v1 (`requirements.txt`). Seeds fixed through `config.SEED`. The `^IRX` series is saved as a snapshot under `data/raw/` before any v2 backtest runs.

## Deviations

_Add dated entries here: what changed, why, and whether results had been seen._

- **2026-10-22 — C1 clarified: the open label needs a gap of 6.** The label for day t reads Open(t+6), one bar further ahead than close→close. With v1's gap of 5, the last label in each segment and CV fold reads the first open of the next one. All v2 splits therefore use `config.V2_GAP` (6), for both segments and `TimeSeriesSplit`. This also means v1's E13 (open→open, run with gap 5) had a one-bar overlap at each boundary. v1 is frozen and is left as is. No v2 results existed when this was written.
