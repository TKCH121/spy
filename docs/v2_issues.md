# v2 work items

Each item below can be opened as a GitHub issue: the heading is the title, and the text is the body. Item numbers refer to [v2_design_note.md](v2_design_note.md). Work in a branch per item and open a pull request.

## 1. Open-to-open label as the primary target (C1)
Make `label_kind="open"` the v2 default in the dataset build, keeping close→close as a sensitivity check. Add a test that the open label for row t uses Open(t+1) and Open(t+6) only.

## 2. Expected-return score with per-fit class means (C2)
Add a function that returns E[r] = Σ P_k·μ_k, where μ_k is computed from the training rows of the same fit. Test that μ_k never uses validation or test rows.

## 3. Default-long and default-cash position rules (C3, C4)
Implement both state machines with the 0.30% hurdle. Test them on hand-made probability series, including the starting state and the re-entry at E[r] ≥ 0.

## 4. Cash earns the T-bill rate (C7)
Download and snapshot `^IRX`, lag it by one day, and credit interest on cash days in the backtest. Make Sharpe use excess returns. Test against a hand-computed two-week example.

## 5. Log-loss tuning and joint model × default selection (C5, C6)
Write `notebooks/v2_02_modeling.ipynb`: tune {LR, RF, HGB} on CV log loss, then select model × default on validation after-cost Sharpe. Freeze to `outputs/v2/frozen_config.json` before the test set is read.

## 6. Walk-forward 2013–2024 (§6.2)
Yearly refits of the frozen configuration. Reuse `src/research.py` where possible, and keep its gap test.

## 7. Block-bootstrap confidence intervals (§6.3)
Circular block bootstrap, block 20, 2,000 resamples, for the macro-F1 difference and the Sharpe difference vs Buy & Hold.

## 8. Random-timing benchmark (§6.4)
1,000 random paths with matched exposure and switch count, same costs. Report the strategy's percentile and plot the distribution.

## 9. Exit / entry attribution and write-up (§6.5)
A per-spell table and a chart. Then update `outputs/v2/report.md` and slide 14 of the presentation.
