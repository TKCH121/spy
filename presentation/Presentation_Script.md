# Speaking notes — SPY weekly Buy / Hold / Sell model

Module 3 Group 7 · goes with `SPY_Model_Presentation.pptx` (16 slides + 2 appendix) · **about 10 minutes**

Six points to make, in order. Each lists the slides it covers and roughly how long to spend. Use your own words; the figures below are the ones on the slides.

---

## 1. What we set out to do (slides 1–3 · ~1 min)

- The brief: predict the best action for SPY over the next 5 trading days (Buy, Hold or Sell) and test whether trading on it beats buy-and-hold after costs. Assessment is on method and interpretation, not profit.
- Slide 2 maps each deliverable to where it is in the repository: EDA, modelling, backtest, lessons learned.
- **The strategy (slide 3):** after each Friday's close the model predicts the next 5 days; we trade at Monday's open and hold for the week. Buy means fully invested, Sell means cash (earning the T-bill rate), Hold means no change. Every trade costs 0.15%.

## 2. How we built and validated it (slides 4–7 · ~2.5 min)

- **Features (slide 4):** 15 standard indicators covering momentum, trend, overbought/oversold, volatility and volume. All strictly lagged.
- **Imbalance (slide 4):** Sell weeks are only about 20% of the data. We used class weights; SMOTE and no weighting were tested and scored lower.
- **Validation (slide 5):** this is the core of the brief. Data is split by time: train 2010–20, validation 2021–22, test 2023–24, never shuffled, with a buffer at each boundary. Models and rules are chosen on validation only, and the test is scored once. We also ran a 12-year walk-forward with yearly refits and a 2025–26 holdout. 51 automated tests check for any use of future data.
- **Iterations (slide 6):** three versions, each fixing the weakness found in the previous one:
  - v2 uses all three probabilities and nets off trading costs;
  - v3 corrects the probabilities.
  - All three were rebuilt for weekly decisions, under a plan written down before the rebuild.
- **Classification (slide 7):** the random forest won v1's selection. All versions beat a random baseline (macro-F1 about 0.40 vs 0.32), but their skill is in spotting quiet weeks, not the direction of the market.

## 3. The result: buy-and-hold was not beaten (slides 8–10 · ~2.5 min)

- **Headline (slide 8):** $100,000 over 2023–24 became **$156,546 with buy-and-hold**.
  - v1 made $126,864.
  - v2 made $110,453: its rule kept it in cash, earning interest only.
  - v3 never sold, so it matched buy-and-hold exactly.
- **Risk (slide 9):**
  - The models had lower volatility because they spent time in cash, but v1's maximum drawdown was no smaller than buy-and-hold's (about −10% for both).
  - Their Sharpe ratio was lower: 0.76 for v1 vs 1.43.
  - v1 beat only 27% of 1,000 random-timing strategies with the same exposure, so its timing was no better than chance.
- **Robustness (slide 10):**
  - Over 12 years, v2 cut the worst drawdown to under 5% but was invested only 2% of the time: 2.9% a year vs 14.4%.
  - On the 2025–26 holdout, v3 again matched buy-and-hold.

## 4. Why (slides 11–12 · ~1.5 min)

- **No directional skill:** days in cash returned as much as days invested, so leaving the market only gave up the upward drift.
- **Short validation:** 2021–22 included a bear market, so the selection favoured defensive rules that then missed the 2023–24 rally.
- **Imbalance has a side effect (slide 12):**
  - Weighting the minority class, which the brief asks for, makes the model overstate the chance of a down week: 30% vs 21%.
  - v3's corrections fix the average but not the year-to-year shifts, and we report that against our own pre-set test.
- **Costs were secondary,** at about $2,500 for v1 with weekly trading.

## 5. Is this a limitation of machine learning? (slides 13–14 · ~1 min)

- **Mainly it's the question:** next week's direction for the world's most-traded fund, from public prices alone.
- Machine learning is more useful for ranking many assets, forecasting risk, or using non-public data.
- **Our safeguards and limits (slide 14):** be explicit that the weekly rebuild and the 2025–26 holdout were designed after earlier results were known. The forward paper-trade from 13 October is the only blind test.

## 6. Conclusions (slide 15 · ~1 min)

- The size of a move is predictable; its direction is not.
- Buy-and-hold was not beaten on return or risk-adjusted return, in any period.
- Better classification scores do not guarantee better trading decisions.
- Two years of validation is too short to choose a trading rule.

Close on slide 16 and take questions. The appendix (weekly vs daily decisions, v1's confusion matrix) is there for questions.
