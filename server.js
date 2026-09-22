const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { computeReport } = require("./calc");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "submissions.json");
const DOCTOR_USER = process.env.DOCTOR_USER || "doctor";
const DOCTOR_PASS = process.env.DOCTOR_PASS || "balrog2026";

// Generate a random token every time the server starts.
const AUTH_TOKEN = crypto.randomBytes(16).toString("hex");

if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}
function writeAll(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

app.use(express.json({ limit: "1mb" }));

// ---- Cookie-based Authentication Middleware ----
function requireDoctorAuth(req, res, next) {
  const cookieHeader = req.headers.cookie || "";
  if (cookieHeader.includes(`balrog_auth=${AUTH_TOKEN}`)) {
    return next(); // Authenticated
  }

  // If not authenticated:
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    return res.redirect("/login.html");
  }
}

// ---- Login & Logout API Endpoints ----
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === DOCTOR_USER && password === DOCTOR_PASS) {
    // Set a secure cookie valid for 24 hours
    res.setHeader("Set-Cookie", `balrog_auth=${AUTH_TOKEN}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict`);
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/logout", (req, res) => {
  res.setHeader("Set-Cookie", `balrog_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict`);
  return res.json({ success: true });
});


app.get("/doctor", requireDoctorAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "doctor.html"));
});
app.get("/doctor.html", requireDoctorAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "doctor.html"));
});
app.use("/api/doctor", requireDoctorAuth);

// ---- Static assets (parent-facing & assets) ----
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "parent.html"));
});

// ---- Parent submits the form ----
app.post("/api/submit", (req, res) => {
  const sub = req.body || {};
  if (!sub.childName || !sub.dob || !sub.weight || !sub.height) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  let report;
  try {
    report = computeReport(sub);
  } catch (e) {
    return res.status(400).json({ error: "Could not compute report. Check date of birth." });
  }

  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    parentName: sub.parentName || "",
    mobile: sub.mobile || "",
    email: sub.email || "",
    childName: sub.childName,
    sex: sub.sex || "",
    dob: sub.dob,
    birthWeight: sub.birthWeight || "",
    weight: sub.weight,
    height: sub.height,
    head: sub.head || "",
    muac: sub.muac || "",
    milestones: sub.milestones || {},
    screen: sub.screen || "",
    sleep: sub.sleep || "",
    concerns: sub.concerns || [],
    report
  };

  const all = readAll();
  all.push(record);
  writeAll(all);

  res.json({ id: record.id, report, childName: record.childName, dob: record.dob, sex: record.sex, parentName: record.parentName, mobile: record.mobile });
});

// ---- parent can re-fetch their own report ----
app.get("/api/report/:id", (req, res) => {
  const all = readAll();
  const rec = all.find((r) => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: "Not found." });
  res.json({ id: rec.id, report: rec.report, childName: rec.childName, dob: rec.dob, sex: rec.sex, parentName: rec.parentName, mobile: rec.mobile, submittedAt: rec.submittedAt });
});

// ---- doctor: list submissions ----
app.get("/api/doctor/list", (req, res) => {
  const all = readAll();
  const dateStr = req.query.date || istDateString(new Date());
  const filtered = all.filter((r) => istDateString(new Date(r.submittedAt)) === dateStr);
  filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  res.json({ date: dateStr, count: filtered.length, submissions: filtered });
});

function istDateString(d) {
  const ist = new Date(d.getTime() + (5.5 * 60 - d.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}

app.get("/healthz", (req, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log(`Balrog Department screening app running on port ${PORT}`);
});