# v4 — near-market return with a smaller drawdown

Module 3 Group 7 · 2026-10-22 · design [docs/v4_design_note.md](../../docs/v4_design_note.md) (written before any v4 code) · notebook `notebooks/v4_drawdown_aware.ipynb`

## The question

Can a weekly Buy / Hold / Sell model keep most of the S&P 500's return while cutting its worst losses?

**Target (fixed in the design note):**
- at least **85% of buy-and-hold's annual return**;
- with the **smallest maximum drawdown**;
- invested at least **70%** of the time.

**How v4 frames the action:**
- **Sell** = the next 5 trading days lose more than 2%;
- **Buy** = they gain more than 1%;
- otherwise **Hold**.

**Weekly decision:** after the week's last close, go to cash for the week if the calibrated P(Sell) ≥ τ; otherwise stay invested. Cash earns T-bills; costs are 0.15% per side.

## The trade-off (development walk-forward 2013–2022, yearly refits)

| Model | τ | Annual return | Share of buy-and-hold's return | Max drawdown | Sharpe | Time invested |
|---|---|---|---|---|---|---|
| **Buy & Hold** | — | **12.2%** | 100% | −33.7% | 0.71 | 100% |
| Random forest | 0.20 | 8.9% | 72% | **−21.5%** | 0.63 | 88% |
| Gradient boosting | 0.20 | 7.4% | 61% | −22.2% | 0.54 | 87% |
| Gradient boosting | 0.30 | 9.8% | 80% | −29.5% | 0.61 | 98% |
| Random forest | 0.30 | 9.4% | 76% | −31.1% | 0.59 | 98% |
| **Gradient boosting** ✔ pick | **0.40** | **12.0%** | **98%** | −33.7% | 0.70 | 100% |
| Logistic regression | 0.40 | 11.0% | 90% | −33.7% | 0.65 | 99% |
| Random forest | 0.40 | 10.9% | 89% | −34.9% | 0.65 | 100% |
| Logistic regression | 0.30 | 8.7% | 71% | −34.9% | 0.54 | 98% |
| Logistic regression | 0.20 | 4.3% | 35% | −34.9% | 0.32 | 88% |

**What it shows:**
- **Cutting the worst fall meaningfully cost a lot of return.** The best drawdown, −21.5% instead of −33.7%, came with 72% of the market's annual return (8.9% vs 12.2%), and a lower Sharpe.
- **No candidate met both parts of the target.** The three that kept ≥ 85% of the return barely ever left the market, so their drawdown was the market's.
- **The selection rule therefore picked gradient boosting with τ = 0.40,** which exits only rarely.

## Results of the frozen pick ($100,000, after costs)

| Period | v4 | Buy & Hold | Max drawdown (v4 / B&H) | Sharpe (v4 / B&H) | Exits |
|---|---|---|---|---|---|
| 2023–2024 test | $156,546 | $156,546 | −10.0% / −10.0% | 1.43 / 1.43 | 0 |
| 2013–2024 walk-forward | $488,154 | $499,271 | −33.7% / −33.7% | 0.79 / 0.80 | 1 (week of 13 Apr 2020; SPY +2.0%) |
| 2025–26 holdout | **$139,986** | $134,410 | −18.8% / −18.8% | 0.99 / 0.84 | 1 (week of 14 Apr 2025; SPY −4.2%) |

- **On the holdout, v4 finished $5,576 ahead of buy-and-hold** by stepping out for the week after the April 2025 sell-off. But that's a single decision; over 2013–24 the equivalent exit (April 2020) cost money.
- **One exit can't separate skill from luck.** v4 beat 49% of random-timing strategies with the same exposure on the holdout, and 45% over 2013–24.
- **Classification:** test accuracy 56.5% and macro-F1 0.34 on the new, more imbalanced label. The model almost never predicts a large loss outright (Sell recall 0–3%). Its signal is in the probability, which rises after turbulent weeks.

## Interpretation

1. **The question changed the answer.** Asked for direction, the models lost money relative to the market (v1–v3). Asked to avoid large losses, the model stays invested and steps aside only in the most turbulent weeks. Its returns are close to the market's, and once slightly better.
2. **Near-market return with *much* less drawdown wasn't achievable with this model.** The data supports a menu, not a free lunch: about −36% less drawdown for about −28% less return (development).
3. **The model reacts to volatility, not direction.** Both exits came the week after a crash, when volatility peaked. That's consistent with the EDA: the size of moves is predictable, their direction isn't.

## What would push the trade-off further (not tested)

- **Partial positions instead of all-in / all-out.** For example, hold 50% when P(Sell) is high, which reduces exposure without leaving the market.
- **Volatility-based sizing,** which v1's follow-up research found gave a better Sharpe with a much smaller drawdown over 2013–22.
- **Additional risk data,** such as the VIX term structure or credit spreads, with the same discipline on what was known when.

## Strategy variant: partial positions (0% / 50% / 100%)

Plan: [docs/v4_partial_positions_note.md](../../docs/v4_partial_positions_note.md), written before the test · notebook `notebooks/v4_partial_positions.ipynb` · same frozen model.

**Rule:** each week, hold **100%** below P(large loss) `a`, **50%** from `a` to below `b`, and **0%** at `b` or above. Selection used the same target as v4 (2013–22).

| Development 2013–22 | Annual return | Max drawdown | Sharpe | Average position |
|---|---|---|---|---|
| Buy & Hold | 12.2% | −33.7% | 0.71 | 100% |
| Partial 0.20 / 0.30 | 8.7% | −24.2% | 0.61 | 92% |
| Partial 0.20 / 0.40 | 9.7% | −26.2% | 0.66 | 93% |
| All-in/out at 0.30 (for comparison) | 9.8% | −29.5% | 0.61 | 98% |
| **Partial 0.30 / 0.40** ✔ pick | 10.9% | −31.3% | 0.67 | 99% |
| All-in/out at 0.40 (the final model) | 12.0% | −33.7% | 0.70 | 100% |

| Reported | Partial (pick) | Final (all-in/out) | Buy & Hold |
|---|---|---|---|
| 2023–24 test | $156,546 | $156,546 | $156,546 |
| 2013–24 walk-forward | $444,365 (max drawdown −31.3%, Sharpe 0.77) | $488,154 (−33.7%, 0.79) | $499,271 (−33.7%, 0.80) |
| 2025–26 holdout | $139,986 | $139,986 | $134,410 |

**Verdict against the pre-set test: not a meaningful improvement.**
- Holding half a position in uncertain weeks gives a few slightly better points on the return-versus-drawdown trade-off. But it is not a clearly better frontier, and its Sharpe over 2013–24 was lower than buy-and-hold's.
- In 2023–24 and 2025–26 the risk never landed in the 50% band, so it behaved exactly like the all-in/out final model.
- **The constraint is the signal, not the position sizing:** the model's large-loss probability is too weak to cut drawdowns without giving up a similar share of return.
