"""v3 work item 1 (docs/v3_design_note.md §7): probability treatments and their walk-forward."""

import numpy as np
import pandas as pd
import pytest

from src import config, v3
from src.dataset import build_dataset_v2
from src.features import FEATURE_COLS

PARAMS = {
    "clf__max_iter": 30,
    "clf__max_depth": 3,
    "clf__min_samples_leaf": 50,
    "clf__learning_rate": 0.05,
    "clf__l2_regularization": 0.1,
}


@pytest.fixture(scope="module")
def ds(synthetic_ohlcv):
    return build_dataset_v2(synthetic_ohlcv)


def test_prior_correction_is_exact_for_known_reweighting():
    # p̃ = posterior under equal priors; correcting with the true priors must recover
    # the posterior under those priors, computed directly from the likelihoods.
    lik = pd.DataFrame({-1: [0.2, 0.5, 0.1], 0: [0.5, 0.3, 0.6], 1: [0.3, 0.2, 0.3]})
    priors = {-1: 0.2, 0: 0.45, 1: 0.35}
    p_equal = lik.div(lik.sum(axis=1), axis=0)
    expected = lik * pd.Series(priors)
    expected = expected.div(expected.sum(axis=1), axis=0)
    got = v3.prior_correct(p_equal, priors)
    assert np.allclose(got.to_numpy(), expected.to_numpy())
    assert np.allclose(got.sum(axis=1), 1)


def test_prior_correction_lowers_inflated_minority_odds():
    p = pd.DataFrame({-1: [1 / 3], 0: [1 / 3], 1: [1 / 3]})
    got = v3.prior_correct(p, {-1: 0.2, 0: 0.45, 1: 0.35})
    assert np.isclose(got.loc[0, -1], 0.2) and np.isclose(got.loc[0, 0], 0.45)


def test_calibration_folds_respect_the_gap(ds):
    hist = v3.training_window(ds, 2016)
    cand = v3.Candidate("C3", PARAMS).fit(hist[FEATURE_COLS], hist["label"])
    cv = cand.model_.cv
    assert cv.gap == config.V2_GAP
    for tr, te in cv.split(hist):
        assert tr.max() + config.LABEL_LOOKAHEAD["open"] < te.min()


def test_training_window_ends_before_the_label_reaches_the_year(ds):
    for year in (2015, 2020):
        hist = v3.training_window(ds, year)
        first = ds.index.get_loc(ds.loc[f"{year}-01-01" :].index.min())
        assert ds.index.get_loc(hist.index.max()) + config.LABEL_LOOKAHEAD["open"] < first


@pytest.mark.parametrize("kind", v3.CANDIDATES)
def test_walk_forward_never_reads_labels_after_its_window(ds, kind):
    base = v3.walk_forward_proba(ds, kind, [2016], PARAMS)
    # scramble every label that a 2016 fit must not see: the last gap rows before 2016 and later
    cut = ds.index.get_loc(v3.training_window(ds, 2016).index.max()) + 1
    shuffled = ds.copy()
    rng = np.random.default_rng(0)
    tail = shuffled.iloc[cut:]
    shuffled.loc[tail.index, "label"] = rng.choice(config.CLASSES, size=len(tail)).astype(float)
    shuffled.loc[tail.index, "r_fwd"] = rng.normal(0, 0.05, size=len(tail))
    again = v3.walk_forward_proba(shuffled, kind, [2016], PARAMS)
    assert np.allclose(base[config.CLASSES].to_numpy(), again[config.CLASSES].to_numpy())
    mu_cols = [f"mu_{n}" for n in config.CLASS_NAMES.values()]
    assert np.allclose(base[mu_cols].to_numpy(), again[mu_cols].to_numpy())
    assert np.allclose(v3.expected_return(base), v3.expected_return(again))


def test_probabilities_are_valid(ds):
    for kind in v3.CANDIDATES:
        p = v3.walk_forward_proba(ds, kind, [2016], PARAMS)[config.CLASSES]
        assert (p.to_numpy() >= 0).all() and np.allclose(p.sum(axis=1), 1)


def test_calibration_diagnostics():
    y = pd.Series([1, 0, -1, 0], index=pd.date_range("2015-01-01", periods=4))
    p = pd.DataFrame(
        {-1: [0.0, 0.0, 1.0, 0.0], 0: [0.0, 1.0, 0.0, 1.0], 1: [1.0, 0.0, 0.0, 0.0]}, index=y.index
    )
    assert np.isclose(v3.brier(p, y), 0.0)
    flat = pd.DataFrame(1 / 3, index=y.index, columns=config.CLASSES)
    assert np.isclose(v3.log_loss_multi(flat, y), np.log(3))
    yr = v3.yearly_calibration(flat, y)
    assert np.isclose(yr.loc[2015, "sell_gap_pp"], 100 * (1 / 3 - 0.25))


def test_calibration_pass_rule():
    gaps = pd.DataFrame({"sell_gap_pp": [1, -2, 2.9, 0, 3.0, -1, 0.5, 2, 5, -6]})
    assert v3.calibration_passes(gaps)
    gaps.loc[0, "sell_gap_pp"] = 4
    assert not v3.calibration_passes(gaps)


def test_unknown_candidate_rejected():
    with pytest.raises(ValueError):
        v3.Candidate("C9", PARAMS)


def test_candidates_work_with_logistic_regression(ds):
    lr = {"clf__C": 0.01}
    for kind in v3.CANDIDATES:
        p = v3.walk_forward_proba(ds, kind, [2016], lr, model="LR")[config.CLASSES]
        assert (p.to_numpy() >= 0).all() and np.allclose(p.sum(axis=1), 1)
