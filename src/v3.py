"""v3 (docs/v3_design_note.md): probability treatments C0-C3 for v2's frozen HGB, and the
yearly walk-forward that produces out-of-sample class probabilities for each of them.

The base model is v2's frozen HGB by default; the weekly rebuild (v3w) passes v2w's model.

C0  balanced class weights, raw probabilities (v2 as is; reference only)
C1  no class weights
C2  balanced weights, then prior correction p_k ∝ p̃_k · π_k (π = the fit's training class shares)
C3  balanced weights, then sigmoid calibration fitted on TimeSeriesSplit(5, gap=6) folds

Nothing here backtests: trading results belong to the next work item, after the
calibration report is committed (design note §5.1)."""

import json

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV

from src import config
from src.features import FEATURE_COLS
from src.models import make_pipeline
from src.split import make_cv

CANDIDATES = ("C0", "C1", "C2", "C3")
TRAIN_START = "2006-01-01"


def v2_params(path=None) -> dict:
    """v2's frozen HGB hyper-parameters (not re-tuned in v3)."""
    path = path or config.OUTPUT_DIR / "v2" / "frozen_config.json"
    return json.loads(path.read_text())["params"]


def prior_correct(proba: pd.DataFrame, priors: dict) -> pd.DataFrame:
    """Undo balanced class weighting: a model trained as if classes were equally common
    outputs p̃_k ∝ p(x|k); real-world odds are p_k ∝ p(x|k)·π_k ∝ p̃_k·π_k."""
    p = proba * pd.Series(priors)[proba.columns].to_numpy()
    return p.div(p.sum(axis=1), axis=0)


class Candidate:
    """Fit on one training window, then predict calibrated class probabilities."""

    def __init__(self, kind: str, params: dict, model: str = "HGB"):
        if kind not in CANDIDATES:
            raise ValueError(kind)
        self.kind, self.params, self.model = kind, params, model

    def _base(self, class_weight):
        return make_pipeline(self.model, class_weight=class_weight).set_params(**self.params)

    def fit(self, X: pd.DataFrame, y: pd.Series):
        y = y.astype(int)
        self.priors_ = y.value_counts(normalize=True).reindex(config.CLASSES).to_dict()
        if self.kind == "C1":
            self.model_ = self._base(None).fit(X, y)
        elif self.kind == "C3":
            self.model_ = CalibratedClassifierCV(
                self._base("balanced"), method="sigmoid", cv=make_cv(gap=config.V2_GAP)
            ).fit(X, y)
        else:  # C0, C2
            self.model_ = self._base("balanced").fit(X, y)
        return self

    def predict_proba(self, X: pd.DataFrame) -> pd.DataFrame:
        p = pd.DataFrame(self.model_.predict_proba(X), index=X.index, columns=self.model_.classes_)
        return prior_correct(p, self.priors_) if self.kind == "C2" else p


def training_window(ds: pd.DataFrame, year: int) -> pd.DataFrame:
    """Rows from TRAIN_START whose labels are known before `year` starts: labelled rows
    before Jan 1, minus the last V2_GAP rows (their open->open windows reach into `year`)."""
    hist = ds.loc[TRAIN_START : pd.Timestamp(f"{year}-01-01") - pd.Timedelta(days=1)]
    return hist.dropna(subset=["label"]).iloc[: -config.V2_GAP]


def walk_forward_proba(
    ds: pd.DataFrame, kind: str, years, params: dict, model: str = "HGB"
) -> pd.DataFrame:
    """Out-of-sample probabilities for every day of `years`, refitting each January.
    Adds the fit's training class shares (prior_*) and class mean forward returns (mu_*),
    both from the same training rows, so E[r] can be formed without reading later data."""
    out = []
    for year in years:
        hist = training_window(ds, year)
        days = ds.loc[f"{year}-01-01" : f"{year}-12-31"]
        if days.empty:
            continue
        cand = Candidate(kind, params, model).fit(hist[FEATURE_COLS], hist["label"])
        p = cand.predict_proba(days[FEATURE_COLS])
        mu = hist["r_fwd"].groupby(hist["label"].astype(int)).mean()
        for k in config.CLASSES:
            p[f"prior_{config.CLASS_NAMES[k]}"] = cand.priors_[k]
            p[f"mu_{config.CLASS_NAMES[k]}"] = mu[k]
        out.append(p)
    return pd.concat(out)


def expected_return(wf: pd.DataFrame) -> pd.Series:
    """E[r] = sum_k P_k * mu_k, using each row's own fit's class means."""
    return sum(wf[k] * wf[f"mu_{config.CLASS_NAMES[k]}"] for k in config.CLASSES)


# --- calibration diagnostics (design note §5.1) ------------------------------------------


def brier(proba: pd.DataFrame, y: pd.Series) -> float:
    """Multi-class Brier score: mean over rows of sum_k (p_k - 1[y = k])^2."""
    onehot = np.stack([(y.to_numpy() == k).astype(float) for k in config.CLASSES], axis=1)
    return float(((proba[config.CLASSES].to_numpy() - onehot) ** 2).sum(axis=1).mean())


def log_loss_multi(proba: pd.DataFrame, y: pd.Series) -> float:
    p = proba[config.CLASSES].to_numpy()
    idx = np.searchsorted(config.CLASSES, y.to_numpy().astype(int))
    return float(-np.log(np.clip(p[np.arange(len(p)), idx], 1e-15, 1)).mean())


def yearly_calibration(proba: pd.DataFrame, labels: pd.Series) -> pd.DataFrame:
    """Per calendar year: log loss, Brier, and mean predicted vs actual share of each class.
    Only labelled rows count."""
    df = proba.join(labels.rename("y")).dropna(subset=["y"])
    rows = []
    for year, g in df.groupby(df.index.year):
        y = g["y"].astype(int)
        row = {"year": year, "n": len(g), "log_loss": log_loss_multi(g, y), "brier": brier(g, y)}
        for k in config.CLASSES:
            name = config.CLASS_NAMES[k]
            row[f"pred_{name}"] = float(g[k].mean())
            row[f"actual_{name}"] = float((y == k).mean())
        row["sell_gap_pp"] = 100 * (row["pred_Sell"] - row["actual_Sell"])
        rows.append(row)
    return pd.DataFrame(rows).set_index("year")


def reliability(proba: pd.DataFrame, labels: pd.Series, k: int, bins: int = 10) -> pd.DataFrame:
    """Pooled reliability table for class k: rows grouped into equal-width bins of P(k)."""
    df = proba[[k]].join(labels.rename("y")).dropna(subset=["y"])
    df["bin"] = pd.cut(df[k], np.linspace(0, 1, bins + 1), include_lowest=True)
    t = df.groupby("bin", observed=True).agg(
        n=("y", "size"), mean_pred=(k, "mean"), actual=("y", lambda s: float((s == k).mean()))
    )
    return t


def calibration_passes(yearly: pd.DataFrame, tol_pp: float = 3.0, min_years: int = 8) -> bool:
    """Design note §5.1: |mean P(Sell) - actual Sell share| <= 3 pp in >= 8 of 10 years."""
    return int((yearly["sell_gap_pp"].abs() <= tol_pp).sum()) >= min_years
