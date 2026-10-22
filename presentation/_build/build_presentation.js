// SPY weekly Buy / Hold / Sell model — presentation deck.
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
const PATHS = load("outputs/scorecard_paths.json");
const W1 = load("outputs/weekly/v1/results.json");
const W2 = load("outputs/weekly/v2/results.json");
const W3 = load("outputs/weekly/v3/results.json");
const EDA = load("outputs/eda_slides.json");
const sc = (strategy, period) => SC.find((r) => r.strategy === strategy && r.period === period);
const T = "2023–24 test", WF = "2013–24 walk-forward", HO = "2025–26 holdout";

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

const bh = sc("Buy & Hold", T), v1w = sc("v1w", T), v2w = sc("v2w", T), v3w = sc("v3w", T);
const S1 = "Objective and approach", S2 = "Method", S3 = "Results", S4 = "Interpretation", SA = "Appendix";

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
  { text: "Predict the best action for SPY (the S&P 500 ETF) over the next 5 trading days — Buy, Hold or Sell — and test whether trading on it beats buying and holding, after costs. The emphasis is on sound validation, not profit." },
], { x: M, y: 1.45, w: CW, h: 0.9, fontSize: 16 });
s.addTable([
  [hdr("Deliverable"), hdr("Where"), hdr("Content")],
  ["Exploratory analysis", "notebooks/01_eda", "Feature distributions, indicator correlations, class balance"],
  ["Modelling", "notebooks/02_modeling, weekly_v1–v3", "Lagged features, time-ordered splits, tuning, model selection"],
  ["Backtest", "notebooks/03_backtest, scorecard", "Costs, comparison with buy-and-hold, risk metrics"],
  ["Lessons learned", "outputs/SUMMARY.md", "Why the strategies underperformed; limits of prediction"],
], Object.assign({ x: M, y: 2.55, w: CW, colW: [2.6, 3.9, 5.63], fontSize: 15, rowH: 0.55, margin: [0.05, 0.12, 0.05, 0.12] }, TABLE));
note(s, "Code, data snapshots and 51 automated tests: github.com/TKCH121/spy", 5.55);

// ---------- 3. approach ----------
s = content("Approach", S1);
const steps = [
  ["Data", "SPY daily prices and volume, 2005–2026"],
  ["Features", "15 indicators, each using data up to the decision date only"],
  ["Target", "Buy > +1%, Sell < −1%, else Hold, over the next 5 trading days"],
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
  { text: "Positions: ", options: { bold: true, color: C.text1 } },
  { text: "Buy → fully invested for the week · Sell → in cash for the week · Hold → keep the current position. Training uses every trading day’s 5-day outcome; decisions are made once a week." },
], { x: M, y: 4.7, w: CW, h: 0.9, fontSize: 15 });

// ---------- 4. EDA: what the data shows ----------
pres.addSection({ title: "Exploratory analysis" });
s = content("EDA: size is predictable, direction is not", "Exploratory analysis");
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

// ---------- 5. EDA: class balance over time ----------
s = content("EDA: the class mix shifts year to year", "Exploratory analysis");
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

// ---------- 4. features and target ----------
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
text(s, "Class mix, training data 2010–2020", { x: 7.4, y: 1.5, w: 5.3, h: 0.35, fontSize: 15, bold: true, color: C.text1 });
[["Sell", 0.202, C.accent2], ["Hold", 0.448, C.accent3], ["Buy", 0.35, C.accent1]].forEach(([k, v, col], i) => {
  const y = 2.0 + i * 0.62;
  text(s, k, { x: 7.4, y, w: 0.8, h: 0.45, fontSize: 14, valign: "middle" });
  s.addShape(pres.shapes.RECTANGLE, { x: 8.2, y: y + 0.05, w: 4.0 * v / 0.45, h: 0.35, fill: { color: col }, line: { color: col } });
  text(s, pct(v, 0), { x: 8.3 + 4.0 * v / 0.45, y, w: 0.8, h: 0.45, fontSize: 14, valign: "middle" });
});
card(s, 7.4, 4.0, 5.33, 2.3, "Class imbalance", "Sell weeks are the minority. Class weights were used (SMOTE and no weighting were tested and scored lower). This improves recall of the minority class but inflates its predicted probability — see slide 15.", { bodySize: 13 });
note(s, "All features are strictly lagged; tests confirm that changing future prices never changes a past feature.", 4.75);

// ---------- 5. validation design ----------
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
const vd = [
  ["Selection on validation only", "Model and trading rule chosen on 2021–22 by rules fixed in advance; the test period is scored once, after freezing."],
  ["Out-of-sample checks", "12-year walk-forward (yearly refits, 2013–2024) and a 2025–26 holdout."],
  ["Leakage tests", "51 automated tests: features, labels, splits and every refit are checked for use of future data."],
  ["Pre-registered changes", "Each redesign was written down — and fingerprinted (SHA-256) — before it was run."],
];
vd.forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 3.0 + Math.floor(i / 2) * 1.75;
  card(s, x, y, 5.98, 1.6, t, b, { bodySize: 14 });
});

// ---------- 5b. integrity: data use and models ----------
s = content("How we kept the results honest", S2);
s.addTable([
  [hdr("Data"), hdr("Period"), hdr("Size"), hdr("Used for"), hdr("Used to choose anything?")],
  ["Training", "2010 – 2020", "2,764 days", "Fitting and tuning (5-fold time-series cross-validation)", "Yes — model settings"],
  ["Validation", "2021 – 2022", "498 days", "Choosing the model and the trading rule", "Yes — then frozen"],
  ["Test", "2023 – 2024", "497 days", "Scored once, after freezing", "No"],
  ["Walk-forward", "2013 – 2024", "12 yearly refits", "Robustness across market conditions", "No — reporting only"],
  ["Holdout", "Jan 2025 – Oct 2026", "439 days", "Later out-of-sample check (v3)", "No"],
  ["Paper-trade", "From 13 Oct 2026", "Live", "The only fully blind test", "No"],
], Object.assign({ x: M, y: 1.4, w: CW, colW: [1.6, 2.1, 1.7, 4.2, 2.53], fontSize: 12, rowH: 0.38, margin: [0.03, 0.08, 0.03, 0.08] }, TABLE));
s.addTable([
  [hdr("Model"), hdr("Key settings"), hdr("Tuning")],
  ["Random forest (v1)", "300 trees · at least 68 days per leaf · balanced class weights", "20 random settings · 5-fold time-series CV · macro-F1"],
  ["Logistic regression (v2, v3)", `Standardised inputs · C = ${W2.frozen_config.params.clf__C.toFixed(3)} · balanced weights · v3 adds calibration`, "20 random settings · 5-fold time-series CV · log loss"],
], Object.assign({ x: M, y: 4.25, w: CW, colW: [2.7, 5.2, 4.23], fontSize: 12, rowH: 0.42, margin: [0.03, 0.08, 0.03, 0.08] }, TABLE));
text(s, [
  { text: "Safeguards: ", options: { bold: true, color: C.text1 } },
  { text: "periods never overlap (5–6 day buffer at each boundary, also inside cross-validation); all scaling and resampling fit on training folds only; selection rules written down before results; 51 automated tests check features, labels, splits and every refit for use of future data." },
], { x: M, y: 5.65, w: CW, h: 0.85, fontSize: 13 });

// ---------- 6. three iterations ----------
s = content("Three iterations", S2);
s.addTable([
  [hdr(""), hdr("Change"), hdr("Reason"), hdr("Selected (weekly)")],
  ["v1", "Random forest; act on Buy vs Sell probabilities", "Baseline design from the brief", "Random forest, most-likely class"],
  ["v2", "Expected-return rule over all three probabilities, net of the 0.30% round-trip cost; model and rule chosen together on validation return; cash earns T-bills", "v1’s rule ignored the Hold probability, where the model’s skill lies", "Logistic regression, default to cash"],
  ["v3", "Correct (calibrate) the probabilities before the rule uses them", "Class weighting inflated the Sell probability", "Calibrated logistic regression, default invested"],
], Object.assign({ x: M, y: 1.5, w: CW, colW: [0.7, 5.0, 3.6, 2.83], fontSize: 13, rowH: 0.9, margin: [0.06, 0.1, 0.06, 0.1] }, TABLE));
note(s, "v1 was built by Peter Li with daily decisions; all three versions were rebuilt with weekly decisions under a plan fixed before the rebuild.", 5.85);

// ---------- 7. model selection and classification ----------
s = content("Classification performance", S2);
const cands = [["Random forest", 0.4036], ["Logistic regression + SMOTE", 0.364], ["Logistic regression", 0.3593], ["Stratified random baseline", 0.3328], ["Gradient boosting", 0.322]];
s.addChart(pres.charts.BAR, [{ name: "Validation macro-F1", labels: cands.map((c) => c[0]), values: cands.map((c) => c[1]) }], Object.assign({
  x: M, y: 1.4, w: 6.2, h: 4.2, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent1, HEX.accent3, HEX.accent3, HEX.dk2, HEX.accent3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", valAxisMinVal: 0, valAxisMaxVal: 0.5, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "v1 model selection: validation macro-F1 (2021–22)",
}, chartText));
const c2 = W2.test_classification["v2 model"], c3 = W3.results[T].classification;
s.addTable([
  [hdr("Test 2023–24"), hdr("Accuracy"), hdr("Macro-F1")],
  ["v1 · random forest", "44.9%", "0.41"],
  ["v2 · logistic regression", pct(c2.accuracy), c2.macro_f1.toFixed(2)],
  ["v3 · calibrated", pct(c3.accuracy), c3.macro_f1.toFixed(2)],
  ["Random baseline", "≈ 33%", "0.31–0.32"],
], Object.assign({ x: 7.1, y: 1.5, w: 5.63, colW: [2.63, 1.5, 1.5], fontSize: 14, rowH: 0.48, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
card(s, 7.1, 4.1, 5.63, 2.2, "Skill is in the size of the move", "The models recognise quiet weeks well but confuse up and down weeks. v3 has the highest accuracy but the lowest macro-F1, as calibrated probabilities mostly predict Hold.", { bodySize: 13 });

// ---------- 8. headline result ----------
pres.addSection({ title: S3 });
s = content("Result: buy-and-hold outperformed every version", S3);
const idx = []; for (let i = 0; i < PATHS.dates.length; i += 5) idx.push(i);
if (idx[idx.length - 1] !== PATHS.dates.length - 1) idx.push(PATHS.dates.length - 1);
const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const lab = idx.map((i) => { const [y, m] = PATHS.dates[i].split("-"); return mon[+m - 1] + " " + y.slice(2); });
s.addChart(pres.charts.LINE, [
  { name: "Buy & Hold (= v3)", labels: lab, values: idx.map((i) => PATHS["Buy & Hold"][i]) },
  { name: "v1 weekly", labels: lab, values: idx.map((i) => PATHS.v1w[i]) },
  { name: "v2 weekly", labels: lab, values: idx.map((i) => PATHS.v2w[i]) },
], Object.assign({
  x: M, y: 1.4, w: 8.4, h: 5.0, chartColors: [HEX.dk1, HEX.accent1, HEX.accent2], lineSize: 2.5, lineDataSymbol: "none",
  valAxisMinVal: 90000, valAxisMaxVal: 170000, valAxisMajorUnit: 20000, valAxisLabelFormatCode: "$#,##0",
  catAxisLabelFrequency: 13, valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "t", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.dk2,
  showTitle: true, title: "$100,000 invested, test period 2023–24, after costs",
}, chartText));
[["Buy & Hold", bh.final_value, C.text1, ""], ["v1 weekly", v1w.final_value, C.accent1, ""], ["v2 weekly", v2w.final_value, C.accent2, " — stayed in cash"], ["v3 weekly", v3w.final_value, C.text1, " — never sold"]].forEach(([k, v, col, extra], i) => {
  const y = 1.55 + i * 1.18;
  text(s, usd(v), { x: 9.3, y, w: 3.43, h: 0.6, fontSize: 28, bold: true, color: col, fontFace: THEME.headFontFace, valign: "bottom" });
  text(s, k + extra, { x: 9.3, y: y + 0.62, w: 3.43, h: 0.4, fontSize: 13 });
});

// ---------- 9. return and risk ----------
s = content("Return and risk, 2023–24", S3);
const rowsT = [["Buy & Hold", bh], ["v1 weekly", v1w], ["v2 weekly", v2w], ["v3 weekly", v3w]];
s.addTable([
  [hdr("Strategy"), hdr("Final value"), hdr("Annual return"), hdr("Volatility"), hdr("Max drawdown"), hdr("Sharpe"), hdr("Trades"), hdr("Time invested")],
  ...rowsT.map(([k, r]) => [k, usd(r.final_value), pct(r.cagr), pct(r.ann_vol), pct(r.max_drawdown), r.time_invested > 0 ? r.sharpe.toFixed(2) : "—", String(r.round_trips), pct(r.time_invested, 0)]),
], Object.assign({ x: M, y: 1.5, w: CW, colW: [2.2, 1.6, 1.6, 1.4, 1.6, 1.2, 1.1, 1.43], fontSize: 14, rowH: 0.52, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
note(s, "$100,000; 0.10% fee + 0.05% slippage per side; cash earns the 13-week T-bill rate; Sharpe measured above the T-bill rate.", 4.25);
card(s, M, 4.75, 3.93, 1.65, "Lower volatility, same drawdown", "Time in cash reduced day-to-day swings, not the worst loss.", { bodySize: 13 });
card(s, M + 4.1, 4.75, 3.93, 1.65, "Lower risk-adjusted return", `Sharpe ${v1w.sharpe.toFixed(2)} for v1 vs ${bh.sharpe.toFixed(2)} for buy-and-hold.`, { bodySize: 13 });
card(s, M + 8.2, 4.75, 3.93, 1.65, "Timing not better than chance", `v1 beat ${pct(W1.evidence.beats_random, 0)} of 1,000 random-timing strategies with the same exposure.`, { bodySize: 13, fill: "FBEDE4" });

// ---------- 10. robustness ----------
s = content("Beyond one test period", S3);
const wb = sc("Buy & Hold", WF), w1 = sc("v1w", WF), w2 = sc("v2w", WF), hb = sc("Buy & Hold", HO);
const wfRow = (k, r) => [k, usd(r.final_value), pct(r.cagr), pct(r.max_drawdown), r.sharpe.toFixed(2), pct(r.time_invested, 0)];
text(s, [
  { text: "12-year walk-forward, 2013–2024. ", options: { bold: true, color: C.text1 } },
  { text: "Retrain every January on all earlier data, trade the following year, repeat; $100,000 chained across the 12 years." },
], { x: M, y: 1.35, w: CW, h: 0.5, fontSize: 14 });
s.addTable([
  [hdr("Strategy (weekly decisions)"), hdr("Final value"), hdr("Annual return"), hdr("Max drawdown"), hdr("Sharpe"), hdr("Time invested")],
  wfRow("Buy & Hold", wb), wfRow("v1 · random forest", w1), wfRow("v2 · logistic regression", w2),
  ["v3 · never sells — identical to buy-and-hold", "", "", "", "", ""],
], Object.assign({ x: M, y: 1.9, w: CW, colW: [3.93, 1.7, 1.7, 1.7, 1.4, 1.7], fontSize: 14, rowH: 0.45, margin: [0.04, 0.1, 0.04, 0.1] }, TABLE));
text(s, [
  { text: "Holdout, Jan 2025 – Oct 2026. ", options: { bold: true, color: C.text1 } },
  { text: `A later period never used for any choice. v3 never sold and matched buy-and-hold: ${usd(hb.final_value)}, ${pct(hb.cagr)} a year, max drawdown ${pct(hb.max_drawdown)}.` },
], { x: M, y: 4.3, w: CW, h: 0.7, fontSize: 14 });
card(s, M, 5.05, CW, 1.45, "Takeaway", `Across 12 years no version beat buy-and-hold. Lower drawdowns came only from time out of the market, at a large cost in return (v1 ${pct(w1.cagr)} and v2 ${pct(w2.cagr)} a year vs ${pct(wb.cagr)}).`, { bodySize: 14, fill: "FBEDE4" });

// ---------- 11. why ----------
pres.addSection({ title: S4 });
s = content("Why the strategies underperformed", S4);
[["No directional skill", "Days spent in cash returned as much as days invested (v1: +0.10% vs +0.09% per day). Leaving the market only gave up the upward drift."],
 ["Selection on a short, unusual period", "v1 and v2 beat buy-and-hold on 2021–22, which included a bear market; the defensive rules they selected missed the 2023–24 rally."],
 ["Distorted probabilities", "Class weighting overstated the chance of a down week (30% vs 21%), biasing v2’s expected return toward selling."],
 ["Costs — secondary", `Weekly decisions kept costs to about ${usd(v1w.costs)} for v1; the shortfall was mainly timing.`],
].forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { bodySize: 14, titleSize: 18 });
});

// ---------- 12. class imbalance and calibration ----------
s = content("Class imbalance and calibration", S4);
const cal = W3.calibration;
const r1 = (x) => Math.round(1000 * x) / 10;
s.addChart(pres.charts.BAR, [{ name: "Average predicted P(Sell)", labels: ["Class weights (v2)", "No weights", "Weights + prior correction", "Sigmoid calibration", "Actual share of Sell weeks"],
  values: [r1(cal.C0["mean P(Sell)"]), r1(cal.C1["mean P(Sell)"]), r1(cal.C2["mean P(Sell)"]), r1(cal.C3["mean P(Sell)"]), r1(cal.C0["actual Sell share"])] }], Object.assign({
  x: M, y: 1.4, w: 7.2, h: 4.6, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent3, HEX.accent1, HEX.accent1, HEX.accent4, HEX.dk1],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", valAxisMinVal: 0, valAxisMaxVal: 40, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Average predicted probability of a Sell week (walk-forward, 2013–22)",
}, chartText));
card(s, 8.1, 1.5, 4.63, 2.2, "The trade-off", "Weighting the minority class improves its recall — required by the brief — but the predicted probabilities no longer reflect real frequencies.", { bodySize: 13 });
card(s, 8.1, 3.9, 4.63, 2.2, "Correction works on average only", `Pre-set test: within ±3 points in 8 of 10 years. Best result: ${cal.C2["years within ±3 pp"]} of 10, because the share of Sell weeks shifts from year to year.`, { bodySize: 13, fill: "FBEDE4" });
note(s, "Shown for v3’s weekly base model (logistic regression); the original gradient-boosting model gave the same pattern (30.3% → 21.5%).", 6.15);

// ---------- 13. limitation of ML? ----------
s = content("A limitation of machine learning, or of the question?", S4);
[["Mainly the question", "Next week’s direction for the most-traded fund in the world, from its own public price history. Persistent patterns there are competed away."],
 ["Partly the design", "One asset, price data only, all-in or all-out, a one-week horizon. Relaxing these makes the problem easier, not solved."],
 ["Where ML adds value", "Ranking many assets against each other, forecasting risk for position sizing, and using non-public data — usually with small edges after costs."],
 ["The right benchmark", "Return per unit of risk, and performance against random timing — not only final value against buy-and-hold."],
].forEach(([t, b], i) => {
  const y = 1.5 + i * 1.22;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: CW, h: 1.08, rectRadius: 0.1, fill: { color: i === 0 ? "FBEDE4" : C.background2 }, line: { color: i === 0 ? "FBEDE4" : C.background2 } });
  text(s, t, { x: M + 0.3, y, w: 3.4, h: 1.08, fontSize: 17, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  text(s, b, { x: M + 3.9, y, w: CW - 4.15, h: 1.08, fontSize: 14, valign: "middle" });
});

// ---------- 14. safeguards and limitations ----------
s = content("Safeguards and limitations", S4);
card(s, M, 1.5, 5.98, 4.9, "Safeguards", "• Chronological splits with label-length buffers\n• Selection rules fixed before results; tests scored once per design\n• 51 automated leakage tests, run on every change\n• Costs, slippage and interest on cash included\n• Risk metrics and a random-timing benchmark, not only final value", { bodySize: 14, titleSize: 18 });
card(s, M + 6.15, 1.5, 5.98, 4.9, "Limitations", "• One asset and price-based features only\n• Validation covers two years, one of them a bear market\n• The weekly rebuild and the 2025–26 holdout were designed after earlier test results were known; a forward paper-trade from 13 Oct 2026 is the only blind test\n• Results depend on the committed data snapshots", { bodySize: 14, titleSize: 18, fill: "FBEDE4" });

// ---------- 15. conclusions ----------
s = content("Conclusions", S4);
[["Predictable size, unpredictable direction", "The classifier beats chance (macro-F1 ≈ 0.40 vs 0.32), but its skill is in recognising quiet weeks."],
 ["Buy-and-hold was not beaten", "On return or Sharpe, in any period, by any version or decision schedule."],
 ["Good predictions are not good trades", "Choices that improve classification scores can degrade trading decisions."],
 ["Short validation periods mislead", "Rules that won on 2021–22 failed on 2023–24."],
].forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { bodySize: 15, titleSize: 18 });
});

// ---------- 16. questions ----------
s = pres.addSlide({ masterName: "Title Dark", sectionTitle: S4 });
s.addText("Questions", { placeholder: "title" });
s.addText([{ text: "Code, notebooks, reports and tests: github.com/TKCH121/spy", options: { color: C.accent4 } }], { placeholder: "body" });

// ---------- appendix ----------
pres.addSection({ title: SA });
s = content("Appendix A · Weekly vs daily decisions, 2023–24", SA);
const dRow = (k) => { const w = sc(k + "w", T), d = sc(k, T); return [k, usd(d.final_value), String(d.round_trips), usd(d.costs), usd(w.final_value), String(w.round_trips), usd(w.costs)]; };
s.addTable([
  [hdr("Version"), hdr("Daily: final"), hdr("Trades"), hdr("Costs"), hdr("Weekly: final"), hdr("Trades"), hdr("Costs")],
  dRow("v1"), dRow("v2"), dRow("v3"),
  ["Buy & Hold", usd(bh.final_value), "1", usd(bh.costs), usd(bh.final_value), "1", usd(bh.costs)],
], Object.assign({ x: M, y: 1.5, w: CW, colW: [2.0, 1.9, 1.2, 1.5, 1.9, 1.2, 2.43], fontSize: 14, rowH: 0.52, margin: [0.05, 0.1, 0.05, 0.1] }, TABLE));
note(s, "Daily = the original versions, acting on a new 5-day prediction every trading day. Weekly = rebuilt versions, selected on a weekly schedule. Cash earns T-bills in both.", 4.3);

s = content("Appendix B · v1 confusion matrix, test 2023–24", SA);
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

s = content("Appendix C · Feature correlations, training data 2010–2020", SA);
const fc = EDA.feature_corr, nF = fc.features.length, cell = 0.3, hx = M + 2.0, hy = 1.75;
const blend = (hexc, t) => {
  const c = [0, 2, 4].map((k) => parseInt(hexc.slice(k, k + 2), 16));
  return c.map((v) => Math.round(255 + (v - 255) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
};
fc.features.forEach((f, i) => {
  text(s, `${i + 1}  ${f}`, { x: M, y: hy + i * cell, w: 1.9, h: cell, fontSize: 10, valign: "middle" });
  text(s, String(i + 1), { x: hx + i * cell, y: hy - 0.3, w: cell, h: 0.28, fontSize: 10, align: "center", valign: "bottom" });
  fc.matrix[i].forEach((v, j) => {
    const fill = v >= 0 ? blend("C8571B", Math.min(1, v)) : blend("2F5D9E", Math.min(1, -v));
    s.addShape(pres.shapes.RECTANGLE, { x: hx + j * cell, y: hy + i * cell, w: cell, h: cell, fill: { color: fill }, line: { color: "FFFFFF", width: 0.5 } });
  });
});
note(s, "Orange = positive, blue = negative correlation; darker = stronger.", hy + nF * cell + 0.1);
card(s, 7.6, 1.5, 5.13, 2.6, "Overlapping indicators", `${fc["pairs_above_0.8"]} feature pairs have a correlation above 0.8 in absolute value — for example 10-day return with price vs its 20-day average (0.91), RSI with Bollinger %B (0.90), and the three volatility measures (up to 0.96).`, { bodySize: 13 });
card(s, 7.6, 4.3, 5.13, 2.1, "Effect on the models", "v1 tested a compact 8-feature set to reduce this redundancy; it did not improve validation results, so all 15 features were kept.", { bodySize: 13 });

pres.writeFile({ fileName: OUT }).then(async () => { await applyTheme(OUT, THEME); console.log("wrote", OUT, pres.slides.length, "slides"); });
