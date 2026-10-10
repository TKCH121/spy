"""Chronological train / validation / test split with an embargo.

A label at row t looks forward to the open of t+H+1. So the last H+1 rows of a period
have labels that peek into the next period; we drop them (the "embargo"). Inside the
training period, cross-validation uses TimeSeriesSplit with the same gap.
"""

import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

from spysignal.config import EMBARGO, TEST_START, TRAIN_END, VAL_END, VAL_START


def _drop_tail(mask: pd.Series, n: int) -> pd.Series:
    mask = mask.copy()
    mask.iloc[mask.to_numpy().nonzero()[0][-n:]] = False
    return mask


def split_masks(index: pd.DatetimeIndex, usable: pd.Series) -> dict[str, pd.Series]:
    """Boolean masks over `index`. `usable` = rows with complete features and a label.

    The embargo is applied on the full trading calendar first, so it is measured in
    trading days regardless of which rows are later dropped for missing values.
    """
    d = pd.Series(index, index=index)
    train = _drop_tail(d <= TRAIN_END, EMBARGO)
    val = _drop_tail((d >= VAL_START) & (d <= VAL_END), EMBARGO)
    test = d >= TEST_START
    return {name: m & usable for name, m in [("train", train), ("val", val), ("test", test)]}


def cv_splitter(n_splits: int = 5) -> TimeSeriesSplit:
    """Walk-forward CV for tuning, used on training rows only."""
    return TimeSeriesSplit(n_splits=n_splits, gap=EMBARGO)
