"""Every project-wide choice in one place. Change it here, nowhere else."""

HORIZON = 5                  # predict the next 5 trading days
EMBARGO = HORIZON + 1        # rows dropped at each split boundary (label reaches open t+H+1)
HOLD_SHARE = 1 / 3           # k is fitted on train so ~1/3 of labels are Hold

DATA_START = "2005-01-01"    # extra history for 252-day feature warm-up; VIX3M starts mid-2006
TRAIN_END = "2020-12-31"
VAL_START, VAL_END = "2021-01-01", "2022-12-31"
TEST_START = "2023-01-01"    # test runs to the last downloaded day; touched once, at the end

FEE = 0.001                  # 0.1% of traded value per trade (fees + slippage)

TICKERS = {"spy": "SPY", "vix": "^VIX", "vix3m": "^VIX3M"}
