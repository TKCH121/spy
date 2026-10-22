# Weekly rebuild of v1, v2 and v3 — plan, fixed before any weekly rebuild was run

Module 3 Group 7 · written 2026-10-22 · committed before the rebuild notebooks exist.

## Why

The brief asks for a model that predicts *the optimal action (Buy, Sell or Hold) over the next 5 trading days*. v1–v3 were built, selected and tested with a decision **every trading day**. `notebooks/weekly_decisions.ipynb` then applied a weekly schedule to those already-frozen models. That is a sensitivity check, not a weekly design. This rebuild makes **weekly decisions part of each version's design**, so each version selects its trading choices on a weekly schedule.

## The weekly schedule (all versions)

After the close on the last trading day of each week (normally Friday), the model's prediction for the next 5 trading days becomes the week's action. The trade fills at the next open (normally Monday) and is held all week: **Buy** → invested, **Sell** → cash, **Hold** → keep last week's position. This is `src/weekly.py`.

**Training is unchanged:** models learn from every trading day's 5-day outcome, with the same labels, gaps (5 for close→close, 6 for open→open), splits, features, tuning and costs. Only decisions are restricted to week ends.

## What each version re-selects (and nothing else)

| Version | Kept exactly as originally designed | Re-selected on a weekly schedule, with the version's own pre-stated rule |
|---|---|---|
| **v1w** | Data, label (±1% close→close), features, candidates, tuning, **model selection by validation macro-F1** (schedule-independent, so the random forest E06 stays), refit on Train+Val, cash at 0% (as v1 was built) | **Signal rule:** margin ∈ {argmax, 0, 0.05, 0.10, 0.20}, chosen by the highest after-cost Sharpe on the 2021–22 weekly validation backtest; ties → fewer trades. v1's minimum-hold rule is replaced by the weekly hold. |
| **v2w** | Everything in `docs/v2_design_note.md`: open→open label, gap 6, log-loss tuning of LR/RF/HGB, expected-return rule, 0.30% hurdle, both default rules, T-bill cash | **Joint selection** of model × default on the 2021–22 **weekly** validation backtest, by after-cost Sharpe over T-bills; ties → fewer round trips. Then freeze, refit on Train+Val, test once. |
| **v3w** | Everything in `docs/v3_design_note.md`: treatments C0–C3, the calibration rule (§5.1), hurdle, defaults | **Base model** = v2w's frozen model and settings (not re-tuned). Calibration report re-run if that model differs from v2's. **Selection** among C1–C3 × {long, cash} on the 2013–2022 **weekly** walk-forward, by Sharpe over T-bills. Then freeze, and report 2023–24 and the 2025–26 holdout. |

## Reporting

- **Every candidate's validation (or development) result is reported, not just the pick.**
- Each version's frozen choice goes in `outputs/weekly/v1|v2|v3/frozen_config.json`, written before that version's test rows are scored.
- **Results:** final value, annual return, volatility, **max drawdown**, Sharpe, round trips, costs, time invested, and the random-timing percentile (1,000 paths, same exposure and switch count). Cash earns T-bills in the scorecard for every version; v1w also reports its as-built 0% figure.

## Honest disclosure

**This rebuild was decided after all daily results were known, including 2023–24 and the 2025–26 holdout.** Selection uses only training and validation (or development) data, so no test result can enter a choice directly. But the people choosing the schedule had seen the tests. The test and holdout results of the rebuild are therefore **"seen-period" results**. The only blind evidence remains the paper-trade window from 2026-10-13 (v3 design note, deviation of 2026-10-22).

## Deviations

_None yet. Add dated entries: what changed, why, and whether results had been seen._
