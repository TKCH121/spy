# One decision a week — the brief's literal reading

Module 3 Group 7 · 2026-10-22 · notebook `notebooks/weekly_decisions.ipynb` · code `src/weekly.py` · full risk metrics in `notebooks/scorecard.ipynb`

## Why

The brief asks for a model that predicts *the optimal action (Buy, Sell or Hold) over the next 5 trading days*. Every version makes that 5-day prediction **every trading day** and acts on it daily, so neighbouring windows overlap (v1 only blocks exits within 5 days of buying). The literal reading is **one decision a week**:

> After Friday's close (or the last trading day of the week), predict Buy, Hold or Sell for the next 5 trading days. Trade at Monday's open. Hold all week: **Buy** → invested, **Sell** → cash, **Hold** → keep last week's position.

## How (and the disclosure)

- **Same frozen models, labels and costs.** Only the decision schedule changes. v1 and v2 use their saved test predictions; v3 and the walk-forward recompute the same frozen yearly fits.
- **Cash earns the T-bill rate for every version.** v1 as built let cash earn 0%; interest on cash is one of our improvements. The notebook first reproduces v1's published $123,714 at 0%, then scores it with T-bills.
- **Each daily run reproduces the published figure:** v2 $121,812, and the v2 walk-forward $179,977.
- **Decided after all test results were known.** This is a sensitivity check on data we have already seen, not a new selection.

## Results ($100,000, after costs, cash earns T-bills)

| Version · period | Decides daily | Decides weekly | Buy & Hold | Round trips (daily → weekly) | Costs (daily → weekly) | Max drawdown (daily → weekly) | Beats random timing (daily → weekly) |
|---|---|---|---|---|---|---|---|
| v1 · 2021–22 validation | $100,432 | $94,293 | $104,773 | 13 → 9 | $2,730 → $1,735 | −17.0% → −21.5% | 54% → 31% |
| **v1 · 2023–24 test** | $129,069 | **$129,705** | $156,546 | 15 → 6 | $3,317 → $1,256 | −9.4% → −8.7% | 46% → 39% |
| **v2 · 2023–24 test** | $121,812 | **$123,834** | $156,546 | 17 → 9 | $3,754 → $1,988 | −10.0% → −9.9% | 26% → 18% |
| v2 · 2013–24 walk-forward | $179,977 | $167,581 | $499,271 | 112 → 48 | $27,257 → $11,579 | −22.4% → −30.6% | 32% → 6% |
| v3 · 2023–24 test | $156,546 | $156,546 | $156,546 | 1 → 1 | — | −10.0% | not applicable |
| v3 · 2025–26 holdout | $134,410 | $134,410 | $134,410 | 1 → 1 | — | −18.8% | not applicable |

Buy & Hold's maximum drawdown was −24.5% (2021–22), −10.0% (2023–24), −33.7% (2013–24) and −18.8% (2025–26). The random-timing benchmark uses 1,000 paths with the same time in the market and the same number of switches (200 paths for the 12-year walk-forward).

## What it shows

1. **Weekly decisions halve the trading and the costs,** as expected: fewer, longer positions.
2. **They don't change the conclusion.** On 2023–24, weekly v1 and v2 gain about $600–2,000 over daily, but stay about $27,000–33,000 behind Buy & Hold.
3. **Timing and risk control get slightly worse, not better.** Against random traders with the same exposure, weekly ranks lower in every period. Over 12 years, weekly v2's worst fall was −30.6%, against −22.4% when deciding daily. Reacting once a week is slower, and there was no direction skill to protect.
4. **v3 is unaffected:** its corrected odds never fall below the exit line, so it never trades on either schedule.

**Bottom line:** the model's weakness is in what it predicts (direction), not in how often it acts. Matching the brief's 5-day horizon exactly makes the design cleaner and cheaper, but not more profitable or safer.
