# Balrog Department — Child Growth & Development Screening

A bilingual (English + Marathi) parent-facing screening app for children 0–5 years.
Parents scan a QR code, fill the form on their own phone, get an instant report they
can download as a PDF, and every submission is recorded for the doctor's daily review.

## What's inside

- **Parent form** (`/`) — 5-step wizard: parent details → child details → growth
  measurements → age-matched development checklist → behaviour. Every label, option
  and message is shown in English with Marathi underneath.
- **Instant report** — growth compared against standard age-based reference formulas,
  a development score, a behaviour summary, a 🟢/🟡/🔴 result with parent advice, and
  a screening (not diagnosis) disclaimer. Downloadable as a PDF from the parent's phone.
- **Doctor dashboard** (`/doctor`, password-protected) — pick any date to see total
  screened, counts by result colour, a tally of reported concerns, and every child's
  full evaluation (expand to see exact measurements and which milestones were checked).
  Includes a printable QR code linking to the parent form, so you can put a fresh one
  up any time the URL changes.
- **Storage** — every submission is saved on the server (`data/submissions.json`), so
  it survives across different parents' phones and is there whenever the doctor opens
  the dashboard.

## Running locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` for the parent form and `http://localhost:3000/doctor`
for the dashboard (default login: `doctor` / `balrog2026` — change this before real use,
see below).

## Deploying to Render (free tier)

1. Push this folder to a GitHub repo (or use Render's "Deploy from a public Git
   repository" with any repo host).
2. On [render.com](https://render.com), click **New → Web Service** and connect the repo.
3. Settings:
   - **Environment**: Node
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Add environment variables (Render dashboard → Environment):
   - `DOCTOR_USER` — the doctor login username
   - `DOCTOR_PASS` — the doctor login password
   (If you skip this, it falls back to `doctor` / `balrog2026` — fine for testing,
   **not** for a real front-desk deployment.)
5. Deploy. Render gives you a URL like `https://your-app.onrender.com`.
6. Open `https://your-app.onrender.com/doctor`, scroll to **Parent intake QR**, and
   print that QR code for the front desk. It always points at the form on this deployment.

### A note on Render's free tier
Free web services spin down after inactivity and spin back up on the next request
(the first request after idle can take ~30–60 seconds), and the filesystem is not
guaranteed to persist across a redeploy or restart. That's fine for a temporary/demo
setup. For anything longer-term, either upgrade to a paid instance with a persistent
disk, or swap the simple JSON file storage in `server.js`/`calc.js` for a real database
(e.g. Render's free Postgres) — the `readAll()`/`writeAll()` functions in `server.js`
are the only place that would need to change.

## Changing the growth/development reference values

- Growth formulas live in `calc.js` (`expectedWeight`, `expectedHeight`).
- Development milestones (by age band, English + Marathi) live in
  `public/data/milestones.json` — edit or add items there and both the parent form and
  the doctor dashboard pick it up automatically.
- Interpretation thresholds (what counts as green/amber/red) are also in `calc.js`.

## Project structure

```
server.js              Express app, routes, auth, storage
calc.js                Growth & development scoring logic (single source of truth)
public/
  parent.html/.js       Parent-facing wizard + report
  doctor.html/.js        Doctor dashboard
  styles.css             Shared pediatric blue/green theme
  illustrations.js       Inline SVG illustrations (mascot, growth plant, clouds, QR-ready)
  data/milestones.json   Bilingual age-banded development milestones
data/submissions.json  All recorded screenings (created automatically)
```
