// SPY trading model presentation for a non-finance audience: everything framed as $100,000.
// usage: node build2.js <out.pptx> <paths.json>
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const P = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const R = JSON.parse(fs.readFileSync(process.argv[4], "utf8")); // outputs/v2/results.json
const V2T = R.test[0], BHT = R.test[1], EV = R.evidence;
const WF = R.walk_forward[0], WFB = R.walk_forward[1];
const pctBeat = Math.round(EV.random_timing_percentile * 1000);

const THEME = {
  name: "SPY Signal",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14213D", lt1: "FFFFFF", dk2: "3B4A63", lt2: "EEF1F6",
    accent1: "C8571B", accent2: "2F5D9E", accent3: "8A96A8",
    accent4: "E9A46A", accent5: "4E7D5B", accent6: "6B4F96",
    hlink: "2F5D9E", folHlink: "6B4F96",
  },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Can a computer beat buy-and-wait?";
pres.author = "Module 3 Group 7";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, CW = W - 2 * M;
const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "Title Dark", background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.0, w: 11.8, h: 2.4, fontSize: 52, bold: true, color: C.background1, valign: "bottom", fontFace: THEME.headFontFace }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.6, w: 11, h: 1.8, fontSize: 22, color: C.background2, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "Statement Dark", background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.2, w: 11.8, h: 2.8, fontSize: 40, bold: true, color: C.background1, valign: "bottom", fontFace: THEME.headFontFace }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.3, w: 11.4, h: 2.3, fontSize: 21, color: C.background2, valign: "top" }, text: "" } },
  ],
  slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.35, fontSize: 12, color: C.accent3, align: "right" },
});
pres.defineSlideMaster({
  title: "Content", background: { color: C.background1 }, margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.4, w: CW, h: 0.9, fontSize: 32, bold: true, color: C.text1, valign: "middle", fontFace: THEME.headFontFace }, text: "" } },
    { text: { text: "Can a computer beat buy-and-wait? · Module 3 Group 7", options: { x: M, y: 6.95, w: 8, h: 0.35, fontSize: 11, color: C.accent3, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 6.95, w: 0.6, h: 0.35, fontSize: 12, color: C.accent3, align: "right" },
});

// ---------- helpers ----------
function text(slide, t, o) {
  slide.addText(t, Object.assign({ isTextBox: true, margin: 0, fontSize: 16, color: C.text2, valign: "top" }, o));
}
function card(slide, x, y, w, h, title, body, opt = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: opt.fill || C.background2 }, line: { color: opt.fill || C.background2 } });
  const ts = opt.titleSize || 19;
  let tx = x + 0.25, tw = w - 0.5;
  if (opt.badge) {
    slide.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.48, h: 0.48, fill: { color: C.accent1 }, line: { color: C.accent1 } });
    text(slide, opt.badge, { x: x + 0.25, y: y + 0.25, w: 0.48, h: 0.48, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
    tx = x + 0.9; tw = w - 1.15;
  }
  const lines = Math.max(1, Math.ceil((title.length * 0.55 * ts / 72) / tw));
  const th = Math.max(0.48, lines * ts * 1.2 / 72 + 0.05);
  text(slide, title, { x: tx, y: y + 0.25, w: tw, h: th, fontSize: ts, bold: true, color: opt.titleColor || C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  const by = y + 0.25 + th + 0.12;
  text(slide, body, { x: x + 0.25, y: by, w: w - 0.5, h: y + h - 0.2 - by, fontSize: opt.bodySize || 15, color: C.text2 });
}
function stat(slide, x, y, w, big, label, color, size) {
  text(slide, big, { x, y, w, h: 1.0, fontSize: size || 48, bold: true, color: color || C.accent1, fontFace: THEME.headFontFace, valign: "bottom" });
  text(slide, label, { x, y: y + 1.1, w, h: 0.9, fontSize: 15, color: C.text2 });
}
function content(title, section) {
  TITLES.push(title);
  const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
}
const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 } } });
const TABLE = { color: C.text2, border: { type: "solid", pt: 0.75, color: "D5DAE3" }, valign: "middle" };
const chartText = { catAxisLabelColor: HEX.dk2, valAxisLabelColor: HEX.dk2, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt", catAxisLabelFontSize: 13, valAxisLabelFontSize: 12, dataLabelFontSize: 13, titleFontSize: 15, titleColor: HEX.dk1, dataLabelColor: HEX.dk1 };

const T = P.test, V = P.val;
const gap = T.bh_final - T.model_final;
const S1 = "The question", S2 = "How the model works", S3 = "What happened", S4 = "Version 2", S4b = "Version 3", S5 = "Wrap-up";
const SCRIPT_OUT = process.argv[5];

// Slide titles in deck order; the speaker script (SCRIPT_TEXT, near the end) is keyed by them.
const TITLES = [];

// ---------- 1. cover ----------
pres.addSection({ title: S1 });
TITLES.push("Cover");
let s = pres.addSlide({ masterName: "Title Dark", sectionTitle: S1 });
text(s, "MODULE 3 · MACHINE LEARNING PROJECT · GROUP 7", { x: M, y: 1.4, w: 11, h: 0.4, fontSize: 14, bold: true, charSpacing: 3, color: C.accent4 });
s.addText("Can a computer beat “buy and wait”?", { placeholder: "title" });
s.addText([
  { text: "Testing a machine-learning trading model on the US stock market with $100,000", options: { breakLine: true } },
  { text: "[Presenter names] · [Date]", options: { fontSize: 16, color: C.accent3 } },
], { placeholder: "body" });

// ---------- 1b. deliverables ----------
s = content("What we delivered", S1);
const drows = [
  [hdr("The brief asked for"), hdr("Where it is"), hdr("What it shows")],
  ["Exploratory analysis", "notebooks/01_eda.ipynb", "Feature distributions, indicator correlations, class balance"],
  ["Modelling notebook", "notebooks/02_modeling.ipynb", "Lagged features, time-ordered splits, tuning; random forest chosen"],
  ["Realistic backtest", "notebooks/03_backtest.ipynb", "vectorbt, 0.10% fee + 0.05% slippage, plotted against Buy & Hold"],
  ["“Lessons learned” report", "outputs/report.md", "Where the model failed, why it lost, why markets are hard"],
  ["Beyond the brief", "v2 and v3 notebooks, docs/", "Two improved versions, planned in advance and tested honestly"],
];
s.addTable(drows, Object.assign({ x: M, y: 1.5, w: CW, colW: [2.9, 3.6, 5.63], fontSize: 16, rowH: 0.6, margin: [0.06, 0.14, 0.06, 0.14] }, TABLE));
text(s, "Throughout: no look-ahead, checked by 46 automated tests. Code: github.com/TKCH121/spy", { x: M, y: 5.5, w: CW, h: 0.6, fontSize: 16, bold: true, color: C.accent1 });

// ---------- 2. two options ----------
s = content("The question in one picture", S1);
card(s, M, 1.55, 5.8, 3.5, "Option A · Buy and wait", "On 3 January 2023, put $100,000 into the US stock market and do nothing for two years.\n\nThis is the yardstick, called “Buy & Hold”.", { bodySize: 17, titleSize: 22 });
card(s, M + 6.33, 1.55, 5.8, 3.5, "Option B · Let the model decide", "Every evening, a computer model decides whether the money should be in the market or safely in cash the next day.\n\nEvery switch costs a small fee.", { bodySize: 17, titleSize: 22, fill: "FBEDE4" });
text(s, "Which one ends 2024 with more money?", { x: M, y: 5.45, w: CW, h: 0.7, fontSize: 28, bold: true, color: C.accent1, align: "center", fontFace: THEME.headFontFace });

// ---------- 3. glossary ----------
s = content("Five words you’ll hear today", S1);
const words = [
  ["SPY (the S&P 500)", "One fund that holds the 500 biggest US companies. Its price rises and falls with the whole US stock market."],
  ["Buy & Hold", "Buy once and never sell. The simplest strategy, and the one to beat."],
  ["Backtest", "Replaying history day by day as if the model had been trading, using only what was known on each day."],
  ["Trading cost", "Each buy or sell costs about 0.15% — $150 for every $100,000 moved."],
  ["Drawdown", "The biggest drop from a high point. How much it hurts in the worst stretch."],
];
words.forEach(([k, v], i) => {
  const y = 1.5 + i * 1.02;
  s.addShape(pres.shapes.OVAL, { x: M, y: y + 0.08, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1 } });
  text(s, String(i + 1), { x: M, y: y + 0.08, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
  text(s, k, { x: M + 0.8, y: y + 0.08, w: 3.4, h: 0.5, fontSize: 19, bold: true, color: C.text1, valign: "middle", fontFace: THEME.headFontFace });
  text(s, v, { x: M + 4.3, y: y + 0.08, w: CW - 4.3, h: 0.8, fontSize: 17, valign: "middle" });
});

// ---------- 4. answer ----------
s = content("The answer: buy-and-wait won by " + usd(gap), S1);
s.addChart(pres.charts.BAR, [{ name: "Money at end of 2024", labels: ["Buy & Hold", "Our model (v1)"], values: [T.bh_final, T.model_final] }], Object.assign({
  x: M, y: 1.45, w: 6.6, h: 4.9, barDir: "col", chartColors: [HEX.dk1, HEX.accent1], barGapWidthPct: 60,
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$#,##0", valAxisMinVal: 0, valAxisMaxVal: 180000, valAxisLabelFormatCode: "$#,##0", valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "$100,000 invested on 3 Jan 2023 → value on 31 Dec 2024",
}, chartText, { catAxisLabelFontSize: 16, dataLabelFontSize: 18 }));
stat(s, 7.7, 1.6, 5.0, "+" + usd(T.bh_final - 100000), "Buy & Hold profit — bought once, paid $100 in costs", C.text1);
stat(s, 7.7, 3.25, 5.0, "+" + usd(T.model_final - 100000), "Model profit — 15 round trips, paid " + usd(T.model_fees) + " in costs");
stat(s, 7.7, 4.9, 5.0, usd(gap), "Less money than simply waiting", C.accent2);

// ---------- 5. journey ----------
s = content("The two-year journey of $100,000", S1);
const idx = []; for (let i = 0; i < T.dates.length; i += 5) idx.push(i); if (idx[idx.length - 1] !== T.dates.length - 1) idx.push(T.dates.length - 1);
const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const lab = idx.map((i) => { const [y, m] = T.dates[i].split("-"); return mon[+m - 1] + " " + y.slice(2); });
s.addChart(pres.charts.LINE, [
  { name: "Buy & Hold", labels: lab, values: idx.map((i) => T.bh[i]) },
  { name: "Our model (v1)", labels: lab, values: idx.map((i) => T.model[i]) },
], Object.assign({
  x: M, y: 1.4, w: 8.6, h: 5.0, chartColors: [HEX.dk1, HEX.accent1], lineSize: 3, lineDataSymbol: "none",
  valAxisMinVal: 90000, valAxisMaxVal: 170000, valAxisMajorUnit: 20000, valAxisLabelFormatCode: "$#,##0",
  catAxisLabelFrequency: 13, valGridLine: { color: "E3E7EE", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "t", legendFontSize: 14, legendFontFace: "+mn-lt", legendColor: HEX.dk2,
}, chartText));
card(s, 9.5, 1.5, 3.23, 2.35, "The costly pause", "4 Dec 2023 → 5 Apr 2024: the model sat in cash while the market rose about 14%. The flat orange stretch.", { bodySize: 14, titleSize: 17, fill: "FBEDE4" });
card(s, 9.5, 4.05, 3.23, 2.35, "Time in cash", (T.days - T.days_in) + " of " + T.days + " trading days (" + Math.round(100 * (T.days - T.days_in) / T.days) + "%) out of the market — in a market that mostly went up.", { bodySize: 14, titleSize: 17 });

// ---------- 6. pipeline ----------
pres.addSection({ title: S2 });
s = content("How the model makes a decision, every evening", S2);
const steps = [
  ["Look", "Measure 15 things about recent prices and trading activity"],
  ["Predict", "Will next week be Up (> +1%), Down (< −1%) or Flat?"],
  ["Decide", "Turn that prediction into: in the market or in cash tomorrow"],
  ["Trade", "If it switches, buy or sell when the market opens, and pay the cost"],
];
const bw = 2.75, sgap = (CW - 4 * bw) / 3;
steps.forEach(([t, b], i) => {
  const x = M + i * (bw + sgap);
  card(s, x, 1.7, bw, 2.8, t, b, { badge: String(i + 1), bodySize: 16, titleSize: 20 });
  if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + bw + sgap / 2 - 0.15, y: 2.95, w: 0.3, h: 0.32, fill: { color: C.accent1 }, line: { color: C.accent1 } });
});
text(s, "Rule against cheating: the decision is made after the market closes, and the trade happens at the next morning’s price. The model never trades at a price it has already seen.", { x: M, y: 5.0, w: CW, h: 1.0, fontSize: 17, color: C.text1 });

// ---------- 7. features ----------
s = content("What the model looks at: 15 measurements", S2);
const frows = [
  [hdr("Plain-English question"), hdr("Technical name"), hdr("How many")],
  ["How much has the price moved lately?", "1, 5, 10 and 20-day returns", "4"],
  ["Is the price above or below its usual level?", "Moving averages (20, 50, 200 days)", "4"],
  ["Has it risen or fallen unusually fast?", "RSI, MACD, Bollinger %B", "3"],
  ["How jumpy or nervous is the market?", "Volatility, ATR, band width", "3"],
  ["Are unusually many people trading?", "Volume z-score", "1"],
];
s.addTable(frows, Object.assign({ x: M, y: 1.55, w: CW, colW: [5.6, 5.0, 1.53], fontSize: 17, rowH: 0.62, margin: [0.06, 0.14, 0.06, 0.14] }, TABLE));
text(s, "Every measurement uses only prices up to today. 15 automated tests check this — for example, they change future prices and confirm that nothing the model saw changes.", { x: M, y: 5.6, w: CW, h: 0.8, fontSize: 16 });

// ---------- 8. label ----------
s = content("What the model predicts: what kind of week is next", S2);
text(s, "Example: SPY closes at $500 on Monday. One week later it is…", { x: M, y: 1.5, w: CW, h: 0.5, fontSize: 19, color: C.text1 });
const band = [["Down week", "below $495", C.accent2, "18%"], ["Flat week", "$495 to $505", C.accent3, "42%"], ["Up week", "above $505", C.accent1, "40%"]];
band.forEach(([k, v, col, pct], i) => {
  const x = M + i * 4.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.2, w: 3.93, h: 1.5, rectRadius: 0.12, fill: { color: col }, line: { color: col } });
  text(s, k, { x, y: 2.3, w: 3.93, h: 0.7, fontSize: 26, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: THEME.headFontFace });
  text(s, v, { x, y: 3.0, w: 3.93, h: 0.5, fontSize: 18, color: C.background1, align: "center", valign: "middle" });
  text(s, pct + " of weeks in 2023–24", { x, y: 3.85, w: 3.93, h: 0.4, fontSize: 15, align: "center" });
});
card(s, M, 4.5, 5.98, 1.95, "Uneven mix", "Up and flat weeks are far more common than down weeks, so the model is told to pay extra attention to the rare ones.", { bodySize: 15 });
card(s, M + 6.15, 4.5, 5.98, 1.95, "The mix changes every year", "2017: only 5% of weeks were down weeks. 2022: 41% were. Each period looks different.", { bodySize: 15 });

// ---------- 9. no cheating ----------
s = content("No cheating: textbook, practice exam, final exam", S2);
const tw = CW - 0.2, yr = tw / 15;
const segs = [["Textbook · 2010–2020 · learn", 11, C.text1], ["Practice exam · 2021–22", 2, C.accent2], ["Final exam · 2023–24", 2, C.accent1]];
let sx = M;
segs.forEach(([k, n, col]) => {
  const w = yr * n;
  s.addShape(pres.shapes.RECTANGLE, { x: sx, y: 1.6, w, h: 1.0, fill: { color: col }, line: { color: col } });
  text(s, k, { x: sx + 0.08, y: 1.6, w: w - 0.16, h: 1.0, fontSize: n > 2 ? 18 : 13, bold: true, color: C.background1, align: "center", valign: "middle" });
  sx += w + 0.1;
});
const vcols = [
  ["Textbook (training)", "The model learns patterns from 11 years of history."],
  ["Practice exam (validation)", "We try several models and trading rules and pick the best, then lock everything."],
  ["Final exam (test)", "Opened once, after locking. Nothing we saw there changed the model."],
];
vcols.forEach(([k, v], i) => card(s, M + i * 4.1, 3.0, 3.93, 2.35, k, v, { badge: String(i + 1), bodySize: 15, titleSize: 17 }));
text(s, "Data is never shuffled: the model always learns from the past and is tested on the future, with a one-week buffer between periods.", { x: M, y: 5.65, w: CW, h: 0.7, fontSize: 16, color: C.text1 });

// ---------- 10. model comparison ----------
s = content("Choosing the model: the random forest scored best", S2);
const cands = [
  ["Random forest", 0.4036], ["Logistic regression + SMOTE", 0.3640], ["Logistic regression (8 inputs)", 0.3619], ["Logistic regression", 0.3593],
  ["Random guessing", 0.3328], ["Logistic regression, no weighting", 0.3289], ["Gradient boosting", 0.3220], ["Gradient boosting (8 inputs)", 0.2915],
];
s.addChart(pres.charts.BAR, [{ name: "Practice-exam score", labels: cands.map((c) => c[0]), values: cands.map((c) => c[1]) }], Object.assign({
  x: M, y: 1.4, w: 7.9, h: 5.0, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent1, HEX.accent3, HEX.accent3, HEX.accent3, HEX.dk2, HEX.accent3, HEX.accent3, HEX.accent3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", valAxisMinVal: 0, valAxisMaxVal: 0.5, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Practice-exam score (macro-F1, 2021–22) — higher is better",
}, chartText));
card(s, 8.8, 1.5, 3.93, 2.25, "What the score means", "A grade from 0 to 1 for recognising all three kinds of week fairly. Random guessing scores about 0.33.", { bodySize: 15, titleSize: 17 });
card(s, 8.8, 3.95, 3.93, 2.4, "Why the random forest", "It was the only model clearly above guessing, and it scored 0.40 both on held-back parts of the textbook and on the practice exam: a consistent result, not a lucky one.", { bodySize: 14, titleSize: 17, fill: "FBEDE4" });

// ---------- 11. why RF ----------
s = content("What a random forest is, and why it won", S2);
const trees = [["Tree 1", "Up"], ["Tree 2", "Flat"], ["Tree 3", "Up"], ["… Tree 300", "Down"]];
trees.forEach(([t, v], i) => {
  const x = M + i * 1.62;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 1.45, h: 1.3, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
  text(s, t, { x, y: 1.7, w: 1.45, h: 0.45, fontSize: 15, bold: true, color: C.text1, align: "center" });
  text(s, "votes " + v, { x, y: 2.25, w: 1.45, h: 0.45, fontSize: 15, align: "center" });
});
s.addShape(pres.shapes.RIGHT_ARROW, { x: M + 6.5, y: 2.05, w: 0.45, h: 0.4, fill: { color: C.accent1 }, line: { color: C.accent1 } });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 7.1, y: 1.6, w: 5.03, h: 1.3, rectRadius: 0.1, fill: { color: "FBEDE4" }, line: { color: "FBEDE4" } });
text(s, "Tally of 300 votes → P(Up) 38%, P(Flat) 35%, P(Down) 27%", { x: M + 7.3, y: 1.6, w: 4.63, h: 1.3, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
card(s, M, 3.3, 3.93, 3.0, "Many simple flowcharts", "Each tree is a flowchart of yes/no questions (“Is the market jumpy? Is the price above its 200-day level?”), trained on a different random slice of history.", { bodySize: 15, titleSize: 18 });
card(s, M + 4.1, 3.3, 3.93, 3.0, "Combinations count", "Trees can learn that a signal matters only together with another one — something the simpler model can’t do.", { bodySize: 15, titleSize: 18 });
card(s, M + 8.2, 3.3, 3.93, 3.0, "Voting avoids memorising", "Gradient boosting scored 0.74 on its own training data but 0.32 on the practice exam: it memorised noise. The forest: 0.54 vs 0.40, a much smaller drop.", { bodySize: 15, titleSize: 18 });

// ---------- 12. final exam classifier ----------
pres.addSection({ title: S3 });
s = content("Final exam: good at spotting calm weeks, not direction", S3);
const cm = [[24, 29, 39], [20, 129, 58], [56, 72, 70]];
const rlab = ["Real down weeks (92)", "Real flat weeks (207)", "Real up weeks (198)"];
const clab = ["said Down", "said Flat", "said Up"];
const gx = M + 2.9, gy = 1.95, cwid = 1.55, chei = 1.05;
clab.forEach((c, j) => text(s, c, { x: gx + j * cwid, y: gy - 0.45, w: cwid, h: 0.4, fontSize: 15, bold: true, color: C.text1, align: "center" }));
cm.forEach((row, i) => {
  text(s, rlab[i], { x: M, y: gy + i * chei, w: 2.8, h: chei, fontSize: 15, bold: true, color: C.text1, valign: "middle" });
  row.forEach((v, j) => {
    const good = i === j;
    const fill = i === 1 && j === 1 ? HEX.accent1 : good ? "F6D2BC" : (i !== 1 && j !== 1 && i !== j) ? "D9E2F0" : HEX.lt2;
    s.addShape(pres.shapes.RECTANGLE, { x: gx + j * cwid, y: gy + i * chei, w: cwid - 0.06, h: chei - 0.06, fill: { color: fill }, line: { color: fill } });
    text(s, String(v), { x: gx + j * cwid, y: gy + i * chei, w: cwid - 0.06, h: chei - 0.06, fontSize: 24, bold: true, color: i === 1 && j === 1 ? C.background1 : C.text1, align: "center", valign: "middle" });
  });
});
text(s, "Orange: correct calls. Blue: up and down mixed up.", { x: M, y: 5.25, w: 7.6, h: 0.4, fontSize: 14, color: C.accent3 });
stat(s, 8.8, 1.4, 3.93, "0.41", "Final-exam score (0.40 on the practice exam). Best simple baseline: 0.31.", C.text1, 44);
stat(s, 8.8, 3.3, 3.93, "62%", "of flat weeks recognised correctly — almost all of its skill.", C.accent1, 44);
text(s, "Of 92 real down weeks, it called 39 “up”. Of 198 real up weeks, it called 56 “down”.", { x: 8.8, y: 5.25, w: 3.93, h: 1.1, fontSize: 15, color: C.accent2, bold: true });

// ---------- 13. trading rule ----------
s = content("Turning predictions into trades (v1’s rule)", S3);
const rules = [
  ["Model is more confident in Up than in Down, by 5+ points", "Be in the market", C.accent1],
  ["Model is more confident in Down than in Up, by 5+ points", "Move to cash", C.accent2],
  ["Neither", "Keep doing what you’re doing", C.accent3],
];
rules.forEach(([cond, act, col], i) => {
  const y = 1.6 + i * 1.15;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 7.0, h: 0.95, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
  text(s, cond, { x: M + 0.25, y, w: 6.5, h: 0.95, fontSize: 17, color: C.text1, valign: "middle" });
  s.addShape(pres.shapes.RIGHT_ARROW, { x: M + 7.15, y: y + 0.3, w: 0.45, h: 0.36, fill: { color: col }, line: { color: col } });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 7.75, y, w: 4.38, h: 0.95, rectRadius: 0.1, fill: { color: col }, line: { color: col } });
  text(s, act, { x: M + 7.95, y, w: 4.0, h: 0.95, fontSize: 19, bold: true, color: C.background1, valign: "middle" });
});
text(s, "Extra rule: after buying, stay in for at least 5 days. All in or all out — never part of the money.", { x: M, y: 5.15, w: CW, h: 0.5, fontSize: 16, color: C.text1 });
text(s, "Warning sign we had in advance: on the practice exam, this rule turned $100,000 into " + usd(V.model_final) + ". Buy & Hold made " + usd(V.bh_final) + ".", { x: M, y: 5.75, w: CW, h: 0.7, fontSize: 16, bold: true, color: C.accent1 });

// ---------- 14. where the money went ----------
s = content("Where the " + usd(gap) + " went", S3);
const where = [
  ["≈ $15,000", "One long pause", "Out of the market from December 2023 to April 2024 while it rose about 14%."],
  [Math.round(100 * (T.days - T.days_in) / T.days) + "% of days", "Too much time in cash", "On days the model sat out, the market rose just as much as on days it was in. Sitting out bought nothing."],
  [usd(T.model_fees), "Trading costs", "15 round trips at about $300 each, against $100 for buying once."],
];
where.forEach(([big, t, b], i) => {
  const x = M + i * 4.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 3.93, h: 3.2, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 } });
  text(s, big, { x: x + 0.25, y: 1.65, w: 3.45, h: 0.8, fontSize: 32, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "bottom" });
  text(s, t, { x: x + 0.25, y: 2.55, w: 3.45, h: 0.45, fontSize: 19, bold: true, color: C.text1, fontFace: THEME.headFontFace });
  text(s, b, { x: x + 0.25, y: 3.1, w: 3.45, h: 1.45, fontSize: 15 });
});
card(s, M, 4.85, CW, 1.6, "Costs were not the main reason", "With no broker fees at all, the model would have ended with about $127,500 — still about $29,000 behind Buy & Hold.", { bodySize: 15, titleSize: 17, fill: "FBEDE4" });

// ---------- 15. the real problem ----------
TITLES.push("The real problem (statement)");
s = pres.addSlide({ masterName: "Statement Dark", sectionTitle: S3 });
s.addText("The model could tell how big next week’s move would be — not which way it would go", { placeholder: "title" });
s.addText([
  { text: "It’s like a weather forecaster who can tell you tomorrow will be windy, but not which way the wind will blow — and we asked them to choose our sailing direction.", options: { breakLine: true } },
  { text: " ", options: { breakLine: true } },
  { text: "v1’s trading rule only used the “which way” part (Up vs Down). The model’s real skill — spotting calm weeks — was never used for a single trade.", options: { color: C.accent4 } },
], { placeholder: "body" });

// ---------- 16. v2 ----------
pres.addSection({ title: S4 });
s = content("What version 2 changes", S4);
const fixes = [
  ["Use all three predictions", "Combine Up, Flat and Down into one expected gain for next week. Trade only if it beats the ~$300 round-trip cost."],
  ["Test two default habits", "“Stay invested, step out only on strong warnings” vs “stay in cash, step in on strong signals”. The practice exam picks."],
  ["Measure what we can trade", "Predict from next morning’s price, when the trade actually happens, not today’s close."],
  ["Choose by money, not score", "Pick the model and the rule together, by money made on the practice exam after costs."],
  ["Test on 12 years, not 2", "Re-train each year and test 2013–2024 one year at a time, plus the same final exam."],
];
fixes.forEach(([t, b], i) => {
  const y = 1.5 + i * 1.02;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: CW, h: 0.92, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
  s.addShape(pres.shapes.OVAL, { x: M + 0.22, y: y + 0.22, w: 0.48, h: 0.48, fill: { color: C.accent1 }, line: { color: C.accent1 } });
  text(s, String(i + 1), { x: M + 0.22, y: y + 0.22, w: 0.48, h: 0.48, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
  text(s, t, { x: M + 0.9, y, w: 3.5, h: 0.92, fontSize: 17, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  text(s, b, { x: M + 4.5, y, w: CW - 4.75, h: 0.92, fontSize: 15, valign: "middle" });
});

// ---------- 17. proof ----------
s = content("How we’ll know if it really works", S4);
card(s, M, 1.5, 6.4, 4.95, "1,000 random “coin-flip” traders", "We create 1,000 fake traders who are in the market for the same number of days as our model, but on random days.\n\nIf our model doesn’t end with more money than at least 950 of them, its timing is no better than luck — whatever its final dollar amount.", { badge: "1", bodySize: 17, titleSize: 20, fill: "FBEDE4" });
card(s, M + 6.6, 1.5, 5.53, 1.55, "Cash earns interest", "In 2023–24, cash in Treasury bills earned about 5% a year. v1 assumed 0%.", { badge: "2", bodySize: 14, titleSize: 17 });
card(s, M + 6.6, 3.2, 5.53, 1.55, "Error bars, not single numbers", "Re-run the results on shuffled blocks of weeks to see how much they could vary by chance.", { badge: "3", bodySize: 14, titleSize: 17 });
card(s, M + 6.6, 4.9, 5.53, 1.55, "Trade-by-trade receipt", "For every exit: how much did the market move while we were out, in dollars?", { badge: "4", bodySize: 14, titleSize: 17 });

// ---------- 18. v2 results ----------
s = content("Version 2 results: $100,000, 2023–2024", S4);
const rrows = [
  [hdr("Strategy"), hdr("$100,000 became"), hdr("Profit"), hdr("Time in the market")],
  ["Buy & Hold", usd(BHT.final_value), "+" + usd(BHT.final_value - 100000), "100%"],
  ["Version 1 model", usd(T.model_final), "+" + usd(T.model_final - 100000), Math.round(100 * T.days_in / T.days) + "%"],
  ["Version 2 model", usd(V2T.final_value), "+" + usd(V2T.final_value - 100000), Math.round(100 * V2T.exposure) + "%"],
  ["Typical random trader (v2’s time in market)", usd(EV.random_median_final), "+" + usd(EV.random_median_final - 100000), Math.round(100 * V2T.exposure) + "%"],
];
s.addTable(rrows, Object.assign({ x: M, y: 1.5, w: 7.9, colW: [3.3, 1.75, 1.45, 1.4], fontSize: 15, rowH: 0.62, margin: [0.06, 0.1, 0.06, 0.1] }, TABLE));
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.75, y: 1.5, w: 3.98, h: 3.1, rectRadius: 0.12, fill: { color: "FBEDE4" }, line: { color: "FBEDE4" } });
text(s, String(pctBeat), { x: 8.95, y: 1.65, w: 3.6, h: 1.1, fontSize: 60, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "bottom" });
text(s, "of 1,000 random traders beaten by version 2. To show real skill it needed at least 950.", { x: 8.95, y: 2.85, w: 3.6, h: 1.5, fontSize: 16, color: C.text1 });
card(s, M, 4.8, CW, 1.68, "Version 2 also lost — and now we can prove it wasn’t bad luck", "Its timing was worse than most random traders who spent the same time in the market. Version 1’s problem was fixed, but there was no direction skill underneath to use.", { bodySize: 15, titleSize: 17 });

// ---------- 18b. walk-forward ----------
s = content("Twelve years, one year at a time", S4);
const yrs = R.walk_forward_yearly;
s.addChart(pres.charts.BAR, [{ name: "v2 minus Buy & Hold", labels: yrs.map((y) => String(y.year)), values: yrs.map((y) => Math.round(1000 * y["v2 − B&H"]) / 10) }], Object.assign({
  x: M, y: 1.4, w: 8.2, h: 5.0, barDir: "col", chartColors: yrs.map((y) => (y["v2 − B&H"] >= 0 ? HEX.accent1 : HEX.accent3)),
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "+0;-0", dataLabelFontSize: 12, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Version 2 minus Buy & Hold, percentage points per year (re-trained every January)",
}, chartText));
stat(s, 9.1, 1.5, 3.63, usd(WF.final_value), "$100,000 → version 2, 2013–2024", C.accent1, 40);
stat(s, 9.1, 3.2, 3.63, usd(WFB.final_value), "$100,000 → Buy & Hold, same 12 years", C.text1, 40);
text(s, "Ahead in only 2 of 12 years: 2016 and the 2022 downturn. Its worst fall was smaller (−22% vs −34%).", { x: 9.1, y: 5.0, w: 3.63, h: 1.4, fontSize: 15, color: C.text1 });

// ---------- 18c. why v2 lost ----------
s = content("Why version 2 still lost", S4);
card(s, M, 1.5, 3.93, 4.95, "It still stepped out too often", "Even the “stay invested” version was in the market only " + Math.round(100 * V2T.exposure) + "% of the time. It made " + V2T.round_trips + " round trips and paid " + usd(V2T.total_fees) + " in costs.", { badge: "1", bodySize: 16, titleSize: 18 });
card(s, M + 4.1, 1.5, 3.93, 4.95, "Its down-week odds were inflated", "We told the model to pay extra attention to rare down weeks. That helps its prediction score, but it also makes it overstate their chances, and down weeks are also the biggest moves (−2.8% on average vs +2.2% for up weeks). So the expected gain kept tipping negative.", { badge: "2", bodySize: 15, titleSize: 18, fill: "FBEDE4" });
card(s, M + 8.2, 1.5, 3.93, 4.95, "No direction skill underneath", "Its exits mostly missed gains, e.g. out from 6 Dec 2023 to 24 Jan 2024 while the market rose 6.8%. Its prediction score beat guessing only just (0.38 vs 0.32).", { badge: "3", bodySize: 16, titleSize: 18 });

// ---------- 18d. class imbalance ----------
s = content("Class imbalance: good for predictions, bad for odds", S4);
const mixRows = [
  ["Real mix of weeks, 2010–2020", [["Down 20%", 0.202, C.accent2], ["Flat 45%", 0.448, C.accent3], ["Up 35%", 0.35, C.accent1]]],
  ["What the model is trained to treat as normal, after balancing", [["Down 33%", 1 / 3, C.accent2], ["Flat 33%", 1 / 3, C.accent3], ["Up 33%", 1 / 3, C.accent1]]],
];
const barW = 8.3;
mixRows.forEach(([lab, segs], r) => {
  const y = 1.45 + r * 1.2;
  text(s, lab, { x: M, y, w: barW, h: 0.38, fontSize: 15, bold: true, color: C.text1 });
  let bx = M;
  segs.forEach(([t, share, col]) => {
    const w = barW * share;
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: y + 0.42, w: w - 0.04, h: 0.6, fill: { color: col }, line: { color: col } });
    text(s, t, { x: bx, y: y + 0.42, w: w - 0.04, h: 0.6, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle" });
    bx += w;
  });
});
card(s, 9.2, 1.45, 3.53, 2.25, "Good for predictions, bad for odds", "The model stops ignoring rare down weeks, but its odds of one come out inflated: 30% predicted vs 21% real.", { bodySize: 14, titleSize: 17, fill: "FBEDE4" });
const steps4 = [
  ["The brief", "Requires handling imbalance: SMOTE, class weights or thresholds."],
  ["Version 1", "Class weights. SMOTE and no weighting were tested; weights scored best."],
  ["Version 2", "Used the odds directly, so the inflated down-week odds kept it selling."],
  ["Version 3", "Keep the weights for training, then correct the odds before trading."],
];
const sw = (CW - 3 * 0.2) / 4;
steps4.forEach(([t, b], i) => {
  const x = M + i * (sw + 0.2);
  card(s, x, 4.0, sw, 2.45, t, b, { badge: String(i + 1), bodySize: 14, titleSize: 17 });
});

// ---------- v3a. calibration ----------
pres.addSection({ title: S4b });
s = content("Version 3: correct the odds first", S4b);
s.addChart(pres.charts.BAR, [{ name: "Average predicted chance of a down week", labels: ["v2 as it was", "No extra weight", "Weight, then undo it", "Fitted correction", "What really happened"], values: [30.3, 21.8, 21.5, 24.4, 20.7] }], Object.assign({
  x: M, y: 1.4, w: 7.4, h: 5.0, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.accent3, HEX.accent1, HEX.accent1, HEX.accent4, HEX.dk1],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\"%\"", valAxisMinVal: 0, valAxisMaxVal: 40, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "Average predicted chance of a down week, 2013–2022 (re-trained each year)",
}, chartText));
card(s, 8.3, 1.5, 4.43, 2.2, "On average: fixed", "Two simple corrections bring the predicted chance of a down week from 30% to about 21–22%, close to the real 21%.", { bodySize: 15, titleSize: 18, fill: "FBEDE4" });
card(s, 8.3, 3.9, 4.43, 2.55, "Year by year: not fixed", "The real share of down weeks swings (few in 2017, many in 2022). No correction stayed within 3 points in more than 4 of 10 years; our rule, set in advance, needed 8. So v3 failed its own calibration test.", { bodySize: 15, titleSize: 18 });

// ---------- v3b. development result ----------
s = content("With honest odds, the best rule is: don’t trade", S4b);
const dv = [["Buy & Hold", 316844], ["Pick: fitted correction, stay invested", 316844], ["No extra weight, stay invested", 249244], ["Weight then undo, stay invested", 245504], ["Fitted correction, stay in cash", 207355], ["No extra weight, stay in cash", 120871], ["Weight then undo, stay in cash", 118844]];
s.addChart(pres.charts.BAR, [{ name: "Value", labels: dv.map((d) => d[0]), values: dv.map((d) => d[1]) }], Object.assign({
  x: M, y: 1.4, w: 7.9, h: 5.0, barDir: "bar", catAxisOrientation: "maxMin",
  chartColors: [HEX.dk1, HEX.accent1, HEX.accent3, HEX.accent3, HEX.accent3, HEX.accent3, HEX.accent3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$#,##0", valAxisMinVal: 0, valAxisMaxVal: 400000, valAxisHidden: true,
  valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
  showTitle: true, title: "$100,000 invested 2013–2022, after costs (re-trained each year)",
}, chartText, { catAxisLabelFontSize: 12 }));
card(s, 8.8, 1.5, 3.93, 2.5, "The pick never sold", "Chosen by a rule fixed in advance. In ten years it never stepped out of the market: it is Buy & Hold, and it ties Buy & Hold.", { bodySize: 15, titleSize: 18, fill: "FBEDE4" });
card(s, 8.8, 4.2, 3.93, 2.25, "Every version that traded did worse", "Even the ones invested 95% of the time ended about $70,000 behind.", { bodySize: 15, titleSize: 18 });
text(s, "Still to come: the frozen pick on 2025–26 data and a live paper-trade from 13 Oct 2026.", { x: M, y: 6.5, w: CW, h: 0.35, fontSize: 13, italic: true, color: C.accent3 });

// ---------- honesty ----------
s = content("How we kept the test honest", S4b);
const hon = [
  ["Plans written before code", "Each version’s design was committed before any code or result existed, with a digital fingerprint (SHA-256) so later edits would show."],
  ["Final exam opened once", "Each version picked its model on earlier data, locked it, and only then saw the test years."],
  ["46 automated tests", "They check the model never sees the future, e.g. scrambling future data must not change any prediction."],
  ["Failures reported, not hidden", "Every change after results is logged, including a one-day overlap we found in v1’s work and v3 failing its own calibration test."],
];
hon.forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { badge: String(i + 1), bodySize: 15, titleSize: 18 });
});

// ---------- 18d. flaw of ML or of the question ----------
pres.addSection({ title: S5 });
s = content("A flaw of machine learning, or of the question?", S5);
const why = [
  ["Mostly the question", "We asked for next week’s direction of the world’s most-watched fund, using only its own public price history. Simple patterns there get traded away, and no algorithm can find information that isn’t in the data.", "FBEDE4"],
  ["Partly our own limits", "One fund, all in or all out, price data only, a one-week horizon. Lifting these makes the task easier, but wouldn’t flip the result: even with zero fees, v1 still lost.", C.background2],
  ["Where machine learning does help", "Ranking many assets against each other, forecasting risk to size positions, and using data most people don’t have. Even there the edges are usually small and shrink after costs.", C.background2],
  ["The fair bar", "Return for the risk taken, and beating random timing — not simply “more money than Buy & Hold”. That is how we judged every version.", C.background2],
];
why.forEach(([t, b, fill], i) => {
  const y = 1.5 + i * 1.25;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: CW, h: 1.12, rectRadius: 0.1, fill: { color: fill }, line: { color: fill } });
  text(s, t, { x: M + 0.3, y, w: 3.6, h: 1.12, fontSize: 19, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" });
  text(s, b, { x: M + 4.1, y, w: CW - 4.35, h: 1.12, fontSize: 16, valign: "middle" });
});

// ---------- 19. lessons ----------
s = content("What we learned", S5);
const lessons = [
  ["Size is predictable; direction isn’t", "Big-move weeks cluster together, so the model can see them coming. Which way they go is close to a coin flip."],
  ["Sitting in cash has a cost", "The market mostly goes up. Without real timing skill, every day out of the market loses money on average."],
  ["The past changes", "A signal that helped from 2010 to 2020 actually misled the model in 2022."],
  ["Good predictions ≠ good trades", "Settings that improve the prediction score can distort the odds a trading rule relies on. With honest odds (v3), the best rule was not to trade."],
];
lessons.forEach(([t, b], i) => {
  const x = M + (i % 2) * 6.15, y = 1.55 + Math.floor(i / 2) * 2.5;
  card(s, x, y, 5.98, 2.3, t, b, { badge: String(i + 1), bodySize: 16, titleSize: 18 });
});

// ---------- 20. close ----------
TITLES.push("Questions (closing)");
s = pres.addSlide({ masterName: "Statement Dark", sectionTitle: S5 });
s.addText("Questions?", { placeholder: "title" });
s.addText([
  { text: "$100,000 in 2023–24 → " + usd(T.bh_final) + " by waiting, " + usd(T.model_final) + " with v1, " + usd(V2T.final_value) + " with v2. With honest odds, v3’s best rule is not to trade.", options: { breakLine: true } },
  { text: " ", options: { breakLine: true } },
  { text: "github.com/TKCH121/spy", options: { fontSize: 18, color: C.accent4 } },
], { placeholder: "body" });

// ---------- speaker script (separate file): about 10 minutes, focused on the brief's deliverables ----------
// [tier, seconds, text]. Speak = say it; Flash = one line and move on; Skip = click past (backup for questions).
const SCRIPT_TEXT = {
  "Cover": ["Speak", 20, "We’re Group 7. Our question: with $100,000 in the US stock market, can a machine-learning model that decides each day whether to be in or out beat simply buying and waiting? The brief grades method, not profit, so we’ll show what we built and how we tested it."],
  "What we delivered": ["Speak", 40, "Here’s everything the brief asked for and where to find it. An exploratory notebook on the features and the class balance. A modelling notebook with lagged features, time-ordered splits and tuning. A realistic backtest with fees and slippage, plotted against Buy & Hold. And a lessons-learned report. On top of that, two improved versions, each planned before any code was written. Throughout, 46 automated tests check that nothing sees the future."],
  "The question in one picture": ["Flash", 10, "Option A: buy once and wait. Option B: the model decides every day, and pays a fee each time it switches."],
  "Five words you’ll hear today": ["Skip", 0, "Backup if the audience needs the terms: SPY, Buy & Hold, backtest, trading cost, drawdown."],
  ["The answer: buy-and-wait won by " + usd(gap)]: ["Speak", 25, `The answer up front, on the 2023–24 test period: $100,000 left alone grew to ${usd(T.bh_final)}. Our model grew it to ${usd(T.model_final)}, about ${usd(gap)} less, and paid ${usd(T.model_fees)} in trading costs. The brief expected this; the rest explains why.`],
  "The two-year journey of $100,000": ["Flash", 10, "Note the flat orange stretch: the model sat in cash from December 2023 to April 2024 while the market rose about 14%."],
  "How the model makes a decision, every evening": ["Speak", 25, "Every evening the model measures the market, predicts next week as up, down or flat, turns that into “in the market or in cash”, and trades at the next morning’s price. Deciding after the close and trading next morning means it never trades at a price it has already seen."],
  "What the model looks at: 15 measurements": ["Speak", 20, "The brief asked for returns, at least three technical indicators and a volatility measure, all lagged. We used 15: returns, moving averages, RSI, MACD, Bollinger bands, volatility and volume, each using only data up to that day."],
  "What the model predicts: what kind of week is next": ["Speak", 25, "The target uses the brief’s thresholds: up more than 1% in five days is Buy, down more than 1% is Sell, otherwise Hold. Down weeks are rare, about one in five, so the classes are imbalanced. We come back to that on slide 22."],
  "No cheating: textbook, practice exam, final exam": ["Speak", 45, "This is the core of the brief. No random shuffling: we train on 2010 to 2020, choose the model on 2021–22, lock everything, and only then open 2023–24, once. There’s a one-week buffer between periods, because each label looks a week ahead. Tuning used time-series cross-validation with the same buffer. Our accuracy, about 45%, sits in the range the brief calls normal: no sign of leakage."],
  "Choosing the model: the random forest scored best": ["Speak", 30, "We started with interpretable models, as the brief asks: logistic regression, random forest and gradient boosting, plus baselines. The rule, set in advance: best practice-exam macro-F1. The random forest won at 0.40; random guessing is about 0.33. Gradient boosting memorised its training data and did worse than guessing."],
  "What a random forest is, and why it won": ["Skip", 0, "Backup if asked: 300 decision trees vote; voting limits memorising (0.54 on training data vs 0.40 on the practice exam, against 0.74 vs 0.32 for gradient boosting)."],
  "Final exam: good at spotting calm weeks, not direction": ["Speak", 25, "On the final exam it scored 0.41, the same as on practice. But look where the skill is: it recognises calm weeks well, and mixes up up-weeks and down-weeks almost at random."],
  "Turning predictions into trades (v1’s rule)": ["Flash", 15, "The trading rule: in the market when the model leans “up”, cash when it leans “down”, otherwise no change. All in or all out."],
  ["Where the " + usd(gap) + " went"]: ["Speak", 35, "Where the money went. One long pause during a rally cost about $15,000. Overall it sat in cash 42% of the time, and those days were just as good as the days it was invested, so stepping out bought nothing. Costs were about $3,200, but even with zero fees it still trailed Buy & Hold. This is the core of our lessons-learned report."],
  "The real problem (statement)": ["Speak", 20, "The real problem: the model can tell how big next week’s move will be, not which way. And the trading rule only used the “which way” part. Its real skill never reached a trade."],
  "What version 2 changes": ["Speak", 20, "Version 2 fixes that. It turns all three predictions into one expected gain, trades only when that beats the cost, and picks the model by money made, not just by prediction score."],
  "How we’ll know if it really works": ["Skip", 0, "Backup if asked: v2 is also judged against 1,000 random traders with the same time in the market, with error bars, and with cash earning T-bill interest."],
  "Version 2 results: $100,000, 2023–2024": ["Speak", 25, `Version 2 ended with ${usd(V2T.final_value)}, no better than version 1. More telling: it beat only ${pctBeat} of 1,000 random traders who spent the same time in the market. Its timing was no better than luck.`],
  "Twelve years, one year at a time": ["Flash", 10, "Re-trained every year from 2013 to 2024, it was ahead of Buy & Hold in only two of twelve years."],
  "Why version 2 still lost": ["Skip", 0, "Backup if asked: it stepped out too often (in the market about half the time), its down-week odds were inflated, and there was little direction skill underneath."],
  "Class imbalance: good for predictions, bad for odds": ["Speak", 35, "The brief requires handling class imbalance. We used class weights, after testing SMOTE and no weighting in version 1. Balancing makes the model treat all three kinds of week as equally common, which is good for predictions. But it inflates the odds: the model predicted 30% down weeks against 21% in reality. Version 2 used those odds directly, so it kept selling."],
  "Version 3: correct the odds first": ["Speak", 20, "Version 3 keeps the weights for training, then corrects the odds. On average that works: 21% predicted vs 21% real. But it failed our own year-by-year test, set in advance, and we report that."],
  "With honest odds, the best rule is: don’t trade": ["Speak", 20, "With honest odds, the rule we chose in advance picked a version that never sold in ten years: it is Buy & Hold. Every version that traded did worse."],
  "How we kept the test honest": ["Speak", 25, "How we kept it honest: plans written and fingerprinted before any code, each final exam opened once, 46 automated look-ahead tests, and every change or failure logged rather than hidden."],
  "A flaw of machine learning, or of the question?": ["Speak", 25, "Is this a flaw of machine learning? Mostly it’s the question: predicting next week’s direction for the most-watched fund in the world from its own public prices. Machine learning helps elsewhere, like ranking many stocks or forecasting risk. That’s why our fair bar was beating random timing, not just beating Buy & Hold."],
  "What we learned": ["Speak", 20, "Four lessons: the size of a move is predictable, the direction isn’t; sitting in cash has a cost; the past changes; and good predictions don’t automatically make good trades."],
  "Questions (closing)": ["Flash", 10, "Everything is in the repository on screen. Thank you, and we’re happy to take questions."],
};
const missing = TITLES.filter((t) => !(t in SCRIPT_TEXT));
if (missing.length) throw new Error("no script for: " + missing.join(" | "));
const secs = TITLES.reduce((a, t) => a + SCRIPT_TEXT[t][1], 0);
const tierNote = { Speak: "", Flash: " · flash, one line", Skip: " · skip: click past" };
const md = [
  "# Presentation script — Can a computer beat “buy and wait”?",
  "",
  `Module 3 Group 7 · goes with \`SPY_Model_Presentation.pptx\` (${TITLES.length} slides) · **about ${Math.round(secs / 60)} minutes of speaking**, plus clicks and questions.`,
  "",
  "**Speak** slides carry the deliverables the brief grades. **Flash** slides get one line. **Skip** slides are there as backup for questions: click past them. Say it in your own words. Fill in the presenter names and date on slide 1.",
  "",
  "| Slide | Title | Tier | Time |",
  "|---|---|---|---|",
  ...TITLES.map((t, i) => `| ${i + 1} | ${t} | ${SCRIPT_TEXT[t][0]} | ${SCRIPT_TEXT[t][1] ? SCRIPT_TEXT[t][1] + " s" : "—"} |`),
  "",
  ...TITLES.flatMap((t, i) => {
    const [tier, sec, txt] = SCRIPT_TEXT[t];
    return [`## ${i + 1}. ${t}${tierNote[tier]}${sec ? ` (~${sec} s)` : ""}`, "", tier === "Skip" ? `_${txt}_` : txt, ""];
  }),
].join("\n");
fs.writeFileSync(SCRIPT_OUT, md);

pres.writeFile({ fileName: OUT }).then(async () => { await applyTheme(OUT, THEME); console.log("wrote", OUT, "and", SCRIPT_OUT); });
