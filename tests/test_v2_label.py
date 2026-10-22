"""v2 work item 1: the execution-aligned label and the gap it needs."""

import numpy as np
import pytest

from src import config
from src.dataset import build_dataset_v2
from src.split import get_segments, make_cv, train_val_combined

LOOK = config.LABEL_LOOKAHEAD[config.V2_LABEL_KIND]


@pytest.fixture(scope="module")
def ds(synthetic_ohlcv):
    return build_dataset_v2(synthetic_ohlcv)


def test_v2_label_is_open_to_open(synthetic_ohlcv, ds):
    o = synthetic_ohlcv["Open"]
    expected = (o.shift(-6) / o.shift(-1) - 1).reindex(ds.index)
    assert np.allclose(ds["r_fwd"].dropna(), expected.dropna())
    assert ds["label"].iloc[-LOOK:].isna().all()
    assert ds["label"].iloc[:-LOOK].notna().all()


def test_v2_label_reads_only_open_t1_and_t6(synthetic_ohlcv):
    p = 3000  # any row well inside the sample
    base = build_dataset_v2(synthetic_ohlcv)["r_fwd"]
    day = synthetic_ohlcv.index[p]

    def r_after_shock(col, offset):
        raw = synthetic_ohlcv.copy()
        raw.iloc[p + offset, raw.columns.get_loc(col)] *= 1.5
        return build_dataset_v2(raw)["r_fwd"].loc[day]

    for offset in (1, 6):
        assert not np.isclose(r_after_shock("Open", offset), base.loc[day])
    for offset in (-1, 0, 2, 3, 4, 5, 7):
        assert np.isclose(r_after_shock("Open", offset), base.loc[day])
    for col in ("Close", "High", "Low", "Volume"):
        for offset in range(0, 8):
            assert np.isclose(r_after_shock(col, offset), base.loc[day])


def test_v1_gap_is_too_short_for_the_open_label(ds):
    # With the v1 gap (5), the last training label reads the first validation open.
    segs = get_segments(ds, gap=config.GAP)
    end = ds.index.get_loc(segs["train"].index.max())
    start = ds.index.get_loc(segs["val"].index.min())
    assert end + LOOK >= start


def test_v2_segments_end_before_next_label_window(ds):
    segs = get_segments(ds, gap=config.V2_GAP, include_test=True)
    for a, b in [("train", "val"), ("val", "test")]:
        end = ds.index.get_loc(segs[a].index.max())
        start = ds.index.get_loc(segs[b].index.min())
        assert end + LOOK < start
    tv = train_val_combined(ds, gap=config.V2_GAP)
    assert ds.index.get_loc(tv.index.max()) + LOOK < ds.index.get_loc(segs["test"].index.min())


def test_v2_cv_folds_clear_the_open_label(ds):
    train = get_segments(ds, gap=config.V2_GAP)["train"]
    for tr, va in make_cv(gap=config.V2_GAP).split(train):
        assert tr.max() + LOOK < va.min()
