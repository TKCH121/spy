# Summary — lessons learned

Module 3 Group 7 · 2026-10-22. Detailed reports: [weekly strategies](weekly/report.md) · [v1](report.md) · [v2](v2/report.md) · [v3](v3/report.md), plus v3's [calibration](v3/calibration_report.md) and [development](v3/development_report.md) reports.

## Question and answer

**Question.** A classifier predicts the best action for SPY over the next 5 trading days: Buy (return > +1%), Sell (< −1%) or Hold. Does trading on it beat buying and holding?

**Strategy.** After each week's last close, take the model's prediction, trade at the next open, and hold for the week. Buy → invested, Sell → in cash earning T-bills, Hold → no change.

**Answer: no.** Three successive versions, each tested without look-ahead and with realistic costs, were beaten by Buy & Hold on return and on risk-adjusted return. The classifier has a small, genuine skill, but it is in the **size** of next week's move, not its **direction**.

### Scorecard ([notebook](../notebooks/scorecard.ipynb))

$100,000; 0.10% fee + 0.05% slippage per side; cash earns the 13-week T-bill rate; Sharpe is measured over T-bills.

**Test 2023–2024**

| Strategy (weekly decisions) | Final value | Annual return | Volatility | Max drawdown | Sharpe | Round trips | Time invested |
|---|---|---|---|---|---|---|---|
| **Buy & Hold** | **$156,546** | **25.2%** | 12.8% | −10.0% | **1.43** | 1 | 100% |
| v1w · random forest | $126,864 | 12.7% | 9.8% | −9.7% | 0.76 | 11 | 60% |
| v2w · logistic regression, default cash | $110,453 | 5.1% | 0.0% | 0.0% | — (all cash) | 0 | 0% |
| v3w · calibrated logistic regression | $156,546 | 25.2% | 12.8% | −10.0% | 1.43 | 1 (never sells) | 100% |

**Walk-forward 2013–2024 (yearly refits) and holdout 2025-01 → 2026-10**

| Strategy | Final value | Annual return | Max drawdown | Sharpe | Time invested |
|---|---|---|---|---|---|
| Buy & Hold, 2013–24 | **$499,271** | **14.4%** | −33.7% | **0.80** | 100% |
| v2w, 2013–24 | $140,013 | 2.9% | −4.7% | 0.46 | 2% |
| v3w, 2013–24 | $499,271 | 14.4% | −33.7% | 0.80 | 100% |
| Buy & Hold = v3w, 2025–26 holdout | $134,410 | 18.2% | −18.8% | 0.84 | 100% |

**Daily decisions, for comparison** (the original v1–v3, same basis, 2023–24): v1 $129,069, v2 $121,812, v3 $156,546 (never sells). The schedule changes costs, not the conclusion.

## How the three versions developed

| | What changed | Why | Result (weekly, 2023–24) |
|---|---|---|---|
| **v1** (Peter Li) | Random forest; Buy/Sell rule from the two directional probabilities | The brief's baseline design | $126,864. The model's skill (recognising flat weeks) never reached the trading rule. |
| **v2** | Expected-return rule using all three probabilities, trading only when the gain beats the 0.30% round-trip cost. Model and rule chosen together by validation Sharpe. Cash earns T-bills. Execution-aligned label. | Fix v1's design flaw; judge by money, not prediction score | $110,453. Validation chose "stay in cash unless confident", which almost never invested afterwards. |
| **v3** | Correct the probabilities (class weighting inflates the odds of a down week) before using them | v2's expected gain was biased downwards | $156,546. With honest odds, the expected gain never justified selling, so it never trades. |

## What we learned

1. **The model predicts the size of moves, not their direction.** Big-move weeks cluster, so it can see them coming. Which way they go is close to a coin flip. Test macro-F1 was about 0.40 against 0.32 for guessing, and 0.37–0.40 across the later versions.
2. **Class imbalance handling has a side effect.** Weighting the rare Sell class (as the brief requires; SMOTE was also tested) improves prediction scores but makes the model overstate the odds of a down week: 30% predicted vs 21% actual. A trading rule that reads those odds sells too often.
3. **Accuracy alone misleads.** v3w has the highest accuracy (48–50%) but the lowest macro-F1 (0.34–0.36), because corrected odds mostly predict the common flat weeks.
4. **Two years of validation is not enough to choose a trading rule.** v1w and v2w both beat Buy & Hold on 2021–22, a period that included a bear market, and both failed on 2023–24's rally.
5. **Sitting in cash has a cost.** SPY rose through every test period. Without direction skill, time out of the market lowers return, and lower volatility follows only from being out.
6. **A flaw of machine learning, or of the question?** Mostly the question: next week's direction for the most-watched fund in the world, from its own public price history. Machine learning helps more with ranking many assets, forecasting risk or using non-public data. Even there, edges are usually small after costs.

## How we know the results are honest

- **No look-ahead:** 51 automated tests, run in CI. Cutting or shocking future data must not change any feature or prediction, and no fit may read labels beyond its window.
- **Time-ordered splits** with label-length gaps, and tuning with `TimeSeriesSplit` using the same gap.
- **Selection rules and plans written down before results.** The v3 and weekly-rebuild plans are fingerprinted with SHA-256. Each test was opened once per design, and later changes are logged with dates.
- **Evidence beyond one number:** risk metrics, a random-timing benchmark with matched exposure, bootstrap intervals, and a 12-year walk-forward.

## Limits

- **One asset**, price and volume features only, a weekly horizon, all in or all out.
- **The weekly rebuild and the 2025–26 holdout are not blind:** the test periods had been seen when they were designed. The paper-trade from 13 Oct 2026 is the only blind evidence; the group still needs to fix its evaluation date.
- **Results use committed price snapshots;** a refreshed download can differ slightly.
