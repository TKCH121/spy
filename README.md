# Can a computer beat “buy and wait”? — SPY trading signal model (Module 3, Group 7)

A machine-learning model predicts the best action for SPY (the S&P 500 fund) over the next 5 trading days: **Buy** (expected rise > 1%), **Sell** (fall > 1%) or **Hold**. A backtest trades on those predictions, and the result is compared with simply buying and holding. Every version acts on a fresh prediction each day. A weekly schedule (one decision each Friday, the brief's literal reading) is tested as well. The project is graded on **methodology, code quality and interpretation**, not profit. Everything below is built to be leakage-free and honestly tested.

## The answer in three lines

1. **Every version lost to Buy & Hold.** On 2023–24, $100,000 became **$156,546** by buying and waiting, **$123,714** with v1, and **$121,812** with v2. v3's best rule **never traded**, so it equals Buy & Hold.
2. **The model can tell how big next week's move will be, not which way.** It beats guessing as a classifier (test macro-F1 0.41 vs 0.31), but has no usable timing skill: v2 beat only 26% of 1,000 random traders.
3. **Why, in one sentence:** predicting next week's direction of the world's most-watched fund from its own public prices leaves almost no signal, and every day out of a rising market costs money. Full write-up: **[outputs/SUMMARY.md](outputs/SUMMARY.md)**.

## Versions at a glance

| | Model | Key change | Test accuracy / macro-F1 | $100,000 on 2023–24 | Report |
|---|---|---|---|---|---|
| **v1** (Peter Li) | Random forest | The brief's baseline project | 44.9% / 0.408 | $123,714 | [outputs/report.md](outputs/report.md) |
| **v2** | Gradient boosting | Uses all three probabilities in an expected-return rule; selects by money, not score | 40.9% / 0.376 | $121,812 | [outputs/v2/report.md](outputs/v2/report.md) |
| **v3** | Gradient boosting + calibrated odds | Corrects the odds that class weighting inflates | 48.4% / 0.349 | $156,546 (never trades) | [outputs/v3/report.md](outputs/v3/report.md) |
| Buy & Hold | — | — | — | **$156,546** | — |

v2 and v3 predict an execution-aligned label (open → open), so their scores are not exactly comparable with v1's. v3's accuracy is higher, but only because calibrated odds call the common "flat" weeks more often. Its macro-F1 is the lowest.

**One decision a week** ([report](outputs/weekly/report.md)): after Friday's close, predict for the next 5 days, trade at Monday's open, and hold all week. This uses the same frozen models and roughly halves trading costs: on 2023–24, v1 makes $124,654 and v2 $123,834. The conclusion doesn't change. It is a sensitivity check, decided after the test results were known.

## For assessors: where each deliverable is

| The brief asks for | Open | Look at |
|---|---|---|
| **EDA notebook** | [notebooks/01_eda.ipynb](notebooks/01_eda.ipynb) | Feature distributions (§4), indicator correlations (§5), target class balance (§6) |
| **Modelling notebook** (pipeline, features, training, tuning) | [notebooks/02_modeling.ipynb](notebooks/02_modeling.ipynb) | Time-ordered splits with gaps (§1), baselines (§3), tuned candidates in sklearn Pipelines (§4), selection rules (§7–8), one-time test (§9). The feature formulas are in [src/features.py](src/features.py). |
| **Realistic backtest** with fees, vs Buy & Hold | [notebooks/03_backtest.ipynb](notebooks/03_backtest.ipynb) | vectorbt, 0.10% fee + 0.05% slippage per side, fills at the next open, equity vs Buy & Hold (§1), fee sensitivity (§2) |
| **Lessons learned** | [outputs/report.md](outputs/report.md) (v1) · [outputs/SUMMARY.md](outputs/SUMMARY.md) (all versions) | Where the model failed, why it lost, why markets are hard |
| **No look-ahead bias** | [tests/](tests/) (50 tests, run in CI) | Features unchanged when future data is cut or shocked; labels and splits never cross boundaries; no fit reads labels after its window |
| **Class imbalance** | `02_modeling` §4 (E04–E08), [outputs/v3/calibration_report.md](outputs/v3/calibration_report.md) | Class weights vs SMOTE vs none, and what weighting does to the odds |
| Beyond the brief | `v2_02_modeling`, `v3_01…03`, [docs/](docs/) | Two improved versions, each designed (and, for v3, fingerprinted) before any code was written |
| Weekly decisions (the brief's literal "next 5 days") | [notebooks/weekly_decisions.ipynb](notebooks/weekly_decisions.ipynb) | Every version re-run with one Buy/Hold/Sell decision per week |

**Suggested reading order (about 20 minutes):** this page → [outputs/SUMMARY.md](outputs/SUMMARY.md) → notebooks `01` → `02` → `03` → the v2 and v3 reports. The slides are in [presentation/](presentation/).

## Methodology guardrails

- **Timing:** each prediction is made after the close of day *t*, and the trade fills at the open of *t+1*.
- **Splits:** Train 2010–2020 / Validation 2021–2022 / Test 2023–2024, never shuffled. Rows whose label window would cross a boundary are dropped: 5 rows for v1's close→close label, 6 for v2/v3's open→open label. Tuning uses `TimeSeriesSplit` with the same gap.
- **Preprocessing:** all scaling and resampling sit inside sklearn/imblearn Pipelines and are fit on each training fold only.
- **Selection rules stated before results:** v1 in [docs/](docs/); v2 in [docs/v2_design_note.md](docs/v2_design_note.md); v3 in [docs/v3_design_note.md](docs/v3_design_note.md), with its SHA-256. Each test period is opened once, after freezing. Later changes are logged as dated deviations.
- **Evidence, not one number:** a 12-year walk-forward with yearly refits, block-bootstrap confidence intervals, a 1,000-path random-timing benchmark with matched exposure, and cash earning T-bill interest (v2/v3).

## Repository layout

```text
README.md                 this page
outputs/SUMMARY.md        lessons learned across v1–v3
docs/                     v1 plan (EN / 中文), v2 and v3 design notes, v2 work items
notebooks/
  01_eda.ipynb                     v1 · exploratory analysis
  02_modeling.ipynb                v1 · pipeline, baselines, tuning, selection, one-time test
  03_backtest.ipynb                v1 · vectorbt backtest vs Buy & Hold
  04_strategy_research.ipynb       v1 follow-up research · 9 pre-registered strategies, 2013–2022
  05_holdout_2025.ipynb            v1 follow-up research · 2025-01 → 2026-10 holdout
  v2_02_modeling.ipynb             v2 · expected-return rule, joint selection, test, evidence, walk-forward
  v3_01_calibration.ipynb          v3 · do the corrected odds match reality? (no trading)
  v3_02_development_and_freeze.ipynb  v3 · 2013–2022 selection and freeze
  v3_03_test_and_holdout.ipynb     v3 · 2023–24 and the 2025–26 holdout
  weekly_decisions.ipynb           all versions · one decision per week (sensitivity check)
src/
  config.py      every design constant (dates, thresholds, costs, gaps)
  data.py        download / load the price snapshot
  features.py    the 15 strictly-lagged features
  labels.py      forward returns and classes (the only module allowed to look ahead)
  dataset.py     features + labels table (v1 and v2 labels)
  split.py       time-ordered segments with gaps, TimeSeriesSplit CV
  models.py      baselines, Pipelines, search spaces, tuning
  evaluate.py    classification metrics, experiment log
  backtest.py    v1 signal rules, position state machine, vectorbt runner
  research.py    v1 follow-up research: walk-forward refits, weight strategies
  v2.py          expected-return rule, T-bill cash simulator, random timing, bootstrap
  v3.py          probability calibration treatments and their walk-forward
  weekly.py      one-decision-a-week schedule (Friday close → Monday open)
tests/           look-ahead, label, split, v2 strategy, v3 calibration and weekly tests (pytest)
outputs/         v1 results and report · research/ · v2/ · v3/ · weekly/
data/            raw/ price and T-bill snapshots · holdout/ 2025–26 data
presentation/    slide deck, 10-minute script, build files
knowledge&docs/  course materials and project brief (read-only)
```

## Reproduce

Python 3.11 with the pinned `requirements.txt`. The data snapshots are committed, so everything runs offline except `05_holdout_2025`, which downloads data. A full run takes a few minutes.

```bash
conda create -y -n spy-m3 python=3.11
```

```bash
conda run -n spy-m3 pip install -r requirements.txt
```

```bash
conda run -n spy-m3 python -m ipykernel install --user --name spy-m3
```

```bash
conda run -n spy-m3 python -m pytest -q
```

```bash
cd notebooks && for n in 01_eda 02_modeling 03_backtest 04_strategy_research 05_holdout_2025 v2_02_modeling v3_01_calibration v3_02_development_and_freeze v3_03_test_and_holdout weekly_decisions; do conda run -n spy-m3 jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.kernel_name=spy-m3 $n.ipynb; done
```

Code style is checked with `ruff check src tests` and `ruff format --check src tests` (config in `ruff.toml`). On some Windows setups, pytest needs `--basetemp` pointing to a writable folder.

## Credits

**v1**, including the follow-up research in notebooks 04–05, was built by **Peter Li**, originally in [TKCH121/module3-machine-learningPL](https://github.com/TKCH121/module3-machine-learningPL). Its git history is kept here unchanged, tagged [`v1`](../../tree/v1). **v2 and v3** are the group's revisions. A Chinese summary of v1 is in [outputs/report_CN.md](outputs/report_CN.md).
