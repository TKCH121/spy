# Final model — partial-position strategy: plan, written before any result

Module 3 Group 7 · written 2026-10-22, before any code or result for this variant.

## Question

The final model (v4) uses all-in or all-out positions. In development, cutting the worst fall meaningfully meant leaving the market often, which cost return. **Does holding 50% in uncertain weeks, rather than 0% or 100%, give a better trade-off?** This is a strategy change only: the model, its settings and its probabilities are v4's, frozen.

## Strategy

Each week, after the last close, using the calibrated P(large loss) from the frozen v4 model (gradient boosting, prior-corrected probabilities, refit each January):

| P(large loss) | Position for the week |
|---|---|
| below a | **100%** in SPY |
| a to below b | **50%** in SPY, 50% in cash |
| b or above | **0%** (all cash) |

- Trades fill at the next open, and costs (0.10% fee + 0.05% slippage) apply to the amount traded. Cash earns the T-bill rate.
- Positions start at 100%.

**Candidates (a, b):** (0.15, 0.30), (0.20, 0.30), (0.20, 0.40), (0.25, 0.40), (0.30, 0.40). For comparison, all-in/all-out at 0.20, 0.30 and 0.40 is reported alongside, recomputed with the same simulator.

## Selection (same target as v4)

- **Data:** the 2013–2022 walk-forward only.
- **Eligible:** annual return ≥ 85% of buy-and-hold's, and an average position ≥ 70%.
- **Pick:** the smallest max drawdown; ties → higher Sharpe.
- **If none is eligible:** the highest Calmar (annual return ÷ max drawdown) among candidates with an average position ≥ 70%.
- Freeze, then report 2023–24, 2013–24 and the 2025–26 holdout.

**What counts as meaningful (for the deck):** a better drawdown-for-return trade-off than all-in/all-out in development, *and* no worse a Sharpe than buy-and-hold on the reported periods. Reported either way.

## Deviations

_None yet._
