// Rotterdam-criteria proxy scoring.
// NOTE: True Rotterdam criteria requires an ultrasound finding of polycystic
// ovaries, which a self-report form can't independently verify — here,
// Criterion 3 relies on the person reporting a prior clinical diagnosis.
// This is a screening estimate, not a diagnosis. Revisit with a clinical
// advisor before this ships (see Day 4 plan).

export const initialAnswers = {
  menarcheYears: '',
  cycleLength: '',
  periodsLast12: '',
  gone3mo: '',
  acne: '',
  excessHair: '',
  scalpThin: '',
  priorHormone: '',
  weightChange: '',
  skinPatches: '',
  familyHistory: '',
  toldPCO: '',
  onMedication: '',
}

export const SECTION_FIELDS = {
  1: ['menarcheYears', 'cycleLength', 'periodsLast12', 'gone3mo'],
  2: ['acne', 'excessHair', 'scalpThin', 'priorHormone'],
  3: ['weightChange', 'skinPatches', 'familyHistory', 'toldPCO'],
  4: ['onMedication'],
}

export function isSectionComplete(answers, sectionIndex) {
  const fields = SECTION_FIELDS[sectionIndex]
  if (!fields) return true
  return fields.every((f) => Boolean(answers[f]))
}

export function scoreAssessment(a) {
  const irregular =
    ['<21', '36-45', '>45', 'varies'].includes(a.cycleLength) ||
    ['4-7', '1-3', 'none'].includes(a.periodsLast12) ||
    a.gone3mo === 'yes'

  let c1 = false
  if (a.menarcheYears === '>3') {
    c1 = irregular
  } else if (a.menarcheYears === '1-3') {
    c1 =
      irregular &&
      (a.gone3mo === 'yes' ||
        a.periodsLast12 === 'none' ||
        ['<21', '>45'].includes(a.cycleLength))
  } else {
    c1 = false // <1 year: too early to weigh cycle irregularity
  }

  const c2 =
    ['moderate', 'severe'].includes(a.acne) ||
    a.excessHair === 'yes' ||
    a.scalpThin === 'yes' ||
    a.priorHormone === 'high'

  const c3 = a.toldPCO === 'yes'

  const flagCount = [c1, c2, c3].filter(Boolean).length

  let tier
  if (flagCount >= 2) tier = 'high'
  else if (flagCount === 1) tier = 'moderate'
  else tier = 'low'

  return {
    c1,
    c2,
    c3,
    flagCount,
    tier, // 'high' | 'moderate' | 'low'
    medicationCaveat: a.onMedication === 'yes',
  }
}
