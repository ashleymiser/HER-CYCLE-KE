// Raw answer values per field (translation labels come from i18n at render time)
// and which accent color each section uses.

export const SECTION_ACCENT = {
  1: 'sage',
  2: 'rust',
  3: 'amber',
  4: 'plum',
}

const YES_NO = ['yes', 'no']

export const FIELD_VALUES = {
  menarcheYears: ['<1', '1-3', '>3'],
  cycleLength: ['<21', '21-35', '36-45', '>45', 'varies'],
  periodsLast12: ['8+', '4-7', '1-3', 'none'],
  gone3mo: YES_NO,
  acne: ['none', 'mild', 'moderate', 'severe'],
  excessHair: YES_NO,
  scalpThin: YES_NO,
  priorHormone: ['none', 'normal', 'high'],
  weightChange: YES_NO,
  skinPatches: YES_NO,
  familyHistory: YES_NO,
  toldPCO: YES_NO,
  onMedication: YES_NO,
}

// Fields whose options are just yes/no use the shared common.yes / common.no
// translation instead of a per-field options object.
export const BINARY_FIELDS = new Set([
  'gone3mo',
  'excessHair',
  'scalpThin',
  'weightChange',
  'skinPatches',
  'familyHistory',
  'toldPCO',
  'onMedication',
])

// Translates a stored answer value (e.g. "36-45", "yes") into its display
// label. Shared by the on-screen question options and the PDF export so
// they can never drift apart.
export function fieldLabel(t, field, value) {
  if (!value) return ''
  if (BINARY_FIELDS.has(field)) return t(`common.${value}`)
  return t(`assessment.questions.${field}.options.${value}`)
}
