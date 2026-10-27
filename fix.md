# HerCycle Kenya: Fix List

Status key: `[ ]` open, `[x]` done. Priority: **P0** blocks launch, **P1** should fix soon, **P2** cleanup.

---

## From the initial review

### 1. README out of date with the code (P1)
- [ ] Update "Status" to reflect what exists now: auth (`/auth/login`, `/auth/register`), `/patient/me`, `/assessments`, `/reports/doctor-summary`, `/gynecologists`
- [ ] Remove "signup is local only" and "backend not built" wording
- [ ] Document the backend (repo link or contract), since it is not in this repo
- [ ] Document env vars: `VITE_API_URL` (default `http://localhost:5000/api`)
- [ ] Fix the app-flow section: `/login` is missing, and `/home`, `/assessment`, `/results` are now protected
- [ ] Clarify the Supabase mention in `Results.jsx` comments: is it actually used?

### 2. Assessment payload mismatch in `Results.jsx` (P0)
Real answer keys are `cycleLength`, `periodsLast12`, `gone3mo`, `acne`, `excessHair`, `scalpThin`, `priorHormone`, `weightChange`, `skinPatches`, `familyHistory`, `toldPCO`, `onMedication`. The submit code reads keys that don't exist (`cycleRegularity`, `hasAcne`, `hirsutism`, `alopecia`, `metabolic`, `familyPcos`).
- [x] Decide the source of truth: backend reads `rawQuestionnaireData` only, or the frontend sends correct derived fields *(frontend now sends both; raw data stays authoritative)*
- [x] Fix `hasAcne`: currently `Boolean(answers.acne)` is `true` for `'none'` (non-empty string) *(now true only for mild/moderate/severe)*
- [x] Map `cycleRegularity` and `cycleLengthDays` from real fields, or drop them *(regularity mapped; days sent as `null` because the form only collects a bucket)*
- [x] Map `hasHirsutism` from `excessHair === 'yes'`
- [x] Map `hasAlopecia` from `scalpThin === 'yes'`
- [x] Map `hasFamilyHistoryPcos` from `familyHistory === 'yes'`
- [x] Map `hasMetabolicDisorder` from real fields (`weightChange`, `skinPatches`, `priorHormone`), once the meaning is agreed *(provisional: `weightChange` or `skinPatches` = yes; needs confirming)*
- [x] Also send the computed `tier`, `c1`, `c2`, `c3` so the server doesn't have to re-derive them differently *(sent as `riskTier`, `criteria`, `flagCount`, `onMedication`; backend must accept them)*
- [ ] Confirm the backend's PDF uses the same scoring logic as `scoring.js` (no drift between on-screen tier and PDF tier)

### 3. Authentication is name + phone only (P0)
Anyone who knows a girl's name and number can log in and read her health data. Users are minors.
- [ ] Choose a scheme: SMS OTP (suits Kenya, no password to remember), or PIN/password
- [ ] Rate-limit login attempts server-side
- [ ] Remove the `autoComplete="new-password"` hacks on non-password fields in `Login.jsx`
- [ ] Review the `hercycle_saved_profiles` suggestion list: it stores names and phone numbers in `localStorage`, which is a privacy risk on shared or family devices
- [ ] Add logout button/flow visible in the app (confirm it exists in the UI)
- [ ] Decide on parental-consent handling for under-18 users (legal and ethical review)

### 4. Token storage in `localStorage` (P1)
- [ ] Evaluate httpOnly, Secure, SameSite cookies instead of `localStorage` for the token
- [ ] If staying with `localStorage`: add a Content-Security-Policy header in `vercel.json`, set short token expiry, and add refresh logic
- [ ] Stop caching the full user and `latestAssessment` (health data) in `localStorage` longer than needed
- [ ] Clear `hercycle-assessment-answers` and all `hercycle_*` keys on logout (currently only user, token and last_assessment are cleared)

### 5. Fragile logic (P1)
- [ ] `AuthContext`: logout on 401/403 is detected by searching the **error message text**. Make `api.js` throw an error carrying `status`, and check that instead
- [ ] `Results.jsx`: submission effect depends on `[answers]` and is guarded by a ref, so re-visits and StrictMode behave oddly. Submit on explicit "finish" in `Assessment.jsx`, or key by assessment id
- [ ] Failed submission is only `console.warn`ed, so the user never knows it didn't save. Add a visible retry or "not saved" state
- [ ] `ProtectedRoute` trusts the mere presence of a token string. Validate against `getMe()` before rendering protected pages, or at least handle expiry gracefully
- [ ] `alert()` used for PDF errors. Replace with an inline error component
- [ ] `ProtectedRoute` returns `null` while loading (blank flash). Show a spinner

### 6. Leftovers and cleanup (P2)
- [ ] Remove `jspdf` from `package.json` if the PDF stays server-generated (it is unused)
- [ ] `api.getGynecologists()` is defined but never called: wire up the doctor directory or remove it
- [ ] Delete the stray `git` file in the repo root (contents: `master to main`)
- [ ] Remove `src/assets/vite.svg` and the unused `public/icons.svg` if not referenced
- [ ] Remove the leading space/indent at the top of `AuthContext.jsx`
- [ ] Check `AssessmentContext`: `resetAnswers` and `clearSavedDraft` are identical, so merge them
- [ ] Mixed code style (semicolons in `api.js` and `AuthContext`, none elsewhere): pick one and add a formatter

### 7. Clinical review of scoring (P0 before any real-world use)
- [ ] Get a clinician or clinical advisor to review `scoring.js` (the file's own comment calls for this)
- [ ] Confirm the adolescent adjustments (menarche under 1 year, 1–3 years, over 3 years) against current adolescent PCOS guidance
- [ ] Confirm that cycle-length cutoffs (`<21`, `36-45`, `>45`) and the period-count rules are clinically sound
- [ ] Review the medication caveat wording
- [ ] Review the tier wording in `en.json` and `sw.json` so "Higher likelihood" language is appropriate for teens
- [ ] Replace the "Prototype for internal validation only" disclaimer with approved final wording before public launch
- [ ] Add unit tests for `scoreAssessment` covering each menarche bracket and each criterion

---

## Additional items spotted while reading

### 8. i18n (P1)
- [ ] Add a script or CI check that `en.json` and `sw.json` have identical key structure (the README says this is a manual rule)
- [ ] Missing keys silently render as raw paths (e.g. `landing.footer`): log a dev warning in `t()`
- [ ] `Assessment.jsx` detects missing help text with `help.startsWith('assessment.')`, which is brittle. Have `t()` return `null` or accept a fallback argument
- [ ] Have a native Kiswahili speaker review the translations, especially the medical wording
- [ ] Several hard-coded English fallbacks exist (e.g. "Please enter both your name and phone number."). Move them to i18n

### 9. Input validation (P1)
- [ ] Validate phone number format (Kenyan formats: `07xx`, `01xx`, `+254`) and normalise before sending
- [ ] Trim and length-limit the name field
- [ ] Handle duplicate registration (409) with a clear message and a link to log in

### 10. Product gaps from the README (P2)
- [ ] Cross-device resume of in-progress assessments (needs a draft-save endpoint; currently only completed assessments sync)
- [ ] Doctor directory with `wa.me` WhatsApp links
- [ ] Partner pharmacy discount referrals
- [ ] Dedicated error page (404 currently redirects silently to `/`)
- [ ] Styling and colour polish pass

### 11. Quality and ops (P2)
- [ ] No tests at all: add Vitest and React Testing Library for scoring, the assessment flow, and auth guards
- [ ] Add a CI workflow running `npm run lint` and `npm run build`
- [ ] `vite.config.js` `manualChunks` matches `'react'` by substring, so `react-router-dom` and `lucide-react` can land in `vendor-react`. Verify with a bundle analysis
- [ ] Add an `.env.example` file
- [ ] Accessibility check: keyboard focus on option buttons, colour contrast, screen reader labels on the `CycleRing`
- [ ] Add analytics/error monitoring that does not capture health answers

---

## Suggested order of work
1. Item 2 (payload mismatch): quick, and data correctness depends on it
2. Item 5 (fragile logic): small fixes with real user impact
3. Item 3 and 4 (auth and token handling): needs a decision on OTP vs PIN first
4. Item 7 (clinical review): start early, since it depends on other people
5. Items 1, 6, 8, 9, then 10 and 11
