# Balrog Department — Child Growth & Development Screening

A bilingual (English + Marathi) parent-facing screening app for children 0–5 years.
Parents scan a QR code, fill the form on their own phone, get an instant report they
can download as a PDF, and every submission is recorded for the doctor's daily review.

## What's inside

- **Parent form** (`/`) — 5-step wizard: parent details → child details → growth
  measurements → age-matched development checklist → behaviour. Every label, option
  and message is shown in English with Marathi underneath.
- **Instant report** — growth compared against standard age-based reference formulas,
  a development score, a behaviour summary, a result with parent advice, and
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
for the dashboard (default login: `doctor` / `balrog2026`)




