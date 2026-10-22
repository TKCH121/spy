# v2 results — did using the model's real skill help?

Module 3 Group 7 · 2026-10-22 · notebook `notebooks/v2_02_modeling.ipynb` · design fixed in advance in `docs/v2_design_note.md`

## Answer

**No.** v2 did what the design note specified, but its timing was worse than chance. With $100,000 over the 2023–2024 test period, after costs and with cash earning T-bills:

| Strategy | $100,000 became | Sharpe over T-bills | Max drawdown | Round trips | Time invested |
|---|---|---|---|---|---|
| **Buy & Hold SPY** | **$156,546** | **1.43** | −10.0% | 1 | 100% |
| v1 primary (reference) | $123,714 | — | −9.6% | 15 | 58% |
| **v2 · gradient boosting · default-long** | **$121,812** | 0.59 | −10.0% | 17 | 53% |
| Random-timing traders, median of 1,000 | $128,399 | — | — | 17 | 53% |

- **Random-timing benchmark:** v2 beat **26%** of 1,000 random traders with the same time in the market and the same number of switches. The design note's bar for "works" was 95%.
- **Sharpe vs Buy & Hold:** the difference is −0.84. Its 95% block-bootstrap interval is [−1.86, +0.34].
- **Classification:** test macro-F1 is 0.376, vs 0.317 for stratified guessing. The 95% interval for the difference is [+0.002, +0.110]: a small skill, and only just distinguishable from chance.
- **Walk-forward 2013–2024** (yearly refits, reporting only): $100,000 → **$179,977** vs **$499,271** for Buy & Hold. Drawdown was smaller (−22% vs −34%), but v2 was ahead in only 2 of 12 years: 2016 (+1.5 points) and the 2022 bear market (+21.6 points).

## What was selected, and how

- **Tuning:** the three models were tuned on log loss with 5-fold time-series CV and a 6-day gap. CV log loss was close for all three (LR 1.045, RF 1.041, HGB 1.045; guessing scores 1.099).
- **Joint selection** on the validation backtest picked **gradient boosting with default-long**. Its Sharpe over T-bills was 0.178, against 0.166 for Buy & Hold. That margin is tiny, and it came from 18 trades.
- The configuration was frozen (`outputs/v2/frozen_config.json`) before the test segment was read.

## Why it still failed

1. **The rule exits too often, even in its "stay invested" form.** The model had to clear an expected loss of 0.30% to exit, yet it was out of the market 47% of the time. Two things push the expected return down:
   - **Balanced class weights inflate P(Sell).** They make the model pay more attention to rare down weeks, which also pushes its *probabilities* for them up. Good for macro-F1, bad for a rule that uses the probabilities as real odds.
   - **The down-week average is the largest in size:** −2.80% vs +2.24% for up weeks (training data). So a moderate P(Sell) easily tips E[r] below the hurdle.
2. **No direction skill to exploit.** The out-of-market spells (table in the notebook, §6) mostly missed gains. Most notably, 6 Dec 2023 → 24 Jan 2024 missed +6.8%, and 13 → 31 Mar 2023 missed +6.4%. That's the same story as v1.
3. **Validation selection was noise-level.** The winning margin over Buy & Hold on validation was 0.012 Sharpe. That's far smaller than the bootstrap uncertainty shown above.

## What this means for the assignment

v2 fixed v1's design flaw: P(Hold) now counts, the label matches execution, and model and rule are chosen together. The result still did not improve, because the model has very little information about direction, and the probabilities it gives are biased by the class weighting. The stronger evidence (random timing, bootstrap intervals, 12-year walk-forward) shows this is not a matter of bad luck in one period.

## Ideas for a v3 (hypotheses, not results)

- **Calibrate the probabilities:** train without class weights, or re-calibrate on validation, before using them as odds in E[r].
- **Treat the size of the move as the target**, where the skill is, and use it for position sizing rather than in/out timing.
