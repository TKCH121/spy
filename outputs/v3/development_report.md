# v3 development walk-forward (2013–2022) and freeze

Module 3 Group 7 · 2026-10-22 · notebook `notebooks/v3_02_development_and_freeze.ipynb` · design note §5.2–5.3

Committed together with `outputs/v3/frozen_config.json`, **before any row from 2023 onward was scored**. Caveat from the calibration report: no candidate passed §5.1, so these trading results are not a test of calibration (design note §6).

## Results: $100,000 from Jan 2013 to Dec 2022, after costs, cash earning T-bills, yearly refits

| ID | Probabilities | Default | $100,000 became | Sharpe over T-bills | Time invested | Round trips | Fees |
|---|---|---|---|---|---|---|---|
| **S0** | Buy & Hold (reference) | — | **$316,844** | **0.708** | 100% | 1 | $100 |
| **C3-L** ✔ pick | sigmoid calibration | long | **$316,844** | **0.708** | 100% | 1 | $100 |
| C2-L | prior correction | long | $245,504 | 0.578 | 95% | 22 | $6,534 |
| C1-L | no class weights | long | $249,244 | 0.577 | 95% | 23 | $6,273 |
| C3-C | sigmoid calibration | cash | $207,355 | 0.495 | 70% | 32 | $8,738 |
| C1-C | no class weights | cash | $120,871 | 0.152 | 61% | 79 | $17,194 |
| C2-C | prior correction | cash | $118,844 | 0.139 | 62% | 80 | $18,389 |
| C0-L | v2 as is (reference) | long | $135,211 | 0.249 | 60% | 94 | $21,413 |
| C0-C | v2 as is (reference) | cash | $78,028 | −0.536 | 15% | 61 | $10,720 |

## Selection and freeze

- **The rule** (fixed in advance): highest Sharpe over T-bills among C1–C3 × {long, cash}, ties broken by fewer round trips.
- **The pick: C3-L.** Its Sharpe of 0.708 equals Buy & Hold's but does not beat it. As the design note requires, the pick goes forward anyway.
- **Frozen config:** `outputs/v3/frozen_config.json`.

## What it means

- **The selected rule never trades.** Sigmoid calibration squeezes the probabilities into a narrow band (calibration report: almost all P(Sell) values fall between 20% and 30%). So E[r] never fell below the −0.30% exit hurdle in ten years. C3-L is Buy & Hold.
- **Every candidate that did trade did worse than staying invested.** The near-always-invested C1-L and C2-L lost about $70,000 against Buy & Hold over ten years, through a handful of badly timed exits plus about $6,500 in fees. Every default-cash version lost far more.
- **Correcting the odds removed v2's excessive selling, but there was no timing skill left to use.** Under its own pre-stated rule, the best v3 strategy is to not trade.

## Next (design note §5.4–5.6)

The frozen C3-L is to be reported on 2023–2024 (already seen), the 2025-01 → 2026-10-12 holdout, and the blind window from 2026-10-13. Since it has never exited, it will match Buy & Hold unless calibrated E[r] drops below −0.30% at some point in those periods. The random-timing percentile is then not meaningful (one round trip), and the report will say so rather than quote a number.
