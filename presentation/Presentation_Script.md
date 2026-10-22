# Presentation script — Can a computer beat “buy and wait”?

Module 3 Group 7 · goes with `SPY_Model_Presentation.pptx` (30 slides) · **about 10 minutes of speaking**, plus clicks and questions.

**Speak** slides carry the deliverables the brief grades. **Flash** slides get one line. **Skip** slides are there as backup for questions: click past them. Say it in your own words. Fill in the presenter names and date on slide 1.

| Slide | Title | Tier | Time |
|---|---|---|---|
| 1 | Cover | Speak | 20 s |
| 2 | What we delivered | Speak | 40 s |
| 3 | The question in one picture | Flash | 10 s |
| 4 | Five words you’ll hear today | Skip | — |
| 5 | The answer: buy-and-wait won by $32,832 | Speak | 25 s |
| 6 | The two-year journey of $100,000 | Flash | 10 s |
| 7 | How the model makes a decision, every evening | Speak | 25 s |
| 8 | What the model looks at: 15 measurements | Speak | 20 s |
| 9 | What the model predicts: Buy, Hold or Sell for 5 days | Speak | 25 s |
| 10 | No cheating: textbook, practice exam, final exam | Speak | 45 s |
| 11 | Choosing the model: the random forest scored best | Speak | 30 s |
| 12 | What a random forest is, and why it won | Skip | — |
| 13 | Final exam: good at spotting calm weeks, not direction | Speak | 25 s |
| 14 | Turning predictions into trades (v1’s rule) | Flash | 15 s |
| 15 | Where the $32,832 went | Speak | 35 s |
| 16 | The real problem (statement) | Speak | 20 s |
| 17 | What version 2 changes | Speak | 20 s |
| 18 | How we’ll know if it really works | Skip | — |
| 19 | Version 2 results: $100,000, 2023–2024 | Speak | 25 s |
| 20 | Twelve years, one year at a time | Flash | 10 s |
| 21 | Why version 2 still lost | Skip | — |
| 22 | Class imbalance: good for predictions, bad for odds | Speak | 35 s |
| 23 | Version 3: correct the odds first | Speak | 20 s |
| 24 | With honest odds, the best rule is: don’t trade | Speak | 20 s |
| 25 | Which model, and how accurate? | Speak | 25 s |
| 26 | One decision a week: the brief’s literal reading | Speak | 25 s |
| 27 | How we kept the test honest | Speak | 25 s |
| 28 | A flaw of machine learning, or of the question? | Speak | 25 s |
| 29 | What we learned | Speak | 20 s |
| 30 | Questions (closing) | Flash | 10 s |

## 1. Cover (~20 s)

We’re Group 7. As the brief asks, our model predicts the best action for SPY over the next 5 trading days: Buy, Hold or Sell. The question: with $100,000, does trading on those predictions beat simply buying and waiting? The brief grades method, not profit, so we’ll show what we built and how we tested it.

## 2. What we delivered (~40 s)

Here’s everything the brief asked for and where to find it. An exploratory notebook on the features and the class balance. A modelling notebook with lagged features, time-ordered splits and tuning. A realistic backtest with fees and slippage, plotted against Buy & Hold. And a lessons-learned report. On top of that, two improved versions, each planned before any code was written. Throughout, 50 automated tests check that nothing sees the future.

## 3. The question in one picture · flash, one line (~10 s)

Option A: buy once and wait. Option B: follow the model’s Buy, Hold or Sell prediction for the next 5 days, paying a fee on every trade.

## 4. Five words you’ll hear today · skip: click past

_Backup if the audience needs the terms: SPY, Buy & Hold, backtest, trading cost, drawdown._

## 5. The answer: buy-and-wait won by $32,832 (~25 s)

The answer up front, on the 2023–24 test period: $100,000 left alone grew to $156,546. Our model grew it to $123,714, about $32,832 less, and paid $3,237 in trading costs. The brief expected this; the rest explains why.

## 6. The two-year journey of $100,000 · flash, one line (~10 s)

Note the flat orange stretch: the model sat in cash from December 2023 to April 2024 while the market rose about 14%.

## 7. How the model makes a decision, every evening (~25 s)

Every evening the model measures the market and predicts the action for the next 5 trading days: Buy, Hold or Sell. Buy means be invested, Sell means move to cash, Hold means keep the current position. Any change fills at the next morning’s open, so it never trades at a price it has already seen. A fresh 5-day prediction is made each day; slide 26 shows the once-a-week version.

## 8. What the model looks at: 15 measurements (~20 s)

The brief asked for returns, at least three technical indicators and a volatility measure, all lagged. We used 15: returns, moving averages, RSI, MACD, Bollinger bands, volatility and volume, each using only data up to that day.

## 9. What the model predicts: Buy, Hold or Sell for 5 days (~25 s)

The target uses the brief’s thresholds: up more than 1% in five days is Buy, down more than 1% is Sell, otherwise Hold. Down weeks are rare, about one in five, so the classes are imbalanced. We come back to that on slide 22.

## 10. No cheating: textbook, practice exam, final exam (~45 s)

This is the core of the brief. No random shuffling: we train on 2010 to 2020, choose the model on 2021–22, lock everything, and only then open 2023–24, once. There’s a one-week buffer between periods, because each label looks a week ahead. Tuning used time-series cross-validation with the same buffer. Our accuracy, about 45%, sits in the range the brief calls normal: no sign of leakage.

## 11. Choosing the model: the random forest scored best (~30 s)

We started with interpretable models, as the brief asks: logistic regression, random forest and gradient boosting, plus baselines. The rule, set in advance: best practice-exam macro-F1. The random forest won at 0.40; random guessing is about 0.33. Gradient boosting memorised its training data and did worse than guessing.

## 12. What a random forest is, and why it won · skip: click past

_Backup if asked: 300 decision trees vote; voting limits memorising (0.54 on training data vs 0.40 on the practice exam, against 0.74 vs 0.32 for gradient boosting)._

## 13. Final exam: good at spotting calm weeks, not direction (~25 s)

On the final exam it scored 0.41, the same as on practice. But look where the skill is: it recognises calm weeks well, and mixes up up-weeks and down-weeks almost at random.

## 14. Turning predictions into trades (v1’s rule) · flash, one line (~15 s)

v1’s exact rule: Buy when the model leans “up” by 5 points or more, Sell when it leans “down”, otherwise Hold. All in or all out, and at least 5 days in after buying.

## 15. Where the $32,832 went (~35 s)

Where the money went. One long pause during a rally cost about $15,000. Overall it sat in cash 42% of the time, and those days were just as good as the days it was invested, so stepping out bought nothing. Costs were about $3,200, but even with zero fees it still trailed Buy & Hold. This is the core of our lessons-learned report.

## 16. The real problem (statement) (~20 s)

The real problem: the model can tell how big next week’s move will be, not which way. And the trading rule only used the “which way” part. Its real skill never reached a trade.

## 17. What version 2 changes (~20 s)

Version 2 fixes that. It turns all three predictions into one expected gain, trades only when that beats the cost, and picks the model by money made, not just by prediction score.

## 18. How we’ll know if it really works · skip: click past

_Backup if asked: v2 is also judged against 1,000 random traders with the same time in the market, with error bars, and with cash earning T-bill interest._

## 19. Version 2 results: $100,000, 2023–2024 (~25 s)

Version 2 ended with $121,812, no better than version 1. More telling: it beat only 264 of 1,000 random traders who spent the same time in the market. Its timing was no better than luck.

## 20. Twelve years, one year at a time · flash, one line (~10 s)

Re-trained every year from 2013 to 2024, it was ahead of Buy & Hold in only two of twelve years.

## 21. Why version 2 still lost · skip: click past

_Backup if asked: it stepped out too often (in the market about half the time), its down-week odds were inflated, and there was little direction skill underneath._

## 22. Class imbalance: good for predictions, bad for odds (~35 s)

The brief requires handling class imbalance. We used class weights, after testing SMOTE and no weighting in version 1. Balancing makes the model treat all three kinds of week as equally common, which is good for predictions. But it inflates the odds: the model predicted 30% down weeks against 21% in reality. Version 2 used those odds directly, so it kept selling.

## 23. Version 3: correct the odds first (~20 s)

Version 3 keeps the weights for training, then corrects the odds. On average that works: 21% predicted vs 21% real. But it failed our own year-by-year test, set in advance, and we report that.

## 24. With honest odds, the best rule is: don’t trade (~20 s)

With honest odds, the rule we chose in advance picked a version that never sold: not in ten years of history, not in 2023–24, not on the 2025–26 holdout. It is Buy & Hold. Every version that traded did worse.

## 25. Which model, and how accurate? (~25 s)

Across versions: v1 used a random forest; v2 switched to gradient boosting because it chose by money, not score. Accuracy stayed between 41 and 48%, inside the brief’s normal range. Note v3: highest accuracy, lowest macro-F1, because corrected odds mostly call flat weeks. Accuracy alone would mislead.

## 26. One decision a week: the brief’s literal reading (~25 s)

The brief says “predict the optimal action over the next 5 trading days”, so we also ran every version deciding just once a week: after Friday’s close, trade at Monday’s open, hold all week. It halves the trades and costs, but the result barely moves, still about $32,000 behind Buy & Hold. The weakness is what the model predicts, not how often it acts.

## 27. How we kept the test honest (~25 s)

How we kept it honest: plans written and fingerprinted before any code, each final exam opened once, 50 automated look-ahead tests, and every change or failure logged rather than hidden.

## 28. A flaw of machine learning, or of the question? (~25 s)

Is this a flaw of machine learning? Mostly it’s the question: predicting next week’s direction for the most-watched fund in the world from its own public prices. Machine learning helps elsewhere, like ranking many stocks or forecasting risk. That’s why our fair bar was beating random timing, not just beating Buy & Hold.

## 29. What we learned (~20 s)

Four lessons: the size of a move is predictable, the direction isn’t; sitting in cash has a cost; the past changes; and good predictions don’t automatically make good trades.

## 30. Questions (closing) · flash, one line (~10 s)

Everything is in the repository on screen. Thank you, and we’re happy to take questions.
