# v3 design note — calibrated probabilities, fixed before any v3 code or results

Module 3 Group 7 · written 2026-10-22 · committed, with its SHA-256 recorded, before any v3 code exists.

Once v3 results exist, this file must not be edited. Any change must be logged under **Deviations**, with its date, its reason, and whether results had been seen.

## 1. The question

v2 ([report](../outputs/v2/report.md)) diagnosed why its expected-return rule failed. Balanced class weights make the model act as if the three week types were equally common, which **inflates P(Sell)**. Down weeks are also the largest moves in size (μ_Sell ≈ −2.8% vs μ_Buy ≈ +2.2%), so E[r] fell below the −0.30% hurdle too often. Even the default-long strategy was in cash 47% of the time.

**v3 asks one narrow question:** if the probabilities are corrected back to real-world odds, does the same expected-return rule time the market better than chance?

**Prediction, stated in advance:** calibration should cut the time spent in cash and move results **closer to Buy & Hold, not above it**. The model's direction skill is small (v2 test macro-F1 0.376 vs 0.317 for guessing), and calibration cannot create skill. A result above Buy & Hold would be a surprise, and would be treated with suspicion, not celebrated.

## 2. What has already been seen (honest disclosure)

Every period of SPY history up to 2026-10-12 has been looked at by someone on this project:

| Period | What is already known | Consequence for v3 |
|---|---|---|
| 2010–2022 | Used for v1/v2 training and validation; v2's yearly walk-forward results for 2013–2022 are published | Development data only; v3 results here are **not** evidence |
| 2023–2024 | v1 and v2 test results, both opened | **Secondary**, reported but not used for any claim |
| 2025-01-02 → 2026-10-12 | v1's follow-up research reported results for 9 other strategies here, incl. S2 (RF, default-long, min-hold 5): +32.1% vs +34.8% for Buy & Hold. The group, and the AI assistant that helped write this note, also know the broad market events of 2025 (e.g. the April 2025 crash and rebound). | **Primary holdout**, but *not blind*: reported with this caveat |
| From 2026-10-23 on | Nothing: these prices do not exist yet | **The only truly blind test**: the prospective paper-trade in §6 |

v3 was designed after seeing v2's test and walk-forward results. Its one change (calibration) is motivated by a diagnosis made on those results. That is why §5 never uses 2013–2024 as evidence.

## 3. Unchanged from v2

Everything not listed in §4 is frozen as in `outputs/v2/frozen_config.json`:
- Data and features: the 15 features and the SPY snapshot.
- The label: open(t+1) → open(t+6), at ±1%, with a gap of 6.
- The model: gradient boosting (HGB) with v2's frozen hyper-parameters. They are **not re-tuned**.
- The rule: the expected-return score E[r] = Σ P_k·μ_k, with μ_k re-estimated on each fit's training rows, and the 0.30% hurdle.
- The default-long / default-cash rules, and costs of 0.10% fee + 0.05% slippage per side.
- Cash earns the lagged 13-week T-bill rate.
- Yearly refits each January on all earlier rows whose labels are known.

## 4. The candidates (fixed here; no others will be tried)

Three probability treatments × two default rules = **six candidates**, plus two references.

| ID | Probabilities fed into E[r] | Default |
|---|---|---|
| **C0-L / C0-C** | v2 as is: balanced class weights, raw probabilities (*reference*) | long / cash |
| **C1-L / C1-C** | **No class weights.** Same HGB hyper-parameters, `class_weight=None` | long / cash |
| **C2-L / C2-C** | **Prior correction.** Balanced weights, then each class probability is multiplied by that class's share of the fit's training rows (π_k) and renormalised: p_k ∝ p̃_k · π_k. This exactly undoes the balanced re-weighting and needs no extra data. | long / cash |
| **C3-L / C3-C** | **Fitted calibration.** Balanced weights, then `CalibratedClassifierCV(method="sigmoid", cv=TimeSeriesSplit(n_splits=5, gap=6))` within each yearly training window | long / cash |
| *S0* | Buy & Hold (*reference*) | — |

C0 is included only to measure the change against v2. It cannot be picked.

## 5. Test plan

### 5.1 Calibration checks (per yearly fit, reported for all candidates)

On each walk-forward year:
- log loss;
- multi-class Brier score;
- **average predicted P(Sell) vs the actual share of Sell weeks**, the direct check of the diagnosed problem;
- a reliability table: 10 probability bins for P(Sell) and for P(Buy).

**Calibration success** means the average predicted P(Sell) is within ±3 percentage points of the actual Sell share in at least 8 of 10 development years. This is checked **before** any trading result is looked at, and reported regardless of outcome.

### 5.2 Development: walk-forward 2013–2022 (selection only)

For each of C1–C3 × {L, C}, run the yearly walk-forward and backtest 2013–2022 continuously.

**Selection rule:** among the six candidates, pick the one with the highest Sharpe ratio over T-bills. Break ties by fewer round trips. The pick is made even if none beats Buy & Hold. That is reported, and the pick still goes forward.

Everything is reported for every candidate, including C0: the dollar path of $100,000, time in the market, round trips and fees.

### 5.3 Freeze

Write `outputs/v3/frozen_config.json` and commit it **before** any 2023+ row is scored.

### 5.4 Secondary: 2023–2024 (already seen)

Report the frozen pick with yearly refits. **No claim** is made from this period.

### 5.5 Primary holdout: 2025-01-02 → 2026-10-12 (seen by others, see §2)

The frozen pick, with yearly refits (training data ends at 2024-12-31, minus a gap of 6, and again for 2026). The data is `data/holdout/spy_20261013.csv` plus a new `^IRX` snapshot that covers 2025–2026; both are snapshotted before scoring.

Report, for $100,000:
1. the final value vs Buy & Hold;
2. the percentile among **1,000 random-timing paths** with the same exposure and number of switches;
3. a block-bootstrap 95% CI (block 20, 2,000 draws) for Sharpe minus Buy & Hold's Sharpe;
4. the attribution of every cash spell.

**Success criterion, stated now:** the pick beats **at least 95%** of random-timing paths on the holdout. Beating Buy & Hold's return is **not** required, and not expected. Because the holdout is not blind (§2), even a success is described as "consistent with skill", not "proof".

### 5.6 Prospective paper-trade (the only blind test)

From the first trading day after the freeze, the frozen pick's signal is computed each evening from fresh data, and appended to `outputs/v3/paper_trades.csv` with a timestamp **before** the next open, committed daily or weekly. It is evaluated at a date set now: **[evaluation date — group to fix before freezing]**. It is evaluated with the same metrics as §5.5. With only weeks or months of data this will be **inconclusive**, and it will be reported as such. Its value is that nobody can have seen the answer in advance.

## 6. What would change our minds

| Outcome | How we will describe it |
|---|---|
| Calibration fails §5.1 | v3's premise didn't hold; trading results are reported but not interpreted as a test of calibration |
| Calibration works, holdout percentile < 95% | Calibration fixed the odds but the model still has no usable timing skill. **This is the expected outcome.** |
| Calibration works, percentile ≥ 95% | Consistent with a small timing skill on a non-blind holdout; needs the prospective test before any stronger claim |
| Pick beats Buy & Hold's return on the holdout | Reported as such, with the bootstrap CI. Not a recommendation to trade. |

## 7. Work items

1. `src/v3.py`: prior correction (C2) and a sigmoid-calibration wrapper (C3), with tests:
   - the prior correction is exact for a known re-weighting;
   - calibration folds respect the gap of 6;
   - nothing in a fit reads rows after its training window.
2. A calibration report (§5.1) for all candidates, committed before §5.2 is run.
3. `notebooks/v3_walk_forward.ipynb`: development (§5.2), freeze (§5.3), secondary (§5.4).
4. A `^IRX` snapshot for 2025–2026, then the holdout (§5.5) in a separate notebook, run once.
5. The paper-trade script (§5.6) and its log.
6. `outputs/v3/report.md` and deck updates.

## Deviations

_Add dated entries here: what changed, why, and whether results had been seen. The SHA-256 in `docs/v3_design_note.sha256` is that of the original note (commit `3428d83`); entries below are the only changes since._

- **2026-10-22 — The blind paper-trade window (§5.6) starts on 2026-10-13, not at the freeze date.**
  - **What changes:** §5.6's start moves to 2026-10-13, the first trading day after the last data any part of this project has analysed (the holdout snapshot ends 2026-10-12). Once the configuration is frozen, signals for 2026-10-13 up to the freeze date are computed retrospectively. Each day's signal still uses only data up to that day's close, and the trade still fills at the next open.
  - **What stays the same:** after the freeze, signals are logged each evening as planned. The 2025-01-02 → 2026-10-12 period remains the **primary holdout** (§5.5).
  - **Why:** to add the few unseen trading days that already exist to the only blind test.
  - **What had been seen:**
    - §5.1 calibration results existed (`outputs/v3/calibration_report.md`). They use 2013–2022 probabilities only.
    - No trading result for any v3 candidate existed.
    - No SPY or T-bill price after 2026-10-12 had been downloaded or analysed by the project.
    - Group members may have followed general market news since 2026-10-13. Anyone who did must say so in the write-up.
  - **Limits:** 2026-10-13 → 2026-10-21 is about 7 trading days, of which only about one has a known 5-day outcome. These days are part of the blind window, not a test on their own.
  - **Condition:** nobody on the project analyses SPY data after 2026-10-12 before the freeze.
