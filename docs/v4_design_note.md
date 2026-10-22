# v4 design note — near-market return with a smaller drawdown

Module 3 Group 7 · written 2026-10-22, before any v4 code or result.

## The question

v1–v3 asked "which way will SPY move next week?". The data shows that the *size* of moves is predictable and their direction largely is not. v4 asks the question an investor would actually ask:

> **Can a weekly Buy / Hold / Sell model keep most of the S&P 500's return while cutting its worst losses?**

**Target:**
- at least **85% of buy-and-hold's annual return**;
- with the **smallest maximum drawdown**;
- while staying invested at least **70%** of the time.

## Design

| Part | v4 |
|---|---|
| **Optimal action (label)** | For the next 5 trading days (open t+1 → open t+6): **Sell** if the return is below **−2%** (a large loss); **Buy** if above **+1%**; otherwise **Hold**. Sell is reserved for losses worth avoiding. |
| **Features, data, splits** | Unchanged: 15 lagged features, train 2010–2020, a 6-day gap at boundaries and in cross-validation |
| **Models** | Logistic regression, random forest and gradient boosting. Each is tuned on 2010–2020 with `TimeSeriesSplit(5, gap=6)`, scored on log loss, with balanced class weights. |
| **Probabilities** | Prior correction (v3's C2): the class-weight distortion is undone, so P(Sell) is a real-world chance |
| **Decision (weekly)** | After the week's last close: **Sell → cash for the week** if P(Sell) ≥ τ; otherwise **invested** (Buy or Hold). The decision is re-made every week, so re-entry is as easy as exit. Fill at the next open. Cash earns the T-bill rate. |
| **Candidates** | 3 models × τ ∈ {0.20, 0.30, 0.40} |
| **Selection** | Yearly walk-forward over 2013–2022 (refit each January on all earlier labelled data; parameters fixed from the 2010–2020 tuning). Eligible: annual return ≥ 85% of buy-and-hold's **and** time invested ≥ 70%. Pick: the smallest max drawdown; ties → higher Sharpe. If none is eligible: highest Calmar (annual return ÷ max drawdown) among those invested ≥ 70%. |
| **Then** | Freeze, and report 2023–24, the full 2013–2024 walk-forward, and the 2025–26 holdout, with the same metrics and the random-timing benchmark as every other version |

## Deviations

_None yet._
