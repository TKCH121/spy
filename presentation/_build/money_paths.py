"""Re-create v1's $100k paths (frozen rule vs Buy & Hold) without vectorbt, for slide charts."""
import sys, json
import numpy as np, pandas as pd
repo = sys.argv[1]
px = pd.read_csv(f"{repo}/data/raw/spy_20261010.csv", index_col=0, parse_dates=True)
FEE, SLIP, CASH = 0.001, 0.0005, 100_000

def to_positions(actions, min_hold=5):
    pos, held, out = 0, 0, []
    for a in actions:
        target = 1 if a == 1 else (0 if a == -1 else pos)
        if target != pos and (pos == 0 or held >= min_hold):
            pos, held = target, 0
        held += 1
        out.append(pos)
    return np.array(out)

def simulate(pos_by_signal_day, prices):
    target = pd.Series(pos_by_signal_day, index=prices.index).shift(1).fillna(0)
    cash, sh, vals, fees, inmkt = CASH, 0.0, [], 0.0, []
    prev = 0
    for d, row in prices.iterrows():
        t = target.loc[d]
        if t == 1 and prev == 0:
            p = row.Open * (1 + SLIP); sh = cash / (p * (1 + FEE)); fees += sh * p * FEE; cash = 0
        elif t == 0 and prev == 1:
            p = row.Open * (1 - SLIP); v = sh * p; fees += v * FEE; cash = v * (1 - FEE); sh = 0
        prev = t
        vals.append(cash + sh * row.Close); inmkt.append(t)
    return pd.Series(vals, index=prices.index), fees, np.array(inmkt)

out = {}
for seg, f in [("test", "test_predictions.csv"), ("val", "val_predictions.csv")]:
    pr = pd.read_csv(f"{repo}/outputs/{f}", index_col=0, parse_dates=True)
    prices = px.loc[pr.index.min():pr.index.max()]
    model, fees, inm = simulate(to_positions(pr["action"].to_numpy()), prices)
    bh, bhfees, _ = simulate(np.ones(len(prices)), prices)
    # B&H enters at the first open (vectorbt benchmark): shift handled by forcing day-0 entry
    bh2 = []
    p0 = prices.Open.iloc[0] * (1 + SLIP); sh = CASH / (p0 * (1 + FEE))
    bh = pd.Series(sh * prices.Close.to_numpy(), index=prices.index)
    out[seg] = {"dates": [d.strftime("%Y-%m-%d") for d in prices.index],
                "model": model.round(0).tolist(), "bh": bh.round(0).tolist(),
                "model_final": round(model.iloc[-1]), "bh_final": round(bh.iloc[-1]),
                "model_fees": round(fees), "days_in": int(inm.sum()), "days": len(inm)}
    print(seg, out[seg]["model_final"], out[seg]["bh_final"], out[seg]["model_fees"], out[seg]["days_in"], out[seg]["days"])
json.dump(out, open(sys.argv[2], "w"))
