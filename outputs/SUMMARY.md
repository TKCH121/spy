# Summary — lessons learned across v1, v2 and v3

Module 3 Group 7 · 2026-10-22. Detailed reports: [v1](report.md) · [v2](v2/report.md) · [v3](v3/report.md), plus v3's [calibration](v3/calibration_report.md) and [development](v3/development_report.md) reports.

## The question and the answer

Can a classifier that predicts the best action for SPY over the next 5 trading days, Buy (> +1%), Sell (< −1%) or Hold, beat buying and holding when we trade on its predictions? Every version acts on a fresh prediction each day. A weekly schedule (one decision each Friday, as the brief literally reads) is checked at the end.

**No.** Three versions, each tested without look-ahead and with realistic costs, all failed to time the market. The model is a genuine, if weak, classifier, but its skill is in the **size** of next week's move, not the **direction**.

### Scorecard: return and risk, on one basis ([notebook](../notebooks/scorecard.ipynb))

$100,000, after costs (0.10% fee + 0.05% slippage per side). **Cash earns the T-bill rate for every version**, and Sharpe is measured over T-bills. v1 as built let cash earn 0% (it reported $123,714); adding interest on cash is one of our improvements, so v1 is re-scored here on the same basis.

**Test 2023–2024**

| Strategy (decides daily / weekly) | Final value | Annual return | Volatility | Max drawdown | Sharpe | Round trips | Costs | Time invested |
|---|---|---|---|---|---|---|---|---|
| **Buy & Hold** | **$156,546** | **25.2%** | 12.8% | −10.0% | **1.43** | 1 | $100 | 100% |
| v1 · random forest | $129,069 / $129,705 | 13.7% / 14.0% | 9.8% / 10.2% | −9.4% / −8.7% | 0.85 / 0.84 | 15 / 6 | $3,317 / $1,256 | 58% / 61% |
| v2 · gradient boosting | $121,812 / $123,834 | 10.4% / 11.3% | 9.0% / 9.0% | −10.0% / −9.9% | 0.59 / 0.69 | 17 / 9 | $3,754 / $1,988 | 53% / 52% |
| v3 · calibrated odds | $156,546 (never trades) | 25.2% | 12.8% | −10.0% | 1.43 | 1 | $100 | 100% |

**Walk-forward 2013–2024** (yearly refits) **and holdout 2025-01 → 2026-10** (v3 only; v1 and v2 were not run there)

| Strategy | Final value | Annual return | Volatility | Max drawdown | Sharpe |
|---|---|---|---|---|---|
| Buy & Hold, 2013–24 | **$499,271** | **14.4%** | 16.7% | −33.7% | **0.80** |
| v2 daily / weekly, 2013–24 | $179,977 / $167,581 | 5.0% / 4.4% | 11.6% / 12.5% | **−22.4%** / −30.6% | 0.35 / 0.29 |
| v3, 2013–24 | $499,271 (never trades) | 14.4% | 16.7% | −33.7% | 0.80 |
| Buy & Hold = v3, 2025–26 holdout | $134,410 | 18.2% | 16.9% | −18.8% | 0.84 |

**Reading the risk side:**
- The models were calmer: lower volatility, because they spent 40–50% of the time in cash. But on 2023–24 their **worst fall was no smaller** than Buy & Hold's, about −9% to −10% for every strategy.
- Over 12 years, v2 (daily) did cut the worst fall from −34% to −22%, but at a much lower Sharpe (0.35 vs 0.80). It gave up far more return than it saved in risk.
- No version beat Buy & Hold on return, Sharpe or Calmar in any period.

## v1: a sound pipeline whose trading rule ignored its own skill

- **The classifier is better than guessing, honestly measured.** Test macro-F1 was 0.408, against 0.305 for the best naive baseline. Validation scored 0.404, and accuracy 44.9% sits in the brief's normal range. Both are consistent with no leakage.
- **The skill is recognising quiet weeks.** It caught 62% of Hold weeks. It confused Buy and Sell almost at random: 39 of 92 real Sell weeks were called Buy.
- **Why it lost to Buy & Hold:** $123,714 as built, with cash earning 0%. That's $32,832 behind, or $27,477 behind with cash earning T-bills.
  - It sat in cash 42% of the time, and SPY rose just as much on those days as on invested days.
  - One four-month pause (December 2023 → April 2024) missed a rise of about 14%.
  - Costs were $3,237, but even with zero fees it still trailed.
  - Its worst fall (−9.4%) was no smaller than Buy & Hold's (−10.0%), so the time in cash bought no safety.
- **The design flaw found in review:** the trading rule used only P(Buy) − P(Sell) and ignored P(Hold), the one thing the model could do.

## v2: using all three probabilities wasn't enough

- **What changed:**
  - An expected-return rule built from all three probabilities, trading only when the expected gain beats the 0.30% round-trip cost.
  - An execution-aligned label.
  - The model and rule chosen together by money made on validation.
  - Cash earning the T-bill rate (v1 assumed 0%), applied to every version in the scorecard above.
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

| $100,000, 2023–24, cash earns T-bills | Daily | Weekly | Buy & Hold |
|---|---|---|---|
| v1 | $129,069 (15 round trips) | $129,705 (6) | $156,546 |
| v2 | $121,812 (17) | $123,834 (9) | $156,546 |
| v3 | $156,546 (never trades) | $156,546 (never trades) | $156,546 |

- **Weekly halves the trades and costs, but the gap to Buy & Hold stays about $27,000–33,000.**
- **Timing and risk control get slightly worse on the weekly schedule.** Over 2013–24, weekly v2 made $167,581 vs $179,977 daily, and its worst fall was −30.6% vs −22.4%.
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
