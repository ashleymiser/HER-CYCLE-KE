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
