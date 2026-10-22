# Speaking notes — SPY weekly Buy / Hold / Sell model

Module 3 Group 7 · goes with `SPY_Model_Presentation.pptx` (19 slides + 3 appendix) · **about 10 minutes**

Seven points to make, in order. Each lists the slides it covers and roughly how long to spend. Use your own words; the figures below are the ones on the slides.

---

## 1. What we set out to do (slides 1–3 · ~45 s)

- The brief: predict the best action for SPY over the next 5 trading days (Buy, Hold or Sell) and test whether trading on it beats buy-and-hold after costs. Assessment is on method and interpretation, not profit.
- **The strategy:** after each Friday's close the model predicts the next 5 days; we trade at Monday's open and hold for the week. Cash earns the T-bill rate, and every trade costs 0.15%.
- **We compare two models:**
  - the **baseline**, which asks the brief's question as written: which way will SPY move?
  - the **final model**, which asks the investor's question: can we keep most of the market's return while avoiding large losses?

## 2. What the data told us before any model (slides 4–5 · ~1 min)

- Today's return says almost nothing about the next days' (correlations −0.10 to +0.05), but the *size* of moves clusters strongly (0.32–0.42).
- Extreme days are far more common than a normal distribution implies: 80 days beyond 3 standard deviations, against about 14 expected.
- **So:** the size of next week's move is predictable, its direction much less so. That is why the final model asks a risk question rather than a direction question.
- **Slide 5:** Sell weeks are a minority, and their share swings a lot, from 5% of weeks in 2017 to 41% in 2022.

## 3. How we built and validated it (slides 6–10 · ~2.5 min)

- **Features and target (slide 6):** 15 lagged indicators. The baseline's Sell means a fall of more than 1%; the final model's Sell means a *large* loss, more than 2%. Imbalance is handled with class weights; SMOTE and no weighting were tested and scored lower.
- **Validation (slides 7–8):**
  - Data is split by time, never shuffled, with a buffer at each boundary.
  - Choices are made on earlier data and frozen; the test is scored once.
  - Slide 8 answers "did you look at the test data?": training and validation were used to choose, nothing else was. It also lists each model's exact settings.
  - 51 automated tests check for any use of future data.
- **The two models (slide 9):** the baseline is a random forest chosen by validation Sharpe. The final model is gradient boosting chosen against a stated target: at least 85% of the market's return with the smallest drawdown, over ten years.
- **Classification (slide 10):** both beat a random guess, and in both the skill is in recognising turbulent or quiet weeks, not direction.

## 4. The result (slides 11–13 · ~2.5 min)

- **12 years, retrained every January (slide 11):** $100,000 became $499,271 with buy-and-hold and $488,154 with the final model, which exited only twice. The baseline made $164,406; it was out of the market a third of the time without better timing.
- **Risk (slide 12):**
  - The final model matched buy-and-hold's drawdown, and on the 2025–26 holdout finished ahead: $139,986 vs $134,410.
  - The baseline had smaller drawdowns but much lower returns.
  - Against random-timing strategies with the same exposure, the baseline showed no consistent skill.
- **The trade-off (slide 13):**
  - Cutting the worst fall from −34% to −21% would have cost about 28% of the return.
  - No candidate met both targets, so the rule chose the one that kept most of the return.
  - Its two exits both came right after crashes: one helped (April 2025), one cost (April 2020).

## 5. Why, and what we learned along the way (slides 14–15 · ~1.5 min)

- **The baseline lost because it has no directional skill:** days in cash returned as much as days invested. Its rule, chosen on 2021–22 (which included a bear market), was too defensive for the 2023–24 rally.
- **Two intermediate versions (slide 15) led to the final design:**
  - The first used all three probabilities but sold too often, because class weighting inflated the predicted chance of a down week (30% vs 21%).
  - The second corrected the probabilities and then never traded.
  - That pointed us from the direction question to the risk question.

## 6. Is this a limitation of machine learning? (slides 16–17 · ~1 min)

- **Mainly it's the question:** asking for direction fails; asking about risk fits what the data can predict, though less risk still costs return.
- **Limits (slide 17):**
  - The final model and the holdout came after earlier results were known.
  - Two exits are too few to separate skill from luck.
  - The forward paper-trade from 13 October is the only blind test.

## 7. Conclusions (slide 18 · ~45 s)

- The size of a move is predictable; its direction is not.
- The question matters: direction timing lost to the market, while avoiding large losses stayed close to it.
- Less risk is not free with this model.
- Two years of validation is too short to choose a trading rule.

Close on slide 19 and take questions. The appendix is for questions: (A) every version tested, (B) the baseline's confusion matrix, (C) feature correlations.
