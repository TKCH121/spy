# v3 calibration report (design note §5.1)

Module 3 Group 7 · 2026-10-22 · notebook `notebooks/v3_01_calibration.ipynb` · design note SHA-256 `8149938b…`

Committed **before** any v3 trading result exists. The notebook computes probabilities and labels only: no expected return and no backtest.

## Result

**No candidate passes the pre-stated rule** of |mean P(Sell) − actual Sell share| ≤ 3 points in at least 8 of the 10 development years (2013–2022).

| | Treatment | Mean P(Sell) | Actual Sell share | Mean \|gap\|, points | Years within ±3 points | Passes | Log loss | Brier |
|---|---|---|---|---|---|---|---|---|
| C0 | v2 as is (balanced weights) | 30.3% | 20.7% | 10.4 | 1 / 10 | no | 1.039 | 0.623 |
| C1 | no class weights | 21.8% | 20.7% | 6.5 | 4 / 10 | no | **1.016** | **0.606** |
| C2 | prior correction | **21.5%** | 20.7% | **6.3** | 4 / 10 | no | 1.018 | 0.608 |
| C3 | sigmoid calibration | 24.4% | 20.7% | 8.5 | 3 / 10 | no | 1.028 | 0.618 |

Guessing ⅓ for every class scores a log loss of 1.099.

## What this shows

1. **The diagnosed bias is real, and C1/C2 remove it on average.** v2's probabilities overstated down weeks by about 10 points on average (C0). Without class weights, or with the exact prior correction, the 10-year average P(Sell) is within about 1 point of reality. Both also give better log loss and Brier scores than C0.
2. **What remains is year-to-year drift, not a fixed bias.** The actual share of Sell weeks moves a lot between years, and a model trained on the past can't anticipate that. C2's yearly gaps range from +11.7 points (2017, a calm year that the model expected to be rougher) to −15.0 points (2022, a bear market it under-predicted). The pass rule demanded per-year accuracy, and no treatment of the probabilities can deliver that.
3. **Fitted sigmoid calibration (C3) is worse than the simple fixes.** It leaves P(Sell) inflated on average (24.4%), and its reliability table is squeezed into a narrow 20–30% band: it mostly flattens the probabilities.
4. **The probabilities carry little information.** In C2's pooled reliability table, days the model rated 33% Sell turned out to be Sell weeks 25% of the time, and days it rated 16% turned out 18%. The ranking is only weakly informative. That is consistent with v2's finding that direction skill is small.

## Consequence under the design note

Design note §6 fixed the reading in advance: **"Calibration fails §5.1 → v3's premise didn't hold; trading results are reported but not interpreted as a test of calibration."**

The next steps (§5.2 onwards) can still run as planned, and all six candidates will be reported. But any v3 trading result must be described with this caveat. The pass rule is **not** changed after the fact. In hindsight, it tested two different things together: average bias, which C1/C2 fix, and regime drift, which nothing here can fix. That is a lesson for the write-up, not a reason to edit the criterion.

Figures: `outputs/v3/figures/sell_gap_by_year.png`, `outputs/v3/figures/reliability.png`.
