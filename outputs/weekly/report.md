# Weekly strategies — v1, v2 and v3 rebuilt to decide once a week

Module 3 Group 7 · 2026-10-22 · plan [docs/weekly_rebuild_note.md](../../docs/weekly_rebuild_note.md) (SHA-256 `82602bdd…`, committed before any rebuild ran) · notebooks `weekly_v1`, `weekly_v2`, `weekly_v3`, `scorecard`

## The strategy

The brief asks for a model that predicts *the optimal action (Buy, Sell or Hold) over the next 5 trading days*. Each weekly strategy does exactly that:

> **After the close on the last trading day of the week** (normally Friday), the model predicts Buy, Hold or Sell for the next 5 trading days. The trade fills at the next open (normally Monday), and the position is held for the week. **Buy** → invested in SPY, **Sell** → in cash (earning the T-bill rate), **Hold** → keep last week's position.

**Training is unchanged:** models learn from every trading day's 5-day outcome, with the same labels, gaps, features, tuning and costs as v1–v3. Each version kept its own selection rule and re-made only the choices that depend on the schedule, on its own validation or development data.

## What each version selected

| Version | Model | Re-selected on a weekly schedule | Pick | Validation / development result (Sharpe) |
|---|---|---|---|---|
| **v1w** | Random forest (v1's E06, unchanged) | Signal rule (probability margin) on the 2021–22 weekly backtest | **argmax** (act on the most likely class) | 0.58 vs Buy & Hold 0.22 |
| **v2w** | LR, RF or HGB (v2's tuning) × default long / cash | Model and default on the 2021–22 weekly backtest | **Logistic regression, default cash** | 0.21 vs 0.17 |
| **v3w** | v2w's logistic regression × 3 calibration treatments × 2 defaults | Treatment and default on the 2013–22 weekly walk-forward | **Sigmoid calibration, default long** (never sells) | 0.71 vs 0.71 |

The calibration check for v3w's new base model failed the pre-set rule again: the average P(Sell) was corrected, but year-to-year drift was not (4 of 10 years within ±3 points; 8 needed).

## Results (cash earns T-bills; after costs)

**Test 2023–2024**

| Strategy | $100,000 became | Annual return | Volatility | Max drawdown | Sharpe | Round trips | Costs | Time invested | Beats random timing |
|---|---|---|---|---|---|---|---|---|---|
| **Buy & Hold** | **$156,546** | **25.2%** | 12.8% | −10.0% | **1.43** | 1 | $100 | 100% | — |
| v1w | $126,864 | 12.7% | 9.8% | −9.7% | 0.76 | 11 | $2,554 | 60% | 27% |
| v2w | $110,453 | 5.1% | 0.0% | 0.0% | — (all cash) | 0 | $0 | 0% | not applicable |
| v3w | $156,546 | 25.2% | 12.8% | −10.0% | 1.43 | 1 | $100 | 100% | not applicable |

v1w as built (cash at 0%) made $121,900.

**12-year walk-forward, 2013–2024.** A repeated test across many market conditions (the 2018 drop, the 2020 crash, the 2022 bear market). Every January the model is retrained on all earlier data, then trades the following year with its frozen rule; the 12 years are chained from $100,000. This is a check only: nothing was chosen from it.

| Strategy (weekly decisions) | Final value | Annual return | Max drawdown | Sharpe | Time invested |
|---|---|---|---|---|---|
| **Buy & Hold** | **$499,271** | **14.4%** | −33.7% | **0.80** | 100% |
| v1w · random forest | $164,406 | 4.2% | −23.9% | 0.28 | 62% |
| v2w · logistic regression, default cash | $140,013 | 2.9% | −4.7% | 0.46 | 2% |
| v3w · never sells, so identical to Buy & Hold | $499,271 | 14.4% | −33.7% | 0.80 | 100% |

**Holdout, January 2025 – October 2026.** A later period never used for any choice. Only v3 was planned for it. v3w never sold, so it matched Buy & Hold: **$134,410** (18.2% a year, max drawdown −18.8%, Sharpe 0.84).

## What it shows

1. **No weekly strategy beat Buy & Hold** on return, Sharpe or Calmar in any period. v3w matched it only because it never sold.
2. **Choosing on two years of validation is fragile.** v1w and v2w both looked better than Buy & Hold on 2021–22, which included the 2022 fall, and both trailed badly on 2023–24's rally. v2w's pick, "stay in cash unless the model is confident", hardly ever invested afterwards.
3. **Lower risk came only from being out of the market.** v2w's worst fall over 12 years was −4.7%, but it was invested 2% of the time. Its few trades were well timed (it beat all 200 random paths with the same exposure), yet it earned 2.9% a year against 14.4%. v1w's volatility was lower than Buy & Hold's, but on 2023–24 its worst fall was the same. Over 12 years, v1w's worst fall was smaller (−23.9% vs −33.7%), but it earned 4.2% a year, its Sharpe was 0.28 vs 0.80, and it beat only 6% of random-timing paths.
4. **Weekly vs daily makes little difference** to the conclusion. The original daily versions made $129,069 (v1), $121,812 (v2) and $156,546 (v3) on the same basis. Deciding weekly roughly halves trading costs, but the model's weakness is in what it predicts (direction), not in how often it acts.

## Disclosure

The rebuild was decided after all daily results, including 2023–24 and the 2025–26 holdout, were known. Selection used only training and validation (or development) data, so these test results are honest but **not blind**. The only blind evidence is the paper-trade window from 2026-10-13.

## Earlier: the weekly schedule applied to the frozen daily models

Before the rebuild, `notebooks/weekly_decisions.ipynb` applied the weekly schedule to the frozen daily models without re-selecting anything. With T-bill cash, on 2023–24: v1 $129,705, v2 $123,834, v3 = Buy & Hold. Detailed figures are in `outputs/weekly/results.json` and `details.json`.
