# SPY Buy / Sell / Hold — what we're doing and why

The assignment is graded on **method, not money**: no look-ahead, honest validation, and a
clear explanation of why the model (probably) loses to Buy & Hold after fees. Every choice
below is there to make that story clean and defensible.

## The plan in one paragraph

Every day at the close we predict whether SPY's next 5 trading days will be a **Buy**,
**Sell** or **Hold**, using about 15 features from prices, volatility, VIX and volume. We
trade on the **next day's open**, pay **0.1% per trade**, and compare the result to simply
holding SPY.

## Key decisions and why

| Decision | Why |
|---|---|
| **Predict at close t, trade at open t+1.** The label is the open(t+1) → open(t+6) return | You can't trade at the same close you used to compute the signal; that is quiet look-ahead. The label measures the return we could actually capture |
| **Volatility-scaled thresholds**, not a fixed ±1%. Buy if the 5-day return > k × expected 5-day move | With a fixed ±1%, calm years are almost all Hold and crisis years almost never are, so the model could "predict" Hold from volatility alone and look smart without any direction skill. Scaling makes Buy mean "a big move *for current conditions*". k is set on training data so about ⅓ of labels are Hold |
| **Splits:** train 2006–2020, validation 2021–22, test 2023+, with a **6-day gap** at each boundary | Random splits leak the future. The gap exists because a 5-day label near the end of training uses prices from the validation period |
| **Test set is touched once**, at the very end | Every look at the test set that changes a decision turns it into another training set |
| **Features are what systematic funds use**, built properly: volatility-scaled trend at 3 speeds, Bollinger-style z-score, realized volatility, VIX, VIX minus realized vol, VIX term structure | Named retail indicators (MACD 12/26/9, Bollinger 20/2) are fixed-parameter versions of these ideas. Scaled by volatility they mean the same thing in 2008 and 2017. They still cover the "≥ 3 technical indicators" requirement |
| **No VWAP feature** | Daily data has no real VWAP. Our approximation has a 0.99 correlation with price ÷ 20-day average (see EDA), so it adds nothing. VWAP is mainly used to judge trade execution, not to predict |
| **Class weights** for imbalance, not SMOTE | Buy > Sell because markets drift up. SMOTE creates fake days by blending real ones from different times, which doesn't make sense for time series |
| **Models: Dummy → Logistic → Random Forest → XGBoost** | The assignment asks for interpretable models. The Dummy baseline shows what "no skill" scores |
| **Hold = keep your current position** in the backtest | Otherwise the model churns in and out and fees eat everything |
| **Judge by macro F1 / balanced accuracy, not accuracy** | Accuracy rewards always predicting the biggest class. About 0.35–0.40 is normal; much higher means a leak |

## How we check for leakage (`tests/test_leakage.py`)

- **Truncation test:** features for day t are identical whether or not later data exists.
- **Label test:** changing any price after the label window doesn't change the label.
- **Split test:** no training label overlaps validation or test.
- **Backtest test:** a signal at close t trades at open t+1, and fees are charged on every trade.
- **Shuffled-label test** (modeling notebook): train on scrambled labels → score must drop to chance.

## Status

- [x] Data, features, labels, splits, backtest code + leakage tests (11 passing)
- [x] `01_eda.ipynb` — runs end to end (dev period only)
- [x] `02_modeling.ipynb` — walk-forward CV baseline runs. First result: models about 0.39 balanced accuracy vs 0.33 for Dummy; shuffled labels give 0.32
- [ ] Hyperparameter tuning (small grids, training CV only)
- [ ] Validation check, incl. splitting the result into "Hold vs move" and "Buy vs Sell"
- [ ] Final test + vectorbt backtest vs Buy & Hold (once)
- [ ] Lessons learned

## Layout & setup

```
spysignal/   config.py (every setting) · data.py · features.py · labels.py · splits.py · backtest.py
notebooks/   01_eda.ipynb · 02_modeling.ipynb
tests/       test_leakage.py
```

```bash
pip install -e ".[dev]"
python -c "from spysignal import data; data.download()"   # writes data/raw.csv
pytest
```

`data.download()` re-fetches from Yahoo, so the numbers can shift slightly over time.
Download once and share the same `data/raw.csv` across the group.
