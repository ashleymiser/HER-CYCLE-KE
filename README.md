# HerCycle Kenya

A PMOS (Polyendocrine Metabolic Ovarian Syndrome — formerly known as PCOS)
awareness and screening platform built for teen girls in Kenya. Users work
through a short questionnaire scored against the Rotterdam criteria, get a
plain-language likelihood tier (low / moderate / high), and can download or
print a doctor-ready summary sheet to bring to a clinician.

Built for the [AfyaVentures](#) health innovation program.

## What's here

- **Frontend**: React + Vite, fully functional
- **Backend**: not yet built — see [Status](#status) below

## Getting started

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## App flow

The routes are meant to be walked in order — most pages redirect back to
`/` if no language has been chosen yet:

```
/            Choose language (English / Kiswahili)
/landing     Marketing landing page — what PMOS is, what HerCycle does
/signup      Name + Contact (currently local only, no backend yet)
/home        Intro screen before the assessment starts
/assessment  4-section questionnaire, autosaves as you go
/results     Risk tier + summary sheet (downloadable PDF / printable)
```

## Translations (i18n)

Text lives in `src/i18n/en.json` and `src/i18n/sw.json`, loaded via
`useLanguage()` from `src/context/LanguageContext.jsx` — no external i18n
library, just plain JSON + a `t('some.nested.key')` lookup.

**Both files must stay structurally identical** — same keys, same nesting,
just different values. If you add a new string anywhere in the app, add it
to *both* files in the same place. A key missing from one file will just
silently render as the raw key path on screen (e.g. `landing.footer`)
rather than crashing, so it's easy to miss — check both languages when you
add copy.

## Data & state

- `src/context/LanguageContext.jsx` — current language, persisted to
  `localStorage`
- `src/context/AssessmentContext.jsx` — assessment answers, also
  autosaved to `localStorage` so someone can close the tab mid-assessment
  and resume at the right section later. This only works on the same
  browser/device — see Status below for what full cross-device resume
  needs.

## Status

**Working:**
- Full assessment flow, Rotterdam-criteria scoring, results tier
- PDF download + print of the doctor-ready summary sheet
- English/Swahili throughout
- Resume-in-progress assessment (same browser only, via `localStorage`)

**Not built yet — backend needed:**
- Real user accounts (signup currently just captures Name/Contact locally,
  doesn't persist or connect to anything)
- Cross-device resume — save/fetch assessment progress tied to a real
  account instead of just this browser's `localStorage`
- Doctor directory + WhatsApp contact (`wa.me` links, no API needed)
- Partner pharmacy discount referrals

**Known rough edges:**
- No dedicated error page yet
- Some styling/color polish still pending
