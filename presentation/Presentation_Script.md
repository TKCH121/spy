# Presentation script — Can a computer beat “buy and wait”?

Module 3 Group 7 · goes with `SPY_Model_Presentation.pptx` (25 slides) · about 39 minutes plus questions.

Read it in your own words rather than word for word. Replace anything in [square brackets] before presenting.

**Short on time?** Skipping slides 3 (glossary), 7 (the 15 measurements), 11 (random forest explained), 13 (trading rule), 17 (how we judge v2), 19 (twelve years) and 22 (v3 development detail) brings it to about 27 minutes. The story still holds: question → v1 result → why it lost → v2 → v3 → honesty → lessons. For about 20 minutes, also skip 6, 8 and 20 and cover their points in one sentence each.

## Slide 1 · Cover (~1 minute)

Hi everyone, we’re Group 7. You don’t need any finance background for this talk — we’ll explain every term as we go.

Our question is simple: if you had $100,000 to invest in the US stock market, could a computer model that decides every day when to be in and when to be out do better than just buying once and waiting?

Spoiler: it didn’t. But the assignment isn’t graded on making money — it’s graded on building the model correctly and explaining why it won or lost. That’s what this talk is about.

Version 1 of the model was built by Peter Li; versions 2 and 3 are the group’s improvements on it.

## Slide 2 · The question in one picture (~1 minute)

Here’s the whole project in one picture.

Option A: on the first trading day of 2023 you put $100,000 into the US stock market and simply leave it there for two years. Finance people call this “Buy & Hold”. It’s our yardstick — the thing to beat.

Option B: a computer model looks at recent market data every evening and decides whether your money should be in the market tomorrow or sitting in cash. Each time it switches, you pay a small fee, just as you would with a real broker.

The question is: which one ends 2024 with more money? Before we tell you, a few words you’ll need.

## Slide 3 · Five words you’ll hear today (~1.5 minutes)

Five terms, and that’s all the finance you need.

SPY is a single fund that owns the 500 biggest US companies — Apple, Microsoft and so on. When the US market goes up, SPY goes up.

Buy & Hold means buying once and never selling.

A backtest is how we test a trading idea without real money: we replay history one day at a time and let the model trade as if it were live, but it may only use information that existed on that day.

Trading cost: every time you buy or sell you pay about 0.15% — a broker fee plus a slightly worse price than you hoped. That’s $150 per $100,000 moved.

Drawdown is the worst fall from a high point — how bad the worst stretch feels.

## Slide 4 · The answer: buy-and-wait won by $32,832 (~1.5 minutes)

Here’s the answer up front.

$100,000 left in the market for 2023 and 2024 grew to about $156,500 — a profit of $56,500.

The same $100,000 managed by our model grew to about $123,700 — a profit of $23,700. So the model still made money, but $32,800 less than doing nothing.

It also paid over $3,200 in trading costs, against $100 for Buy & Hold.

The assignment told us to expect this, so losing isn’t a failure of the project. The rest of the talk explains how the model works and exactly why it lost.

## Slide 5 · The two-year journey of $100,000 (~1.5 minutes)

This chart follows the $100,000 day by day. The dark line is Buy & Hold, the orange line is our model.

For most of 2023 the two lines stay fairly close. Then look at the flat orange stretch from December 2023 to April 2024. The model had moved everything to cash, and it stayed there for four months while the market climbed about 14%. That single decision explains a big part of the gap.

Overall, the model was out of the market on about 42% of days. In a market that mostly rose during these two years, being out that often is expensive.

## Slide 6 · How the model makes a decision, every evening (~1.5 minutes)

Every evening the model does four things.

First, it measures 15 things about the recent market — we’ll see them on the next slide.

Second, it predicts what kind of week is coming: up more than 1%, down more than 1%, or roughly flat.

Third, a simple rule turns that prediction into a decision: be in the market tomorrow, or be in cash.

Fourth, if the decision is a change, it buys or sells when the market opens next morning and pays the cost.

The key rule: the model decides after the close and trades at the next morning’s price. It can never trade at a price it has already seen — that would be cheating.

## Slide 7 · What the model looks at: 15 measurements (~1.5 minutes)

These are the 15 measurements, grouped by the question each one answers.

How much has the price moved over the last day, week, two weeks and month? Is the price above or below its usual level over the last one, two and ten months? Has it risen or fallen unusually fast — the classic “overbought / oversold” signals? How jumpy is the market? And are unusually many people trading?

The important part is the last line. Every measurement uses only data up to today. We have automated tests that, for example, scramble all future prices and check that none of today’s measurements change. If any measurement were peeking into the future, those tests would fail.

## Slide 8 · What the model predicts: what kind of week is next (~1.5 minutes)

The model doesn’t try to predict an exact price. It predicts what kind of week is coming, in three buckets.

Say SPY closes at $500 on Monday. If a week later it’s above $505 — up more than 1% — that was an up week. Below $495 is a down week. In between is a flat week.

In our test period, 42% of weeks were flat, 40% up and only 18% down. Because down weeks are rare, we tell the model to give them extra weight, otherwise it would mostly ignore them.

And the mix changes a lot from year to year: 2017 had almost no down weeks, 2022 had loads. That makes the past an unreliable guide.

## Slide 9 · No cheating: textbook, practice exam, final exam (~1.5 minutes)

This is the part the assignment cares about most: making sure the test is fair.

Think of it like school. The model studies from a textbook — eleven years of history, 2010 to 2020. We then give it a practice exam, 2021 and 2022, to choose between different models and trading rules. Once we’ve chosen, everything is locked. Only then do we open the final exam, 2023 and 2024, exactly once.

We never shuffle the data, because in real life you can’t learn from the future. And we leave a one-week buffer between periods, because each prediction looks a week ahead and must not peek into the next period.

## Slide 10 · Choosing the model: the random forest scored best (~1.5 minutes)

We tried seven models on the practice exam, plus random guessing as a baseline.

The score is called macro-F1. In plain words, it’s a grade from 0 to 1 for how well a model recognises all three kinds of week — not just the common ones. Random guessing gets about 0.33.

The random forest, in orange, scored 0.40 — the only model clearly above guessing. Several versions of logistic regression, a simpler model, sat just above guessing. Gradient boosting actually did worse than guessing.

It was also consistent: it scored 0.40 when tested on held-back parts of the textbook, and 0.40 again on the practice exam.

That was our pre-agreed rule — highest practice-exam score wins — so the random forest became the model. The next slide explains what a random forest is.

## Slide 11 · What a random forest is, and why it won (~2 minutes)

A random forest is a crowd of simple decision trees — here, 300 of them.

Each tree is a flowchart of yes/no questions: is the market jumpy, is the price above its usual level, and so on. Each one learns from a different random slice of history, so they all disagree a little. For every day, all 300 trees vote, and the share of votes becomes a probability — for example 38% up, 35% flat, 27% down.

Why did it win? Trees can learn combinations of signals, which the simpler logistic regression can’t. And voting protects against memorising. Gradient boosting shows the danger: it scored 0.74 on the data it trained on but only 0.32 on the practice exam — it memorised noise. The forest dropped much less, from 0.54 to 0.40, which tells us it learned something real, if small.

## Slide 12 · Final exam: good at spotting calm weeks, not direction (~2 minutes)

This grid shows every prediction on the final exam. Rows are what really happened; columns are what the model said.

The big orange square in the middle: of 207 flat weeks, the model correctly called 129. That’s the one thing it’s genuinely good at.

Now look at the corners, in blue. Of 92 real down weeks, it called 39 of them “up”. Of 198 real up weeks, it called 56 “down”. So when a big move comes, the model is close to a coin flip on which way it goes.

Its overall score was 0.41, the same as on the practice exam and well above the simple baselines. So as a predictor it’s honest and better than guessing — but its skill is “calm week or big week”, not “up or down”. Keep that in mind.

## Slide 13 · Turning predictions into trades (v1’s rule) (~1.5 minutes)

Here’s how v1 turned the model’s votes into trades.

If the model is more confident in “up” than in “down” by at least 5 percentage points, be in the market. If it’s more confident in “down”, move everything to cash. Otherwise, do nothing.

There’s one extra rule: after buying, stay in for at least five days, to avoid paying fees for jumping in and out. And it’s always all of the money or none of it.

Notice there was already a warning sign on the practice exam: this rule turned $100,000 into about $99,800, while Buy & Hold made about $104,800. It was the best of the rules we tried, but it never beat simply waiting, even before the final exam.

## Slide 14 · Where the $32,832 went (~2 minutes)

So where did the $32,800 go? Three places.

First, one long pause. From December 2023 to April 2024 the model was in cash while the market rose about 14%. On roughly $106,000, that’s about $15,000 missed in one go.

Second, too much time in cash overall: 42% of days. And here’s the key fact — on the days it sat out, the market rose just as much on average as on the days it was in. So stepping out never protected us from anything; it just meant missing gains.

Third, trading costs: over $3,200, against $100 for Buy & Hold.

But costs weren’t the main reason. Even with zero broker fees, the model would have finished around $127,500 — still about $29,000 behind.

## Slide 15 · The real problem (statement) (~1.5 minutes)

This is the real problem, and it’s the main thing we learned from reviewing version 1.

The model is like a weather forecaster who can reliably tell you tomorrow will be windy, but not which direction the wind will blow. And we used that forecaster to choose which way to sail.

Concretely: the model’s skill is recognising calm weeks. But the trading rule only compared “up” against “down” — exactly the part the model can’t do — and ignored the “calm week” prediction completely.

So the good prediction score and the poor money result aren’t a contradiction. The rule disconnected them. That’s a design flaw, not just bad luck — and it’s fixable. That’s version 2.

## Slide 16 · What version 2 changes (~2 minutes)

Version 2 keeps everything that was done right — the measurements, the textbook/practice/final-exam split, the costs — and changes five things.

One, and most important: use all three predictions. We combine the chances of an up, flat and down week into one expected gain, and only trade when that gain beats the roughly $300 cost of getting out and back in. Now the “calm week” skill counts.

Two: we test two habits. Either stay invested and only step out on strong warnings, or stay in cash and only step in on strong signals. The practice exam decides which.

Three: we measure the prediction from the next morning’s price, which is when the trade really happens.

Four: we choose the model by money made on the practice exam, not just by prediction score.

Five: instead of one two-year final exam, we also test year by year from 2013 to 2024.

## Slide 17 · How we’ll know if it really works (~2 minutes)

Beating or losing to Buy & Hold over one period doesn’t prove much either way. So version 2 adds four checks.

The main one is on the left: 1,000 random traders. Each is in the market for the same number of days as our model, but on randomly chosen days. If our model can’t beat at least 950 of them, its timing is no better than luck. That’s a fair test, because it separates “was the model clever?” from “did it simply spend less time in the market?”.

Two: cash earns interest. In 2023–24, cash earned about 5% a year; v1 assumed nothing.

Three: error bars. We re-run the numbers on shuffled blocks of weeks to see how much they would change by chance.

Four: a receipt for every trade, in dollars — exactly how much each exit gained or cost.

## Slide 18 · Version 2 results: $100,000, 2023–2024 (~1.5 minutes)

Here are the real version 2 results, all starting from $100,000 on the same final exam, 2023 to 2024.

Buy & Hold: about $156,500. Version 1: about $123,700. Version 2: about $121,800 — slightly worse than version 1.

The number on the right matters most. We ran 1,000 random traders who were in the market for the same number of days as version 2, just on random days. Version 2 beat only 264 of them. A typical random trader ended with about $128,400 — more than our model. To claim real timing skill, we said in advance it needed to beat at least 950.

So version 2 fixed version 1’s design flaw, but the result shows there was very little “which way” skill underneath to use. And thanks to the random traders, we can say that with evidence, not just a hunch.

## Slide 19 · Twelve years, one year at a time (~1.5 minutes)

One two-year exam could be a fluke, so we also re-trained version 2 every January and let it trade each following year, from 2013 to 2024.

Each bar is one year: how many percentage points version 2 was ahead of or behind Buy & Hold. Orange bars are years it won. There are only two: 2016, by a hair, and 2022, when the market fell and being in cash helped a lot.

Over the whole twelve years, $100,000 would have grown to about $180,000 with version 2, against about $499,000 with Buy & Hold. Version 2 did have a smaller worst fall — about 22% against 34% — so it was calmer, but it gave up most of the growth.

## Slide 20 · Why version 2 still lost (~2 minutes)

Three reasons version 2 still lost.

One: it stepped out of the market too often. Even the version whose default is to stay invested was only in the market about half the time.

Two — and this is the most interesting finding — its down-week odds were inflated. Remember we told the model to pay extra attention to rare down weeks. That improves the prediction score, but it also makes the model overstate how likely a down week is. Version 2 uses those odds directly to compute an expected gain, and down weeks are also the biggest moves on average. So the expected gain kept dipping below zero and the model kept stepping out. A version 3 would need to correct, or “calibrate”, those odds first.

Three: underneath, there just isn’t much direction skill. Most of its exits missed gains — for example, it was out for seven weeks from December 2023 while the market rose almost 7%.

## Slide 21 · Version 3: correct the odds first (~1.5 minutes)

Version 3 tackles the problem we just found: the model’s odds of a down week were inflated. Before touching any trading, we wrote down a test for whether the odds were fixed, and checked it on ten years of history.

The chart shows the average predicted chance of a down week. Version 2 said 30%. In reality it was 21%. Two simple fixes — training without the extra weight, or keeping it and mathematically undoing it — bring the average down to about 21 or 22%. On average, that’s fixed.

But the share of down weeks swings a lot from year to year — 2017 had very few, 2022 had many — and a model trained on the past can’t see those swings coming. We had said in advance the odds must be within 3 points in at least 8 of 10 years. The best fix managed 4. So by our own rule, calibration failed, and we report that rather than quietly moving the bar.

## Slide 22 · With honest odds, the best rule is: don’t trade (~1.5 minutes)

Here are the six version 3 candidates, each re-trained every January from 2013 to 2022, starting with $100,000 and paying costs.

We chose the winner with a rule we wrote down in advance: the best return for the risk taken. The winner was the “fitted correction, stay invested” version. And here’s the twist: in ten years it never once stepped out of the market. Its corrected odds never looked bad enough to justify paying the cost of selling. So it is simply Buy & Hold, and it ties Buy & Hold to the dollar.

Every version that actually traded did worse. Even the ones that stayed invested 95% of the time ended about $70,000 behind, because their few exits were badly timed.

So the honest conclusion of version 3 is: once the odds are corrected, the best our model can do is tell you not to trade. We’ve frozen that choice, and the last steps — checking it on 2025–26 data and a live paper-trade that started on 13 October — are still running.

## Slide 23 · How we kept the test honest (~1.5 minutes)

Since the assignment is graded on doing this properly, here is how we kept ourselves honest.

One: for versions 2 and 3, we wrote the plan before writing any code — what we’d change, how we’d choose, and what would count as success. Each plan was committed to the repository with a digital fingerprint, so any later edit would be visible.

Two: each version chose its model on earlier data, locked the choice, and only then looked at the test years.

Three: 46 automated tests check that nothing can see the future — for example, scrambling all future prices or outcomes must leave every prediction unchanged.

Four: whenever something went wrong, we logged it instead of hiding it. That includes a one-day overlap we found in one of version 1’s experiments, and version 3 failing its own calibration test.

## Slide 24 · What we learned (~1.5 minutes)

Four things we’d take away.

One: how big next week’s move will be is somewhat predictable; which way it goes is not. Our model learned exactly that.

Two: sitting in cash isn’t free. The market mostly rises, so every day out costs money unless you genuinely know something.

Three: the past changes. A signal that worked for ten years actively misled the model in the 2022 downturn.

Four: a good prediction score doesn’t automatically make good trades. Version 2 fixed the trading rule and still lost, partly because a setting that improves the prediction score — extra weight on rare down weeks — distorted the odds the rule depended on. And once version 3 corrected those odds, the best rule turned out to be: don’t trade.

## Slide 25 · Questions (closing) (~30 seconds, then Q&A)

To sum up: $100,000 left alone grew to about $156,500. Our first model grew it to about $123,700, because it could predict how big the next move would be but not which way, and its trading rule only used the direction.

Version 2 fixed that rule and still ended with about $121,800. It beat only 264 of 1,000 random traders, and it trailed Buy & Hold in 10 of 12 years. Version 3 corrected the model’s odds, and its best rule was simply never to sell. So the honest conclusion is that this model has no real timing skill — and the project shows how to prove that properly.

Everything is in the repository on screen. Thanks — we’re happy to take questions.
