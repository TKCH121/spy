# v3 results — calibrated probabilities

Module 3 Group 7 · 2026-10-22 · design: `docs/v3_design_note.md` (SHA-256 `8149938b…`) · notebooks `v3_01_calibration`, `v3_02_development_and_freeze`, `v3_03_test_and_holdout`

## Answer

**Correcting the model's odds removed v2's over-selling, and with it all trading.** The candidate picked by the pre-stated rule, C3-L (sigmoid-calibrated gradient boosting, default long), never sold in any period. It is Buy & Hold. Under the plan's own criteria, v3 shows **no usable timing skill**.

## Results ($100,000, after costs, cash earning T-bills, yearly refits)

| Period | Status | v3 (C3-L) | Buy & Hold | Round trips | Lowest E[r] (exit line −0.30%) |
|---|---|---|---|---|---|
| 2013–2022 development | selection data | $316,844 | $316,844 | 1 | — |
| 2023–2024 | already seen (§5.4) | **$156,546** | $156,546 | 1 | −0.09% |
| 2025-01-02 → 2026-10-12 | primary holdout, not blind (§5.5) | **$134,410** | $134,410 | 1 | −0.03% |

- **Random-timing test (§5.5 success criterion): not applicable.** The strategy never switched, so every random path with the same exposure and number of switches is the same path. The criterion was neither met nor failed. We report it this way rather than quoting a number.
- **The bootstrap interval for Sharpe vs Buy & Hold is [0, 0]**, since the two are identical.
- **Every candidate that did trade lost to Buy & Hold in development** (see `development_report.md`).

## Calibration (§5.1, before any trading)

- **Not passed.** The average P(Sell) was fixed: 30.3% → 21.5–21.8% (C1/C2), against an actual 20.7%.
- **Year-to-year drift was not fixed:** no treatment was within ±3 points in more than 4 of 10 years, and 8 were required. See `calibration_report.md`.

## Classification on the test periods (labelled rows, argmax of calibrated probabilities)

| Period | Accuracy | Macro-F1 | Log loss |
|---|---|---|---|
| 2023–2024 | 48.4% | 0.349 | 1.019 |
| 2025–2026 | 50.3% | 0.371 | 1.029 |

Accuracy is the highest of any version, but macro-F1 is the lowest. Calibrated odds make the model call the common Hold weeks more often, which raises accuracy without adding skill. This is why v1 selected on macro-F1, and why accuracy alone is a weak measure here.

## Conclusion across versions

| | Model | Trading result vs Buy & Hold | What it taught us |
|---|---|---|---|
| v1 | Random forest | −$32,832 (2023–24) | The rule ignored the model's only skill |
| v2 | Gradient boosting | −$34,734 (2023–24); beat 26% of random traders | Class weights inflate the odds the rule relies on |
| v3 | Gradient boosting + calibration | ±$0: it never trades | With honest odds, there is no timing signal worth paying costs for |

## Still running

The blind paper-trade (§5.6, from 2026-10-13, per the logged deviation) logs the frozen rule's daily signal. **The group still needs to fix its evaluation date.**
