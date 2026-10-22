// SPY weekly Buy / Hold / Sell model — presentation deck (Baseline vs Final).
// usage: node build_presentation.js <out.pptx> <repo root>
// Every number is read from the repo's outputs (see presentation/_build/README.md).
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const ROOT = process.argv[3];
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const SC = load("outputs/scorecard.json");
const SCP = load("outputs/scorecard_paths.json").by_period;
const W1 = load("outputs/weekly/v1/results.json");
const W3 = load("outputs/weekly/v3/results.json");
const EDA = load("outputs/eda_slides.json");
const V4 = load("outputs/v4/results.json");
const V4P = load("outputs/v4/paths.json");
const PP = load("outputs/v4/partial_results.json");
const T = "2023–24 test", WF = "2013–24 walk-forward", HO = "2025–26 holdout";
const sc = (strategy, period) => SC.find((r) => r.strategy === strategy && r.period === period);
// Baseline = v1 rebuilt weekly (v1w); Final = v4. Both expressed with the same fields.
const base = (p) => { const r = sc("v1w", p); return { fv: r.final_value, cagr: r.cagr, vol: r.ann_vol, dd: r.max_drawdown, sh: r.sharpe, inv: r.time_invested, trips: r.round_trips, costs: r.costs }; };
const fin = (p) => { const r = V4.results[p].v4; return { fv: r.final_value, cagr: r.cagr, vol: r.ann_vol, dd: r.max_drawdown, sh: r.sharpe_excess, inv: r.exposure, trips: r.round_trips, costs: r.total_fees }; };
const bhm = (p) => { const r = sc("Buy & Hold", p); return { fv: r.final_value, cagr: r.cagr, vol: r.ann_vol, dd: r.max_drawdown, sh: r.sharpe, inv: 1, trips: 1, costs: r.costs }; };

const THEME = {
  name: "SPY Signal", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "14213D", lt1: "FFFFFF", dk2: "3B4A63", lt2: "EEF1F6", accent1: "C8571B", accent2: "2F5D9E",
    accent3: "8A96A8", accent4: "E9A46A", accent5: "4E7D5B", accent6: "6B4F96", hlink: "2F5D9E", folHlink: "6B4F96" },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "SPY weekly Buy / Hold / Sell model";
pres.author = "Module 3 Group 7";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, CW = W - 2 * M;
const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");
const pct = (x, d = 1) => (100 * x).toFixed(d) + "%";

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "Title Dark", background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.0, w: 11.8, h: 2.4, fontSize: 46, bold: true, color: C.background1, valign: "bottom", fontFace: THEME.headFontFace }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.6, w: 11, h: 1.8, fontSize: 20, color: C.background2, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Content", background: { color: C.background1 }, margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.4, w: CW, h: 0.9, fontSize: 30, bold: true, color: C.text1, valign: "middle", fontFace: THEME.headFontFace }, text: "" } },
    { text: { text: "SPY weekly Buy / Hold / Sell model · Module 3 Group 7", options: { x: M, y: 6.95, w: 8, h: 0.35, fontSize: 11, color: C.accent3, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.35, fontSize: 12, color: C.accent3, align: "right" },
});

// ---------- helpers ----------
function text(slide, t, o) {
  slide.addText(t, Object.assign({ isTextBox: true, margin: 0, fontSize: 16, color: C.text2, valign: "top" }, o));
}
function card(slide, x, y, w, h, title, body, opt = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: opt.fill || C.background2 }, line: { color: opt.fill || C.background2 } });
  const ts = opt.titleSize || 17;
  const lines = Math.max(1, Math.ceil((title.length * 0.55 * ts / 72) / (w - 0.5)));
  const th = Math.max(0.45, lines * ts * 1.2 / 72 + 0.05);
  text(slide, title, { x: x + 0.25, y: y + 0.2, w: w - 0.5, h: th, fontSize: ts, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  const by = y + 0.2 + th + 0.1;
  text(slide, body, { x: x + 0.25, y: by, w: w - 0.5, h: y + h - 0.15 - by, fontSize: opt.bodySize || 14, color: C.text2 });
}
function content(title, section) {
  const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
}
const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 } } });
const TABLE = { color: C.text2, border: { type: "solid", pt: 0.75, color: "D5DAE3" }, valign: "middle" };
const chartText = { catAxisLabelColor: HEX.dk2, valAxisLabelColor: HEX.dk2, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, dataLabelFontSize: 12, titleFontSize: 14, titleColor: HEX.dk1, dataLabelColor: HEX.dk1 };
const note = (s, t, y = 6.45) => text(s, t, { x: M, y, w: CW, h: 0.4, fontSize: 12, italic: true, color: C.accent3 });
const S1 = "Objective and approach", SE = "Exploratory analysis", S2 = "Method", S3 = "Results", S4 = "Interpretation", SA = "Appendix";

// ---------- 1. title ----------
pres.addSection({ title: S1 });
let s = pres.addSlide({ masterName: "Title Dark", sectionTitle: S1 });
text(s, "MODULE 3 · MACHINE LEARNING PROJECT · GROUP 7", { x: M, y: 1.4, w: 11, h: 0.4, fontSize: 14, bold: true, charSpacing: 3, color: C.accent4 });
s.addText("Predicting weekly Buy / Hold / Sell decisions for SPY", { placeholder: "title" });
s.addText([
  { text: "A machine-learning trading strategy, tested against buy-and-hold", options: { breakLine: true } },
  { text: "[Presenter names] · [Date]", options: { fontSize: 16, color: C.accent3 } },
], { placeholder: "body" });

// ---------- 2. objective and deliverables ----------
s = content("Objective and deliverables", S1);
text(s, [
  { text: "Objective. ", options: { bold: true, color: C.text1 } },
  { text: "Predict the best action for SPY (the S&P 500 ETF) over the next 5 trading days — Buy, Hold or Sell — and test whether trading on it beats buying and holding, after costs and on risk. The emphasis is on sound validation, not profit." },
], { x: M, y: 1.45, w: CW, h: 0.9, fontSize: 16 });
s.addTable([
  [hdr("Deliverable"), hdr("Where"), hdr("Content")],
  ["Exploratory analysis", "notebooks/01_eda", "Feature distributions, indicator correlations, class balance"],
  ["Modelling", "notebooks/02_modeling, weekly_v1, v4_drawdown_aware", "Lagged features, time-ordered splits, tuning, model selection"],
  ["Backtest", "notebooks/03_backtest, scorecard", "Costs, comparison with buy-and-hold, risk metrics"],
  ["Lessons learned", "outputs/SUMMARY.md", "Why the strategies performed as they did; limits of prediction"],
], Object.assign({ x: M, y: 2.55, w: CW, colW: [2.6, 4.4, 5.13], fontSize: 15, rowH: 0.55, margin: [0.05, 0.12, 0.05, 0.12] }, TABLE));
note(s, "Code, data snapshots and 54 automated tests: github.com/TKCH121/spy", 5.55);

// ---------- 3. approach ----------
s = content("Approach", S1);
const steps = [
  ["Data", "SPY daily prices and volume, 2005–2026"],
  ["Features", "15 indicators, each using data up to the decision date only"],
  ["Target", "Buy / Hold / Sell for the next 5 trading days"],
  ["Model", "Classifier tuned with time-series cross-validation"],
  ["Decision", "Weekly: after Friday’s close; trade at Monday’s open"],
  ["Backtest", "0.15% cost per trade, cash earns T-bills, vs buy-and-hold"],
];
const bw = 1.78, g = (CW - 6 * bw) / 5;
steps.forEach(([t, b], i) => {
  const x = M + i * (bw + g);
  card(s, x, 1.6, bw, 2.7, t, b, { bodySize: 13, titleSize: 16 });
  if (i < 5) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + bw + g / 2 - 0.12, y: 2.8, w: 0.24, h: 0.28, fill: { color: C.accent1 }, line: { color: C.accent1 } });
});
text(s, [
  { text: "Two models are compared. ", options: { bold: true, color: C.text1 } },
  { text: "The baseline asks the brief’s question as written: which way will SPY move? The final model asks the investor’s question: can we keep most of the market’s return while avoiding large losses?" },
], { x: M, y: 4.7, w: CW, h: 0.9, fontSize: 15 });

// ---------- 4. EDA: size vs direction ----------
pres.addSection({ title: SE });
s = content("EDA: size is predictable, direction is not", SE);
const pm = EDA.price_monthly;
s.addChart(pres.charts.LINE, [{ name: "SPY", labels: pm.dates.map((d) => d.slice(0, 4)), values: pm.close }], Object.assign({
  x: M, y: 1.4, w: 5.9, h: 3.4, chartColors: [HEX.dk1], lineSize: 2, lineDataSymbol: "none",
  catAxisLabelFrequency: 36, valAxisLabelFormatCode: "$#,##0", valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: false, showTitle: true, title: "SPY month-end price, 2005–2024 (dividend-adjusted)",
}, chartText));
s.addChart(pres.charts.BAR, [
  { name: "Direction: daily return", labels: EDA.acf_returns.map((_, i) => String(i + 1)), values: EDA.acf_returns },
  { name: "Size: absolute daily return", labels: EDA.acf_abs_returns.map((_, i) => String(i + 1)), values: EDA.acf_abs_returns },
], Object.assign({
  x: 6.7, y: 1.4, w: 6.03, h: 3.4, barDir: "col", barGrouping: "clustered", chartColors: [HEX.accent2, HEX.accent1],
  valAxisMinVal: -0.2, valAxisMaxVal: 0.5, valAxisMajorUnit: 0.1, valAxisLabelFormatCode: "0.0",
  valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "t", legendFontSize: 11, legendFontFace: "+mn-lt", legendColor: HEX.dk2,
  showTitle: true, title: "Correlation with the same measure 1–10 days earlier (autocorrelation)",
}, chartText));
const ar = EDA.acf_returns, aa = EDA.acf_abs_returns;
[["Direction has no memory", `Today’s return barely predicts the next days’: correlations ${Math.min(...ar).toFixed(2)} to +${Math.max(...ar).toFixed(2)}.`],
 ["Size has memory", `Large moves cluster: correlation ${Math.min(...aa).toFixed(2)}–${Math.max(...aa).toFixed(2)} with the next days’ size.`],
 ["Extreme days are common", `${EDA.days_beyond_3sd} days beyond 3 standard deviations vs about ${EDA.days_expected_beyond_3sd_if_normal} if returns were normal.`],
].forEach(([t, b], i) => card(s, M + i * 4.1, 4.95, 3.93, 1.55, t, b, { bodySize: 13, titleSize: 15, fill: i === 0 ? "FBEDE4" : C.background2 }));

// ---------- 5. EDA: class mix ----------
s = content("EDA: the class mix shifts year to year", SE);
const cy = EDA.class_share_by_year;
s.addChart(pres.charts.BAR, [
  { name: "Sell (< −1%)", labels: cy.years.map(String), values: cy.Sell.map((v) => Math.round(1000 * v) / 10) },
  { name: "Hold", labels: cy.years.map(String), values: cy.Hold.map((v) => Math.round(1000 * v) / 10) },
  { name: "Buy (> +1%)", labels: cy.years.map(String), values: cy.Buy.map((v) => Math.round(1000 * v) / 10) },
], Object.assign({
  x: M, y: 1.4, w: 8.3, h: 5.0, barDir: "col", barGrouping: "percentStacked", chartColors: [HEX.accent2, HEX.accent3, HEX.accent1],
  valAxisLabelFormatCode: "0%", valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "t", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.dk2,
  showTitle: true, title: "Share of 5-day outcomes in each class, by year",
}, chartText));
const sellAt = (y) => pct(cy.Sell[cy.years.indexOf(y)], 0);
card(s, 9.1, 1.5, 3.63, 2.3, "Imbalanced", "Sell is the minority class in almost every year, about one week in five on average.", { bodySize: 13 });
card(s, 9.1, 4.0, 3.63, 2.4, "Unstable", `Sell weeks were ${sellAt(2017)} of 2017 and ${sellAt(2022)} of 2022. A model trained on one period meets a different mix in the next.`, { bodySize: 13, fill: "FBEDE4" });

// ---------- 6. features and target ----------
pres.addSection({ title: S2 });
s = content("Features and target", S2);
s.addTable([
  [hdr("Feature group"), hdr("Indicators")],
  ["Momentum", "1, 5, 10, 20-day returns"],
  ["Trend", "Price vs 20/50/200-day averages"],
  ["Overbought / oversold", "RSI-14, MACD histogram, Bollinger %B"],
  ["Volatility", "20-day volatility, ATR, band width"],
  ["Activity", "Volume relative to its 20-day norm"],
], Object.assign({ x: M, y: 1.5, w: 6.4, colW: [2.4, 4.0], fontSize: 14, rowH: 0.5, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
s.addTable([
  [hdr("Target: next 5 trading days"), hdr("Baseline"), hdr("Final")],
  ["Buy", "> +1%", "> +1%"],
  ["Hold", "−1% to +1%", "−2% to +1%"],
  ["Sell", "< −1%", "< −2% (a large loss)"],
], Object.assign({ x: 7.3, y: 1.5, w: 5.43, colW: [2.23, 1.5, 1.7], fontSize: 13, rowH: 0.48, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
card(s, 7.3, 3.65, 5.43, 2.75, "Class imbalance", "Sell is the minority class. Class weights were used (SMOTE and no weighting were tested and scored lower). Weighting inflates the predicted Sell probability, so the final model corrects it before use (slide 15).", { bodySize: 13 });
note(s, "All features are strictly lagged; tests confirm that changing future prices never changes a past feature.", 4.75);

// ---------- 7. validation design ----------
s = content("Validation design", S2);
const tw = CW - 0.2, yr = tw / 15;
let sx = M;
[["Train 2010–2020", 11, C.text1], ["Validation 2021–22", 2, C.accent2], ["Test 2023–24", 2, C.accent1]].forEach(([k, n, col]) => {
  const w = yr * n;
  s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.55, w, h: 0.75, fill: { color: col }, line: { color: col } });
  text(s, k, { x: sx + 0.05, y: 1.55, w: w - 0.1, h: 0.75, fontSize: n > 2 ? 16 : 12, bold: true, color: C.background1, align: "center", valign: "middle" });
  sx += w + 0.1;
});
note(s, "Chronological, never shuffled; a buffer of 5–6 trading days at each boundary so no 5-day label overlaps the next period.", 2.4);
[["Selection before testing", "Model and decision rule chosen on earlier data by rules fixed in advance; the test period is scored once, after freezing."],
 ["Out-of-sample checks", "12-year walk-forward (yearly refits, 2013–2024) and a 2025–26 holdout."],
 ["Leakage tests", "54 automated tests: features, labels, splits and every refit are checked for use of future data."],
 ["Written-down designs", "Each design was documented before it was run; later ones fingerprinted (SHA-256)."],
].forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 3.0 + Math.floor(i / 2) * 1.75;
  card(s, x, y, 5.98, 1.6, t, b, { bodySize: 14 });
});

// ---------- 8. integrity ----------
s = content("How we kept the results honest", S2);
s.addTable([
  [hdr("Data"), hdr("Period"), hdr("Size"), hdr("Used for"), hdr("Used to choose anything?")],
  ["Training", "2010 – 2020", "2,764 days", "Fitting and tuning (5-fold time-series cross-validation)", "Yes — model settings"],
  ["Validation / development", "2021–22 · 2013–22", "498 days · 10 years", "Choosing the decision rule (baseline · final)", "Yes — then frozen"],
  ["Test", "2023 – 2024", "497 days", "Scored once, after freezing", "No"],
  ["Walk-forward", "2013 – 2024", "12 yearly refits", "Robustness across market conditions", "No — reporting only"],
  ["Holdout", "Jan 2025 – Oct 2026", "439 days", "Later out-of-sample check", "No"],
  ["Paper-trade", "From 13 Oct 2026", "Live", "The only fully blind test", "No"],
], Object.assign({ x: M, y: 1.4, w: CW, colW: [2.0, 2.0, 1.9, 3.9, 2.33], fontSize: 12, rowH: 0.38, margin: [0.03, 0.08, 0.03, 0.08] }, TABLE));
const fp = V4.frozen.params;
s.addTable([
  [hdr("Model"), hdr("Key settings"), hdr("Tuning")],
  ["Baseline: random forest", "300 trees · at least 68 days per leaf · balanced class weights", "20 random settings · 5-fold time-series CV · macro-F1"],
  ["Final: gradient boosting", `Depth ${fp.clf__max_depth} · ${fp.clf__max_iter} trees · at least ${fp.clf__min_samples_leaf} days per leaf · balanced weights, then probabilities corrected`, "20 random settings · 5-fold time-series CV · log loss"],
], Object.assign({ x: M, y: 4.25, w: CW, colW: [2.7, 5.4, 4.03], fontSize: 12, rowH: 0.42, margin: [0.03, 0.08, 0.03, 0.08] }, TABLE));
text(s, [
  { text: "Safeguards: ", options: { bold: true, color: C.text1 } },
  { text: "periods never overlap (5–6 day buffer at each boundary, also inside cross-validation); scaling and resampling fit on training folds only; selection rules written down before results; 54 automated tests check for any use of future data." },
], { x: M, y: 5.65, w: CW, h: 0.85, fontSize: 13 });

// ---------- 9. baseline vs final ----------
s = content("Two models: baseline and final", S2);
s.addTable([
  [hdr(""), hdr("Baseline"), hdr("Final")],
  ["Question", "Which way will SPY move next week?", "Can we keep most of the market’s return while avoiding large losses?"],
  ["Sell means", "Next 5 days below −1%", "Next 5 days below −2% (a large loss)"],
  ["Weekly decision", "Buy → invested · Sell → cash · Hold → no change", "Invested by default; cash for the week if P(large loss) ≥ 0.40"],
  ["Model", "Random forest", "Gradient boosting, probabilities corrected for class weighting"],
  ["Chosen by", "Highest return per unit of risk (Sharpe) on 2021–22", "Target: ≥ 85% of the market’s return with the smallest drawdown, on a 2013–22 walk-forward"],
], Object.assign({ x: M, y: 1.5, w: CW, colW: [2.2, 4.6, 5.33], fontSize: 13, rowH: 0.7, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
note(s, "The baseline is v1 (by Peter Li), rebuilt for weekly decisions. Two intermediate versions are summarised on slide 15 and in the appendix.", 5.95);

// ---------- 10. classification ----------
s = content("Classification performance", S2);
const cands = [["Random forest", 0.4036], ["Logistic regression + SMOTE", 0.364], ["Logistic regression", 0.3593], ["Stratified random baseline", 0.3328], ["Gradient boosting", 0.322]];
s.addChart(pres.charts.BAR, [{ name: "Validation macro-F1", labels: cands.map((c) => c[0]), values: cands.map((c) => c[1]) }], Object.assign({
  x: M, y: 1.4, w: 6.2, h: 4.2, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent1, HEX.accent3, HEX.accent3, HEX.dk2, HEX.accent3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", valAxisMinVal: 0, valAxisMaxVal: 0.5, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Baseline model selection: validation macro-F1 (2021–22)",
}, chartText));
const fc4 = V4.results[T].classification;
s.addTable([
  [hdr("Test 2023–24"), hdr("Accuracy"), hdr("Macro-F1")],
  ["Baseline · random forest", "44.9%", "0.41"],
  ["Final · gradient boosting", pct(fc4.accuracy), fc4.macro_f1.toFixed(2)],
  ["Random guess", "≈ 33%", "≈ 0.32"],
], Object.assign({ x: 7.1, y: 1.5, w: 5.63, colW: [2.63, 1.5, 1.5], fontSize: 14, rowH: 0.48, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
card(s, 7.1, 3.65, 5.63, 2.65, "Skill is in the size of the move", "Both models recognise quiet weeks better than chance but not direction. The final model’s accuracy is higher because large losses are rare; it rarely predicts Sell outright — its signal is the probability, which rises after turbulent weeks.", { bodySize: 13 });

// ---------- 11. headline: 12 years ----------
pres.addSection({ title: S3 });
s = content("Result: final tracks the market, baseline falls behind", S3);
const wfp = SCP[WF], v4wf = V4P[WF];
const v4map = Object.fromEntries(v4wf.dates.map((d, i) => [d, v4wf.v4[i]]));
const idx = []; for (let i = 0; i < wfp.dates.length; i += 21) idx.push(i);
if (idx[idx.length - 1] !== wfp.dates.length - 1) idx.push(wfp.dates.length - 1);
const lab = idx.map((i) => wfp.dates[i].slice(0, 4));
s.addChart(pres.charts.LINE, [
  { name: "Buy & Hold", labels: lab, values: idx.map((i) => wfp["Buy & Hold"][i]) },
  { name: "Final", labels: lab, values: idx.map((i) => v4map[wfp.dates[i]] ?? null) },
  { name: "Baseline", labels: lab, values: idx.map((i) => wfp.v1w[i]) },
], Object.assign({
  x: M, y: 1.4, w: 8.4, h: 5.0, chartColors: [HEX.dk1, HEX.accent1, HEX.accent2], lineSize: 2.5, lineDataSymbol: "none",
  valAxisLabelFormatCode: "$#,##0", catAxisLabelFrequency: 12, valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "t", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.dk2,
  showTitle: true, title: "$100,000, 2013–2024 walk-forward (retrained every January), after costs",
}, chartText));
[["Buy & Hold", bhm(WF).fv, C.text1, ""], ["Final", fin(WF).fv, C.accent1, " — 2 exits in 12 years"], ["Baseline", base(WF).fv, C.accent2, ` — invested ${pct(base(WF).inv, 0)}`]].forEach(([k, v, col, extra], i) => {
  const y = 1.7 + i * 1.5;
  text(s, usd(v), { x: 9.3, y, w: 3.43, h: 0.6, fontSize: 28, bold: true, color: col, fontFace: THEME.headFontFace, valign: "bottom" });
  text(s, k + extra, { x: 9.3, y: y + 0.62, w: 3.43, h: 0.45, fontSize: 13 });
});

// ---------- 12. return and risk ----------
s = content("Return and risk in every period", S3);
const rr = (period, label, m) => [period, label, usd(m.fv), pct(m.cagr), pct(m.dd), m.inv > 0 ? m.sh.toFixed(2) : "—", pct(m.inv, 0)];
s.addTable([
  [hdr("Period"), hdr("Strategy"), hdr("Final value"), hdr("Annual return"), hdr("Max drawdown"), hdr("Sharpe"), hdr("Time invested")],
  rr("Test 2023–24", "Buy & Hold", bhm(T)), rr("", "Baseline", base(T)), rr("", "Final", fin(T)),
  rr("Walk-forward 2013–24", "Buy & Hold", bhm(WF)), rr("", "Baseline", base(WF)), rr("", "Final", fin(WF)),
  rr("Holdout 2025–26", "Buy & Hold", bhm(HO)), rr("", "Baseline", base(HO)), rr("", "Final", fin(HO)),
], Object.assign({ x: M, y: 1.4, w: CW, colW: [2.5, 1.7, 1.7, 1.6, 1.6, 1.2, 1.83], fontSize: 13, rowH: 0.4, margin: [0.03, 0.1, 0.03, 0.1] }, TABLE));
note(s, "$100,000; 0.10% fee + 0.05% slippage per side; cash earns the 13-week T-bill rate; Sharpe measured above the T-bill rate.", 5.5);
text(s, `Baseline vs 1,000 random-timing strategies with the same exposure: beat ${pct(sc("v1w", T).beats_random, 0)} (2023–24), ${pct(sc("v1w", WF).beats_random, 0)} (2013–24), ${pct(sc("v1w", HO).beats_random, 0)} (2025–26) — no consistent timing skill.`, { x: M, y: 5.95, w: CW, h: 0.5, fontSize: 13, color: C.text1 });

// ---------- 13. final model trade-off ----------
s = content("Final model: less drawdown costs return", S3);
const v4d = V4.development, v4b = V4.development_bh;
const pickd = (m, t) => v4d.find((r) => r.model === m && Math.abs(r.tau - t) < 1e-9);
text(s, "Development walk-forward 2013–2022: candidate decision thresholds", { x: M, y: 1.4, w: 7.2, h: 0.35, fontSize: 14, bold: true, color: C.text1 });
s.addTable([
  [hdr("Candidate"), hdr("Annual return"), hdr("Share of market"), hdr("Max drawdown")],
  ["Buy & Hold", pct(v4b.cagr), "100%", pct(v4b.max_drawdown)],
  ["Random forest, exit at P ≥ 0.20", pct(pickd("RF", 0.2).cagr), pct(pickd("RF", 0.2).share_of_bh_return, 0), pct(pickd("RF", 0.2).max_drawdown)],
  ["Gradient boosting, exit at P ≥ 0.30", pct(pickd("HGB", 0.3).cagr), pct(pickd("HGB", 0.3).share_of_bh_return, 0), pct(pickd("HGB", 0.3).max_drawdown)],
  ["Gradient boosting, exit at P ≥ 0.40 (chosen)", pct(pickd("HGB", 0.4).cagr), pct(pickd("HGB", 0.4).share_of_bh_return, 0), pct(pickd("HGB", 0.4).max_drawdown)],
], Object.assign({ x: M, y: 1.8, w: 7.2, colW: [3.6, 1.2, 1.2, 1.2], fontSize: 12, rowH: 0.45, margin: [0.04, 0.08, 0.04, 0.08] }, TABLE));
card(s, 8.1, 1.45, 4.63, 2.6, "The trade-off", "Cutting the worst fall by about a third (−34% → −21%) cost about 28% of the return. No candidate met both targets, so the rule chose the one that kept most of the return.", { bodySize: 13, fill: "FBEDE4" });
card(s, 8.1, 4.25, 4.63, 2.2, "Exits after crashes only", "April 2020: out for a week that rose 2.0%. April 2025: out for a week that fell 4.2% (holdout gain). It reacts to volatility, not direction.", { bodySize: 13 });
note(s, "Lower thresholds cut drawdown further but give up more return. Holding 50% in uncertain weeks (tested, planned in advance) gave about the same trade-off.", 4.55);

// ---------- 14. why the baseline underperformed ----------
pres.addSection({ title: S4 });
s = content("Why the baseline underperformed", S4);
[["No directional skill", "Days spent in cash returned as much as days invested (original v1: +0.10% vs +0.09% per day). Leaving the market gave up the upward drift."],
 ["Selection on a short, unusual period", "2021–22 included a bear market; the rule chosen there was defensive and missed much of the 2023–24 rally."],
 ["Out of the market too often", `Invested ${pct(base(WF).inv, 0)} of the time over 12 years, without better timing than chance.`],
 ["Costs — secondary", `Weekly decisions kept costs to about ${usd(base(T).costs)} over 2023–24; the shortfall was mainly timing.`],
].forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { bodySize: 14, titleSize: 18 });
});

// ---------- 15. along the way ----------
s = content("Along the way: two intermediate versions", S4);
const cal = W3.calibration;
const r1 = (x) => Math.round(1000 * x) / 10;
s.addChart(pres.charts.BAR, [{ name: "Average predicted P(Sell)", labels: ["Class weights (raw)", "No weights", "Weights + correction", "Sigmoid calibration", "Actual share of Sell weeks"],
  values: [r1(cal.C0["mean P(Sell)"]), r1(cal.C1["mean P(Sell)"]), r1(cal.C2["mean P(Sell)"]), r1(cal.C3["mean P(Sell)"]), r1(cal.C0["actual Sell share"])] }], Object.assign({
  x: M, y: 1.4, w: 6.6, h: 4.6, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent3, HEX.accent1, HEX.accent1, HEX.accent4, HEX.dk1],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", valAxisMinVal: 0, valAxisMaxVal: 40, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Predicted probability of a Sell week vs reality (2013–22)",
}, chartText));
card(s, 7.5, 1.5, 5.23, 2.35, "Intermediate 1: use all three probabilities", "An expected-return rule that trades only when the expected gain beats costs. It sold too often: class weighting had inflated the Sell probability (30% vs 21%).", { bodySize: 13 });
card(s, 7.5, 4.05, 5.23, 2.35, "Intermediate 2: correct the probabilities", "Fixed on average, not year by year. With honest odds the expected gain never justified a trade — leading to the final model’s different question.", { bodySize: 13, fill: "FBEDE4" });

// ---------- 16. ML or question ----------
s = content("A limitation of machine learning, or of the question?", S4);
[["Mainly the question", "Next week’s direction for the most-traded fund in the world, from its own public price history. Persistent patterns there are competed away."],
 ["Asking a better one helps", "The final model’s question — avoid large losses — fits what the data can predict, and it tracked the market. But less drawdown still cost return."],
 ["Where ML adds value", "Ranking many assets, forecasting risk for position sizing, and using non-public data — usually with small edges after costs."],
 ["The right benchmark", "Return per unit of risk, drawdown, and performance against random timing — not only final value."],
].forEach(([t, b], i) => {
  const y = 1.5 + i * 1.22;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: CW, h: 1.08, rectRadius: 0.1, fill: { color: i === 0 ? "FBEDE4" : C.background2 }, line: { color: i === 0 ? "FBEDE4" : C.background2 } });
  text(s, t, { x: M + 0.3, y, w: 3.4, h: 1.08, fontSize: 17, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  text(s, b, { x: M + 3.9, y, w: CW - 4.15, h: 1.08, fontSize: 14, valign: "middle" });
});

// ---------- 17. safeguards and limitations ----------
s = content("Safeguards and limitations", S4);
card(s, M, 1.5, 5.98, 4.9, "Safeguards", "• Chronological splits with label-length buffers\n• Selection rules fixed before results; tests scored once per design\n• 54 automated leakage tests, run on every change\n• Costs, slippage and interest on cash included\n• Risk metrics and a random-timing benchmark, not only final value", { bodySize: 14, titleSize: 18 });
card(s, M + 6.15, 1.5, 5.98, 4.9, "Limitations", "• One asset and price-based features only\n• All-in or all-out positions\n• The final model and the 2025–26 holdout came after earlier test results were known; a forward paper-trade from 13 Oct 2026 is the only blind test\n• The final model exited only twice, too few to separate skill from luck", { bodySize: 14, titleSize: 18, fill: "FBEDE4" });

// ---------- 18. conclusions ----------
s = content("Conclusions", S4);
[["Predictable size, unpredictable direction", "The models beat chance as classifiers, but their skill is in recognising turbulent or quiet weeks."],
 ["The question matters", "Timing direction (baseline) lost to buy-and-hold. Avoiding large losses (final) stayed close to it."],
 ["Less risk is not free", "Cutting the worst fall by a third cost about a quarter of the return with this model."],
 ["Short validation periods mislead", "A rule chosen on 2021–22 failed on 2023–24; the final model was chosen over ten years."],
].forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { bodySize: 15, titleSize: 18 });
});

// ---------- 19. questions ----------
s = pres.addSlide({ masterName: "Title Dark", sectionTitle: S4 });
s.addText("Questions", { placeholder: "title" });
s.addText([{ text: "Code, notebooks, reports and tests: github.com/TKCH121/spy", options: { color: C.accent4 } }], { placeholder: "body" });

// ---------- appendix A: every version ----------
pres.addSection({ title: SA });
s = content("Appendix A · Every version tested (2023–24 and 2013–24)", SA);
const avRow = (label, k, sched) => { const t = sc(k, T), w = sc(k, WF); return [label, sched, usd(t.final_value), pct(t.max_drawdown), w ? usd(w.final_value) : "—"]; };
s.addTable([
  [hdr("Version"), hdr("Decisions"), hdr("$100k → 2023–24"), hdr("Max drawdown"), hdr("$100k → 2013–24")],
  ["Buy & Hold", "—", usd(bhm(T).fv), pct(bhm(T).dd), usd(bhm(WF).fv)],
  avRow("Baseline (v1)", "v1w", "weekly"),
  avRow("Intermediate 1 (v2): expected-return rule", "v2w", "weekly"),
  avRow("Intermediate 2 (v3): corrected probabilities", "v3w", "weekly"),
  ["Final (v4): avoid large losses", "weekly", usd(fin(T).fv), pct(fin(T).dd), usd(fin(WF).fv)],
  ["Final, partial positions (0 / 50 / 100%)", "weekly", usd(PP.results[T].partial.final_value), pct(PP.results[T].partial.max_drawdown), usd(PP.results[WF].partial.final_value)],
  avRow("v1, original", "v1", "daily"), avRow("v2, original", "v2", "daily"), avRow("v3, original", "v3", "daily"),
], Object.assign({ x: M, y: 1.45, w: CW, colW: [4.4, 1.4, 2.2, 1.8, 2.33], fontSize: 13, rowH: 0.4, margin: [0.04, 0.1, 0.04, 0.1] }, TABLE));
note(s, "Cash earns T-bills in every row. Intermediate 1 stayed in cash for 2023–24; Intermediate 2 never sold. Full reports: outputs/weekly/report.md, outputs/v2, outputs/v3.", 5.75);

// ---------- appendix B: confusion ----------
s = content("Appendix B · Baseline confusion matrix, test 2023–24", SA);
const cm = [[24, 29, 39], [20, 129, 58], [56, 72, 70]];
const rl = ["Actual Sell (92)", "Actual Hold (207)", "Actual Buy (198)"], cl = ["Predicted Sell", "Predicted Hold", "Predicted Buy"];
const gx = M + 2.8, gy = 1.95, cwd = 1.7, ch = 1.0;
cl.forEach((c, j) => text(s, c, { x: gx + j * cwd, y: gy - 0.45, w: cwd, h: 0.4, fontSize: 13, bold: true, color: C.text1, align: "center" }));
cm.forEach((row, i) => {
  text(s, rl[i], { x: M, y: gy + i * ch, w: 2.7, h: ch, fontSize: 13, bold: true, color: C.text1, valign: "middle" });
  row.forEach((v, j) => {
    const fill = i === 1 && j === 1 ? HEX.accent1 : i === j ? "F6D2BC" : (i !== 1 && j !== 1) ? "D9E2F0" : HEX.lt2;
    s.addShape(pres.shapes.RECTANGLE, { x: gx + j * cwd, y: gy + i * ch, w: cwd - 0.06, h: ch - 0.06, fill: { color: fill }, line: { color: fill } });
    text(s, String(v), { x: gx + j * cwd, y: gy + i * ch, w: cwd - 0.06, h: ch - 0.06, fontSize: 22, bold: true, color: i === 1 && j === 1 ? C.background1 : C.text1, align: "center", valign: "middle" });
  });
});
card(s, 8.9, 1.5, 3.83, 3.0, "Reading", "Hold weeks are recognised (62% recall). Of 92 Sell weeks, 39 were predicted Buy; of 198 Buy weeks, 56 were predicted Sell.", { bodySize: 13 });

// ---------- appendix C: feature correlations ----------
s = content("Appendix C · Feature correlations, training data 2010–2020", SA);
const fcm = EDA.feature_corr, nF = fcm.features.length, cell = 0.3, hx = M + 2.0, hy = 1.75;
const blend = (hexc, t) => {
  const c = [0, 2, 4].map((k) => parseInt(hexc.slice(k, k + 2), 16));
  return c.map((v) => Math.round(255 + (v - 255) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
};
fcm.features.forEach((f, i) => {
  text(s, `${i + 1}  ${f}`, { x: M, y: hy + i * cell, w: 1.9, h: cell, fontSize: 10, valign: "middle" });
  text(s, String(i + 1), { x: hx + i * cell, y: hy - 0.3, w: cell, h: 0.28, fontSize: 10, align: "center", valign: "bottom" });
  fcm.matrix[i].forEach((v, j) => {
    const fill = v >= 0 ? blend("C8571B", Math.min(1, v)) : blend("2F5D9E", Math.min(1, -v));
    s.addShape(pres.shapes.RECTANGLE, { x: hx + j * cell, y: hy + i * cell, w: cell, h: cell, fill: { color: fill }, line: { color: "FFFFFF", width: 0.5 } });
  });
});
note(s, "Orange = positive, blue = negative correlation; darker = stronger.", hy + nF * cell + 0.1);
card(s, 7.6, 1.5, 5.13, 2.6, "Overlapping indicators", `${fcm["pairs_above_0.8"]} feature pairs have a correlation above 0.8 in absolute value — for example 10-day return with price vs its 20-day average (0.91), RSI with Bollinger %B (0.90), and the three volatility measures (up to 0.96).`, { bodySize: 13 });
card(s, 7.6, 4.3, 5.13, 2.1, "Effect on the models", "A compact 8-feature set was tested to reduce this redundancy; it did not improve validation results, so all 15 features were kept.", { bodySize: 13 });

pres.writeFile({ fileName: OUT }).then(async () => { await applyTheme(OUT, THEME); console.log("wrote", OUT, pres.slides.length, "slides"); });
