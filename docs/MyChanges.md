# MyChanges

A running record of everything altered in HerCycle Kenya: what changed, why, and which files were touched. Open work lives in [fix.md](./fix.md).

> **Guiding principle:** HerCycle is a **screening tool, not a diagnostic tool**. All changes should keep it that way.

---

## Change 1: Assessment payload mapping fix (fix.md item 2)

**Problem:** `Results.jsx` built the `POST /assessments` body from answer keys that don't exist in the form (`cycleRegularity`, `hasAcne`, `hirsutism`, `alopecia`, `metabolic`, `familyPcos`). Most values fell back to defaults. `hasAcne` was also `true` for "no acne", because `Boolean('none')` is `true`.

**Files changed**

| File | Change |
|---|---|
| `src/utils/scoring.js` | Extracted the cycle-irregularity rule into an exported helper `isCycleIrregular(a)`, reused inside `scoreAssessment`. Added `buildAssessmentPayload(answers, score)`. |
| `src/pages/Results.jsx` | Replaced the inline payload block with `api.submitAssessment(buildAssessmentPayload(answers))` and updated the import. |

`scoreAssessment`'s behaviour is unchanged.

### Field map

| Payload field | Source (real answer keys) |
|---|---|
| `cycleRegularity` | `'irregular'` if `isCycleIrregular(answers)` (cycle length `<21`, `36-45`, `>45`, `varies`; or periods in last 12 months `4-7`, `1-3`, `none`; or `gone3mo === 'yes'`), otherwise `'regular'`. This is the raw rule, not the menarche-adjusted C1 criterion |
| `cycleLengthDays` | `null`. The form collects a bucket, not a number of days; the bucket is in `rawQuestionnaireData.cycleLength` |
| `hasAcne` | `acne` is `mild`, `moderate`, or `severe` |
| `hasHirsutism` | `excessHair === 'yes'` |
| `hasAlopecia` | `scalpThin === 'yes'` |
| `hasMetabolicDisorder` | `weightChange === 'yes'` or `skinPatches === 'yes'` (provisional, see notes) |
| `hasFamilyHistoryPcos` | `familyHistory === 'yes'` |
| `riskTier` | New. `'low'`, `'moderate'`, or `'high'` from `scoreAssessment` |
| `criteria` | New. `{ c1, c2, c3 }` booleans from `scoreAssessment` |
| `flagCount` | New. Number of criteria flagged (0 to 3) |
| `onMedication` | New. `true` if `onMedication === 'yes'` |
| `rawQuestionnaireData` | Unchanged. The full answers object. This is what is restored on login |

### Verification
- Ran `buildAssessmentPayload` on two sample answer sets (no signs, and several signs). Output matched the map above.
- Not yet run against the backend or in the full app (no backend info available yet).

### Notes and TODOs
- **TODO (blocked, no backend info yet):** confirm the backend accepts the new fields and doesn't reject unknown ones.
- **TODO (blocked, no backend info yet):** confirm the server-side PDF uses the same scoring logic, so the on-screen tier and the PDF tier can't disagree.
- **TODO (blocked, no backend info yet):** `hasMetabolicDisorder` is a screening-sign flag, not a diagnosis. The name reads like a diagnosis, so rename it (e.g. `hasMetabolicSigns`) once the backend schema is known.
- **NOTE:** `hasAcne` counts mild acne, but the C2 criterion only counts moderate or severe acne. This matches the old scoring behaviour. It is a clinical call to raise in the clinical review (fix.md item 7).


---

## Change 2: Fragile logic fixes (fix.md item 5)

**Problems:** logout relied on matching text in error messages; `Results.jsx` re-submitted the assessment on every visit and hid failures in the console; `ProtectedRoute` showed a blank screen while loading; PDF errors used `alert()`.

**Files changed**

| File | Change |
|---|---|
| `src/services/api.js` | New `ApiError` class (`status`, `isNetworkError`). All calls go through one `request()` helper. New `setUnauthorizedHandler()`: any 401 on an authenticated call triggers it. Login and register are excluded, since a 401 there means wrong credentials. Behaviour unchanged otherwise (same endpoints, same 5xx retry/backoff) |
| `src/context/AuthContext.jsx` | Registers `logout` as the unauthorized handler. Background `getMe()` logs out on `err.status` 401/403 instead of matching message text. `logout` also clears `hercycle_synced_assessment` |
| `src/App.jsx` | `ProtectedRoute` shows a spinner while the session loads, then relies on `isAuthenticated` (it no longer lets through a bare token with no user) |
| `src/pages/Results.jsx` | Assessment is saved once per distinct set of complete answers. Skips if incomplete, or if this device or the server's latest assessment already holds the same answers (so revisits and StrictMode don't create duplicates). Shows saving / saved / failed with a **Try again** button. Removed the unused `handleDownloadPdf` |
| `src/components/SummarySheet.jsx` | `alert()` replaced by an inline error message. Removed the unused `onDownload` prop |
| `src/i18n/en.json`, `src/i18n/sw.json` | Added `results.sync.{saving,saved,failed,retry}` and `results.pdfError` |

### How the save-once check works
`answersSignature(answers)` fingerprints the 13 answer keys. A save is skipped when:
- the answers are incomplete, or
- `localStorage['hercycle_synced_assessment']` holds the same `userId` and signature, or
- `user.latestAssessment.raw_questionnaire_data` (from the server) has the same signature.

Editing any answer changes the signature, so a new save happens. A failed save leaves the retry available and does not mark anything as synced.

### Verification
- `api.js` tested with a stubbed `fetch`: 401 on `getMe` calls the unauthorized handler once; 401 on `login` does not; 400 does not; a 500 is retried then succeeds; a network failure becomes `ApiError` with `isNetworkError: true`.
- `npm ci`, `oxlint` (no new warnings) and `npm run build` all pass.
- **Not yet tested in a browser** against a real backend.

### Notes and TODOs
- **TODO:** native-speaker review of the new Kiswahili strings (fix.md item 8).
- **NOTE:** error messages from the API layer are still English-only (e.g. the network error text). Login/Signup show them directly (fix.md item 12).
- **NOTE:** a cached user still renders protected pages immediately while `getMe()` verifies in the background. If the token is expired, the user is logged out and redirected moments later.
- New findings from this work were added as item 12 in fix.md. The most important: `/results` shows "No strong signs right now" when opened with empty answers, which conflicts with the screening-tool principle.
