# Summary — lessons learned across v1, v2 and v3

Module 3 Group 7 · 2026-10-22. Detailed reports: [v1](report.md) · [v2](v2/report.md) · [v3](v3/report.md), plus v3's [calibration](v3/calibration_report.md) and [development](v3/development_report.md) reports.

## The question and the answer

Can a classifier that predicts the best action for SPY over the next 5 trading days, Buy (> +1%), Sell (< −1%) or Hold, beat buying and holding when we trade on its predictions? Every version acts on a fresh prediction each day. A weekly schedule (one decision each Friday, as the brief literally reads) is checked at the end.

**No.** Three versions, each tested without look-ahead and with realistic costs, all failed to time the market. The model is a genuine, if weak, classifier, but its skill is in the **size** of next week's move, not the **direction**.

| $100,000, test 2023–2024, after costs | Final value | vs Buy & Hold |
|---|---|---|
| Buy & Hold SPY | **$156,546** | — |
| v1 · random forest, Buy/Sell rule | $123,714 | −$32,832 |
| v2 · gradient boosting, expected-return rule | $121,812 | −$34,734 |
| v3 · v2 with calibrated odds | $156,546 | $0 (its rule never sold) |

## v1: a sound pipeline whose trading rule ignored its own skill

- **The classifier is better than guessing, honestly measured.** Test macro-F1 was 0.408, against 0.305 for the best naive baseline. Validation scored 0.404, and accuracy 44.9% sits in the brief's normal range. Both are consistent with no leakage.
- **The skill is recognising quiet weeks.** It caught 62% of Hold weeks. It confused Buy and Sell almost at random: 39 of 92 real Sell weeks were called Buy.
- **Why it lost $32,832 to Buy & Hold:**
  - It sat in cash 42% of the time, and SPY rose just as much on those days as on invested days.
  - One four-month pause (December 2023 → April 2024) missed a rise of about 14%.
  - Costs were $3,237, but even with zero fees it still trailed.
- **The design flaw found in review:** the trading rule used only P(Buy) − P(Sell) and ignored P(Hold), the one thing the model could do.

## v2: using all three probabilities wasn't enough

- **What changed:**
  - An expected-return rule built from all three probabilities, trading only when the expected gain beats the 0.30% round-trip cost.
  - An execution-aligned label.
  - The model and rule chosen together by money made on validation.
  - Cash earning T-bills.
- **Result:** $121,812. It beat only **26% of 1,000 random traders** with the same time in the market. Over a 12-year walk-forward (2013–2024) it made $179,977, against $499,271 for Buy & Hold, and was ahead in 2 of 12 years.
- **Why:** the class weights used to handle imbalance (as the brief requires) make the model act as if all three classes were equally common. That is good for predictions, but it inflates P(Sell): 30% predicted vs 21% actual. The rule took those odds at face value, so it kept stepping out.
- **Side finding:** the open→open label looks one day further ahead, so it needs a 6-day gap, not 5. v1's E13 experiment had this one-day overlap. It is documented, not fixed, because v1 is frozen.

## v3: once the odds are honest, the best rule is not to trade

- **The plan was fixed and fingerprinted (SHA-256) before any code.** It specified three ways to correct the odds × two default positions, and a calibration test to pass before any trading result.
- **Calibration:** the average odds were fixed (P(Sell) 30.3% → 21.5%, vs 20.7% actual). Year-to-year swings were not, so the pre-set test failed (4 of 10 years within ±3 points; 8 needed). We kept the bar and reported the failure.
- **Trading:** the pre-set selection rule picked a version that **never sold**: not in 2013–2022, not in 2023–24, not on the 2025–26 holdout ($134,410, identical to Buy & Hold). Every version that did trade lost money relative to holding.
- **Accuracy vs macro-F1:** v3's accuracy is the highest of any version (48–50%), but its macro-F1 is the lowest (0.35–0.37). Calibrated odds call the common Hold weeks more often. Accuracy alone would have told the wrong story.

## One decision a week instead of every day ([report](weekly/report.md))

The brief's literal reading: after Friday's close, predict Buy / Hold / Sell for the next 5 trading days, trade at Monday's open, and hold all week. We re-ran every version on that schedule with the same frozen models. This was decided after the test results were known, so it is a sensitivity check, not a selection.

| $100,000, 2023–24 | Daily | Weekly | Buy & Hold |
|---|---|---|---|
| v1 | $123,714 (15 round trips) | $124,654 (6) | $156,546 |
| v2 | $121,812 (17) | $123,834 (9) | $156,546 |
| v3 | $156,546 (never trades) | $156,546 (never trades) | $156,546 |

- **Weekly halves the trades and costs, but the gap to Buy & Hold stays about $32,000.**
- **Timing against random traders gets slightly worse on the weekly schedule.** Over 2013–24, weekly v2 made $167,581 vs $179,977 daily.
- **The weakness is what the model predicts, not how often it acts.**

## Why predicting markets is hard (what this project showed)

1. **Size is predictable; direction isn't.** Big-move weeks cluster (volatility clustering), so the model can see them coming. Which way they go is close to a coin flip.
2. **Sitting in cash has a cost.** SPY drifted upward through every test period. Without timing skill, each day out loses expected return, and many of the best days follow the worst.
3. **The past changes.** The share of Sell weeks swung from about 5% (2017) to about 41% (2022). A feature that helped in 2010–2020 (price vs its 200-day average) misled the model in 2022.
4. **Good predictions ≠ good trades.** The best classifier was not the best trader. A standard imbalance fix improved the prediction score while distorting the odds a trading rule needs.
5. **A flaw of machine learning, or of the question?** Mostly the question: next week's direction, for the most-watched fund in the world, from its own public price history. Machine learning helps more with ranking many assets, forecasting risk, or using data others don't have. Even there, edges are usually small after costs.

## How we know these results are honest

- **No look-ahead:** 50 automated tests, run in CI. For example, cutting or shocking future data must not change any feature or prediction.
- **Time-ordered splits** with label-length gaps, and tuning with `TimeSeriesSplit` using the same gap.
- **Selection rules written before results;** each test period opened once, after freezing; every later change logged with its date.
- **More than one number:** bootstrap confidence intervals, a random-timing benchmark with matched exposure, and a 12-year walk-forward.

## Limits

- **One asset**, price and volume features only, a weekly horizon, all in or all out.
- **The 2025–26 holdout is not blind:** v1's follow-up research reported results there, and 2025's broad events are known.
- **v3's blind paper-trade** (from 13 Oct 2026) is still running; the group needs to fix its evaluation date.
- **Results use committed price snapshots;** a refreshed download can differ slightly.
