const fs = require("fs");
const path = require("path");

const MILESTONES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public", "data", "milestones.json"), "utf8")
);

function ageInMonths(dobStr, atDate) {
  const dob = new Date(dobStr);
  const now = atDate || new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months--;
  return Math.max(0, months);
}

function formatAge(m) {
  const y = Math.floor(m / 12);
  const rem = m % 12;
  if (y <= 0) return `${rem} month${rem === 1 ? "" : "s"}`;
  return `${y} yr${y === 1 ? "" : "s"}${rem ? ` ${rem} mo` : ""}`;
}

function pickBand(ageMonths) {
  for (const b of MILESTONES) {
    if (ageMonths >= b.min && ageMonths < b.max) return b;
  }
  return ageMonths >= 60 ? MILESTONES[MILESTONES.length - 1] : MILESTONES[0];
}

// growth reference formulas, as supplied by the clinic
function expectedWeight(ageMonths) {
  const y = ageMonths / 12;
  if (ageMonths >= 3 && ageMonths <= 12) return (ageMonths + 9) / 2;
  if (ageMonths > 12 && y <= 6) return y * 2 + 8;
  if (y > 6 && y <= 12) return (y * 7 - 5) / 2;
  return null;
}

function expectedHeight(ageMonths) {
  const y = ageMonths / 12;
  if (ageMonths <= 12) return 50 + (75 - 50) * (ageMonths / 12); // birth(50cm) -> 1yr(75cm)
  if (y > 1 && y <= 12) return y * 6 + 77;
  return null;
}

function deviationCategory(actual, expected) {
  if (expected === null || expected === undefined || actual === null || isNaN(actual)) return null;
  const dev = ((actual - expected) / expected) * 100;
  const absDev = Math.abs(dev);
  const cat = absDev <= 10 ? "green" : absDev <= 20 ? "amber" : "red";
  return { dev, cat };
}

const RANK = { green: 0, amber: 1, red: 2 };
function worse(a, b) {
  if (!a) return b;
  if (!b) return a;
  return RANK[a] >= RANK[b] ? a : b;
}

function computeReport(sub) {
  const m = ageInMonths(sub.dob);
  const y = m / 12;

  const eW = expectedWeight(m);
  const eH = expectedHeight(m);
  const actualW = parseFloat(sub.weight);
  const actualH = parseFloat(sub.height);
  const wRes = deviationCategory(actualW, eW);
  const hRes = deviationCategory(actualH, eH);
  const growthCat = worse(wRes ? wRes.cat : null, hRes ? hRes.cat : null) || "green";

  const band = pickBand(m);
  const total = band.items.length;
  const metCount = band.items.filter((it) => sub.milestones && sub.milestones[it.en]).length;
  const devPct = total ? Math.round((metCount / total) * 100) : 0;
  const devCat = devPct >= 80 ? "green" : devPct >= 50 ? "amber" : "red";

  const concerns = Array.isArray(sub.concerns) ? sub.concerns : [];
  const concernFlag = concerns.length > 0 && !(concerns.length === 1 && concerns[0] === "None");
  const sleepHrs = parseFloat(sub.sleep);
  const sleepMin = y < 1 ? 12 : y < 3 ? 11 : 10;
  const sleepMax = y < 1 ? 16 : y < 3 ? 14 : 13;
  const sleepFlag = !isNaN(sleepHrs) && (sleepHrs < sleepMin || sleepHrs > sleepMax + 2);
  const screenFlag = (y < 2 && sub.screen !== "lt1") || (y >= 2 && (sub.screen === "2-4" || sub.screen === "gt4"));
  let behaviourCat = "green";
  if (concernFlag) behaviourCat = "red";
  else if (sleepFlag || screenFlag) behaviourCat = "amber";

  const overall = worse(worse(growthCat, devCat), behaviourCat);

  return {
    ageMonths: m,
    ageLabel: formatAge(m),
    bandKey: band.key,
    bandLabelEn: band.label_en,
    bandLabelMr: band.label_mr,
    weight: { actual: actualW, expected: eW, cat: wRes ? wRes.cat : null, deviationPct: wRes ? Math.round(wRes.dev) : null },
    height: { actual: actualH, expected: eH, cat: hRes ? hRes.cat : null, deviationPct: hRes ? Math.round(hRes.dev) : null },
    head: sub.head ? parseFloat(sub.head) : null,
    muac: sub.muac ? parseFloat(sub.muac) : null,
    development: { metCount, total, pct: devPct, cat: devCat, items: band.items },
    behaviour: { screen: sub.screen || null, sleepHours: isNaN(sleepHrs) ? null : sleepHrs, concerns, sleepFlag, screenFlag, cat: behaviourCat },
    growthCat,
    overall
  };
}

module.exports = { MILESTONES, ageInMonths, formatAge, pickBand, computeReport };
