# SPY weekly Buy / Hold / Sell model — Module 3, Group 7

A machine-learning classifier predicts the best action for SPY (the S&P 500 ETF) over the next 5 trading days: **Buy** (return > +1%), **Sell** (< −1%) or **Hold**. The trading strategy acts on it **once a week**: after the week's last close it takes the prediction, trades at the next open, and holds for the week. Results are compared with buying and holding, on return and on risk. The project is graded on methodology, code quality and interpretation, so everything is built to be leakage-free and tested honestly.

## The answer in three lines

1. **Buy & Hold won, on return and on risk-adjusted return.** On 2023–24 (cash earning T-bills), $100,000 became **$156,546** by buying and holding (Sharpe 1.43, max drawdown −10.0%). v1w made **$126,864** (0.76, −9.7%). v2w made **$110,453**: it stayed in cash. v3w **never sold**, so it equals Buy & Hold.
2. **The model predicts the size of next week's move, not its direction.** It beats guessing as a classifier (macro-F1 about 0.40 vs 0.32), but has no usable timing skill.
3. **Why:** next week's direction for the world's most-watched fund, from its own public prices, carries almost no signal, and every week out of a rising market costs money. Full write-up: **[outputs/SUMMARY.md](outputs/SUMMARY.md)**.

## Versions

| | Model | Key change | Test accuracy / macro-F1 | $100,000 on 2023–24 | Max drawdown | Sharpe |
|---|---|---|---|---|---|---|
| **v1w** (v1 by Peter Li) | Random forest | The brief's baseline design, deciding weekly | 44.9% / 0.408 | $126,864 | −9.7% | 0.76 |
| **v2w** | Logistic regression | Expected-return rule over all three probabilities; model and rule chosen together by money; cash earns T-bills | 45.4% / 0.404 | $110,453 (all cash) | 0.0% | — |
| **v3w** | Calibrated logistic regression | Corrects the odds that class weighting inflates | 48.2% / 0.339 | $156,546 (never sells) | −10.0% | 1.43 |
| Buy & Hold | — | — | — | **$156,546** | −10.0% | **1.43** |

All rows are on one basis: costs included, cash earning the T-bill rate, and Sharpe over T-bills. The [scorecard](notebooks/scorecard.ipynb) adds volatility, Calmar, the 12-year walk-forward, the 2025–26 holdout, and the original **daily-decision** versions for comparison (v1 $129,069, v2 $121,812, v3 $156,546). v1–v3 were first built with daily decisions; [docs/weekly_rebuild_note.md](docs/weekly_rebuild_note.md) is the plan, written before the rebuild ran, for rebuilding each one weekly.

## For assessors: where each deliverable is

| The brief asks for | Open | Look at |
|---|---|---|
| **EDA notebook** | [notebooks/01_eda.ipynb](notebooks/01_eda.ipynb) | Feature distributions (§4), indicator correlations (§5), target class balance (§6) |
| **Modelling notebook** (pipeline, features, training, tuning) | [notebooks/02_modeling.ipynb](notebooks/02_modeling.ipynb) | Time-ordered splits with gaps (§1), baselines (§3), tuned candidates in sklearn Pipelines (§4), selection (§7–8), one-time test (§9). The feature formulas are in [src/features.py](src/features.py). |
| **Realistic backtest** with fees, vs Buy & Hold | [notebooks/03_backtest.ipynb](notebooks/03_backtest.ipynb) (v1) · [notebooks/weekly_v1.ipynb](notebooks/weekly_v1.ipynb)–[v3](notebooks/weekly_v3.ipynb) (weekly) · [scorecard](notebooks/scorecard.ipynb) | 0.10% fee + 0.05% slippage per side, fills at the next open, equity vs Buy & Hold, risk metrics |
| **Lessons learned** | [outputs/SUMMARY.md](outputs/SUMMARY.md) · [outputs/weekly/report.md](outputs/weekly/report.md) · [outputs/report.md](outputs/report.md) (v1) | Where the models failed, why they lost, why markets are hard |
| **No look-ahead bias** | [tests/](tests/) (51 tests, run in CI) | Features unchanged when future data is cut or shocked; labels and splits never cross boundaries; no fit reads labels after its window |
| **Class imbalance** | `02_modeling` §4 (E04–E08) · [outputs/v3/calibration_report.md](outputs/v3/calibration_report.md) | Class weights vs SMOTE vs none, and what weighting does to the predicted odds |

**Suggested reading order (about 20 minutes):** this page → [outputs/SUMMARY.md](outputs/SUMMARY.md) → notebooks `01` → `02` → `03` → [outputs/weekly/report.md](outputs/weekly/report.md). The slides are in [presentation/](presentation/).

## Methodology guardrails

- **Timing:** the decision is made after the week's last close and filled at the next open. Models learn from every trading day's 5-day outcome.
- **Splits:** Train 2010–2020 / Validation 2021–2022 / Test 2023–2024, never shuffled. Rows whose label window would cross a boundary are dropped: 5 rows for the close→close label, 6 for the open→open label. Tuning uses `TimeSeriesSplit` with the same gap.
- **Preprocessing:** all scaling and resampling sit inside sklearn/imblearn Pipelines and are fit on each training fold only.
- **Decisions written down before results:** v1 plan in [docs/](docs/); [v2 design note](docs/v2_design_note.md); [v3 design note](docs/v3_design_note.md) and [weekly rebuild plan](docs/weekly_rebuild_note.md), both with SHA-256. Each test was opened once per design, and later changes are logged as dated deviations.
- **Evidence beyond one number:** risk metrics, a 1,000-path random-timing benchmark with matched exposure, block-bootstrap intervals, a 12-year walk-forward with yearly refits, and cash earning T-bill interest.

## Repository layout

```text
README.md                 this page
outputs/SUMMARY.md        lessons learned and the scorecard
docs/                     v1 plan (EN / 中文), v2 and v3 design notes, weekly rebuild plan
notebooks/
  01_eda.ipynb                        v1 · exploratory analysis
  02_modeling.ipynb                   v1 · pipeline, baselines, tuning, selection, one-time test
  03_backtest.ipynb                   v1 · vectorbt backtest vs Buy & Hold (daily decisions)
  04_strategy_research.ipynb          v1 follow-up research · 9 pre-registered strategies
  05_holdout_2025.ipynb               v1 follow-up research · 2025–26 holdout
  v2_02_modeling.ipynb                v2 (daily) · expected-return rule, selection, test, walk-forward
  v3_01_calibration.ipynb             v3 · do the corrected odds match reality? (no trading)
  v3_02_development_and_freeze.ipynb  v3 (daily) · 2013–22 selection and freeze
  v3_03_test_and_holdout.ipynb        v3 (daily) · 2023–24 and the 2025–26 holdout
  weekly_decisions.ipynb              the frozen daily models run on a weekly schedule
  weekly_v1.ipynb … weekly_v3.ipynb   v1w, v2w, v3w · rebuilt with weekly decisions
  scorecard.ipynb                     every strategy · return and risk on one basis
src/
  config.py      design constants (dates, thresholds, costs, gaps)
  data.py        download / load the price snapshot
  features.py    the 15 strictly-lagged features
  labels.py      forward returns and classes (the only module allowed to look ahead)
  dataset.py     features + labels table (close→close and open→open labels)
  split.py       time-ordered segments with gaps, TimeSeriesSplit CV
  models.py      baselines, Pipelines, search spaces, tuning
  evaluate.py    classification metrics, experiment log
  backtest.py    v1 signal rules, position state machine, vectorbt runner
  research.py    v1 follow-up research: walk-forward refits, weight strategies
  v2.py          expected-return rule, T-bill cash simulator, random timing, bootstrap
  v3.py          probability calibration treatments and their walk-forward
  weekly.py      the weekly decision schedule
tests/           51 tests: look-ahead, labels, splits, strategies, calibration, weekly schedule
outputs/         v1 results · research/ · v2/ · v3/ · weekly/ (incl. v1–v3 rebuilds) · scorecard.json
data/            raw/ price and T-bill snapshots · holdout/ 2025–26 data
presentation/    slide deck, speaking notes, build files
knowledge&docs/  course materials and project brief (read-only)
```

## Reproduce

Python 3.11 with the pinned `requirements.txt`. The data snapshots are committed, so everything runs offline except `05_holdout_2025`, which downloads data.

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
cd notebooks && for n in 01_eda 02_modeling 03_backtest 04_strategy_research 05_holdout_2025 v2_02_modeling v3_01_calibration v3_02_development_and_freeze v3_03_test_and_holdout weekly_decisions weekly_v1 weekly_v2 weekly_v3 scorecard; do conda run -n spy-m3 jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.kernel_name=spy-m3 $n.ipynb; done
```

Code style is checked with `ruff check src tests` and `ruff format --check src tests` (config in `ruff.toml`). On some Windows setups, pytest needs `--basetemp` pointing to a writable folder.

## Credits

**v1**, including the follow-up research in notebooks 04–05, was built by **Peter Li**, originally in [TKCH121/module3-machine-learningPL](https://github.com/TKCH121/module3-machine-learningPL). Its git history is kept here unchanged, tagged [`v1`](../../tree/v1). **v2, v3 and the weekly rebuild** are the group's revisions. A Chinese summary of v1 is in [outputs/report_CN.md](outputs/report_CN.md).
