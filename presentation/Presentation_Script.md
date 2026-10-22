# Speaking notes — SPY weekly Buy / Hold / Sell model

Module 3 Group 7 · goes with `SPY_Model_Presentation.pptx` (19 slides + 3 appendix) · **about 10 minutes**

Seven points to make, in order. Each lists the slides it covers and roughly how long to spend. Use your own words; the figures below are the ones on the slides.

---

## 1. What we set out to do (slides 1–3 · ~45 s)

- The brief: predict the best action for SPY over the next 5 trading days (Buy, Hold or Sell) and test whether trading on it beats buy-and-hold after costs. Assessment is on method and interpretation, not profit.
- Slide 2 maps each deliverable to where it is in the repository.
- **The strategy (slide 3):** after each Friday's close the model predicts the next 5 days; we trade at Monday's open and hold for the week. Buy means fully invested, Sell means cash (earning the T-bill rate), Hold means no change. Every trade costs 0.15%.

## 2. What the data told us before any model (slides 4–5 · ~1 min)

- **Slide 4, direction:** today's return says almost nothing about the next days' (correlations between −0.10 and +0.05).
- **Slide 4, size:** the *size* of moves clusters strongly (0.32–0.42). Extreme days are far more common than a normal distribution implies: 80 days beyond 3 standard deviations, against about 14 expected.
- **So:** the size of next week's move is predictable, its direction much less so. That finding shapes everything that follows.
- **Slide 5:** the classes are imbalanced (Sell is about one week in five), and the mix shifts a lot: 5% Sell weeks in 2017, 41% in 2022.

## 3. How we built and validated it (slides 6–10 · ~2.5 min)

- **Features (slide 6):** 15 standard indicators, all strictly lagged. Imbalance is handled with class weights; SMOTE and no weighting were tested and scored lower.
- **Validation (slide 7):** this is the core of the brief.
  - Data is split by time (train 2010–20, validation 2021–22, test 2023–24), never shuffled, with a buffer at each boundary.
  - Choices are made on validation only; the test is scored once.
  - We also ran a 12-year walk-forward and a 2025–26 holdout. 51 automated tests check for any use of future data.
- **Integrity (slide 8):** one table answers "did you look at the test data?":
  - training and validation were used to choose; the test, walk-forward, holdout and paper-trade were not;
  - the random forest's and logistic regression's exact settings and tuning are listed.
- **Iterations (slide 9):** three versions, each fixing the previous one's weakness:
  - v2 uses all three probabilities and nets off costs;
  - v3 corrects the probabilities;
  - all three were rebuilt for weekly decisions, under a plan written down first.
- **Classification (slide 10):** all versions beat a random baseline (macro-F1 about 0.40 vs 0.32), but, as the EDA suggested, the skill is in spotting quiet weeks, not direction.

## 4. The result: buy-and-hold was not beaten (slides 11–13 · ~2 min)

- **Headline (slide 11):** $100,000 over 2023–24 became **$156,546 with buy-and-hold**.
  - v1 made $126,864.
  - v2 made $110,453: it stayed in cash.
  - v3 never sold, so it matched buy-and-hold.
- **Risk (slide 12):**
  - Lower volatility from time in cash, but v1's maximum drawdown was no smaller (about −10% for both) and its Sharpe was lower (0.76 vs 1.43).
  - v1 beat only 27% of 1,000 random-timing strategies with the same exposure.
- **Robustness (slide 13):**
  - **The walk-forward:** retrain every January from 2013 to 2024, trade the following year, repeat.
  - **Results:** buy-and-hold $499,271, v1 $164,406, v2 $140,013 (invested 2% of the time); v3 matched buy-and-hold.
  - **Holdout:** on the 2025–26 period, never used for any choice, v3 again matched buy-and-hold.

## 5. Why (slides 14–15 · ~1.5 min)

- **No directional skill:** days in cash returned as much as days invested.
- **Short validation:** 2021–22 included a bear market, so selection favoured defensive rules that missed the 2023–24 rally. Slide 5 already showed how much one period differs from the next.
- **Imbalance has a side effect (slide 15):**
  - Weighting the minority class, as the brief asks, makes the model overstate the chance of a down week (30% vs 21%).
  - v3's corrections fix the average but not the year-to-year shifts.
- **Costs were secondary** (about $2,500 for v1 with weekly trading).

## 6. Is this a limitation of machine learning? (slides 16–17 · ~1 min)

- **Mainly it's the question:** next week's direction for the world's most-traded fund, from public prices alone. Machine learning is more useful for ranking many assets, forecasting risk, or using non-public data.
- **Limits (slide 17):** the weekly rebuild and the 2025–26 holdout were designed after earlier results were known. The forward paper-trade from 13 October is the only blind test.

## 7. Conclusions (slide 18 · ~45 s)

- The size of a move is predictable; its direction is not.
- Buy-and-hold was not beaten on return or risk-adjusted return, in any period.
- Better classification scores do not guarantee better trading decisions.
- Two years of validation is too short to choose a trading rule.

Close on slide 19 and take questions. The appendix is for questions: (A) weekly vs daily decisions, (B) v1's confusion matrix, (C) feature correlations.
