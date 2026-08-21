import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { SECTION_FIELDS } from '../utils/scoring'
import { fieldLabel } from '../utils/fieldConfig'

// Doctor-ready summary sheet: shown only when printed (Ctrl/Cmd+P) or
// downloaded as a PDF — never rendered inline in normal browsing, so it
// doesn't duplicate the tier/criteria preview already shown on the Results
// page above it.
//
// Pulls all its labels from the app's existing translation system
// (results.*, assessment.questions.*, common.yes/no) via the `t` function
// and `fieldLabel` helper, rather than a separate i18n block — so it can
// never drift out of sync with the on-screen copy.

const PDF_COLORS = {
  plum: [61, 38, 69],
  soft: [107, 82, 113],
  rust: [192, 103, 75],
  amber: [201, 154, 62],
  sage: [122, 139, 105],
  line: [228, 215, 196],
}

function tierColor(tier) {
  if (tier === 'high') return PDF_COLORS.rust
  if (tier === 'moderate') return PDF_COLORS.amber
  return PDF_COLORS.sage
}

// jsPDF's built-in fonts aren't embedded in the PDF — they rely on whatever
// font the PDF viewer substitutes, and not every viewer maps extended
// punctuation (em dashes, curly quotes) correctly. Since we can't control
// what's installed on every doctor's machine, strip these to plain ASCII
// for anything going into the downloaded PDF specifically (the on-screen /
// printed version below is unaffected — that's real browser text).
function sanitizeForPdf(text) {
  return String(text)
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, '-')
    .replace(/\u00b7/g, ' - ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
}

export default function SummarySheet({ t, language, answers, score }) {
  const [downloading, setDownloading] = useState(false)
  const { c1, c2, c3, flagCount, tier, medicationCaveat } = score

  const formattedDate = new Date().toLocaleDateString(
    language === 'sw' ? 'sw-KE' : 'en-KE',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const tierLabel = t(`results.tier.${tier}`)
  const criteriaDetails = [
    { label: t('results.criteria.c1'), met: c1 },
    { label: t('results.criteria.c2'), met: c2 },
    { label: t('results.criteria.c3'), met: c3 },
  ]

  const sections = [1, 2, 3, 4].map((n) => ({
    title: t(`assessment.sections.${n}.label`),
    fields: SECTION_FIELDS[n],
  }))

  function handlePrint() {
    window.print()
  }

  function handleDownloadPdf() {
    setDownloading(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 48
      let y = 60

      const addLine = (text, size = 11, bold = false, color = PDF_COLORS.plum) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setFontSize(size)
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(sanitizeForPdf(text), pageWidth - margin * 2)
        doc.text(lines, margin, y)
        y += lines.length * (size * 1.35) + 6
      }

      const addRule = () => {
        y += 4
        doc.setDrawColor(...PDF_COLORS.line)
        doc.line(margin, y, pageWidth - margin, y)
        y += 16
      }

      const checkPageBreak = (needed = 60) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage()
          y = 60
        }
      }

      // Header
      doc.setFillColor(...PDF_COLORS.plum)
      doc.rect(0, 0, pageWidth, 6, 'F')
      addLine('HerCycle Kenya \u2014 PCOS Screening Summary', 16, true, PDF_COLORS.plum)
      addLine(formattedDate, 10, false, PDF_COLORS.soft)
      addRule()

      // Risk result
      addLine(`${tierLabel}`, 14, true, tierColor(tier))
      addLine(t('results.criteriaFlagged', { count: flagCount }), 11)
      y += 6

      if (medicationCaveat) {
        addLine(t('results.medicationCaveat'), 9.5, false, PDF_COLORS.amber)
        y += 4
      }

      // Criteria checklist — drawn as actual vector circles rather than
      // text glyphs (filled = flagged, outlined = not flagged), so it
      // renders identically everywhere instead of depending on font support.
      addLine(t('results.pdf.criteriaHeading'), 12.5, true)
      criteriaDetails.forEach((c) => {
        checkPageBreak(24)
        const textColor = c.met ? PDF_COLORS.rust : PDF_COLORS.soft
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10.5)
        doc.setTextColor(...textColor)
        const label = sanitizeForPdf(c.label)
        const lines = doc.splitTextToSize(label, pageWidth - margin * 2 - 16)

        const dotCenterY = y - 3.5
        if (c.met) {
          doc.setFillColor(...PDF_COLORS.rust)
          doc.circle(margin + 4, dotCenterY, 3, 'F')
        } else {
          doc.setDrawColor(...PDF_COLORS.soft)
          doc.circle(margin + 4, dotCenterY, 3, 'S')
        }
        doc.text(lines, margin + 14, y)
        y += lines.length * (10.5 * 1.35) + 6
      })
      addRule()

      // Answers by section
      addLine(t('results.pdf.responsesHeading'), 12.5, true)
      sections.forEach((section) => {
        checkPageBreak(30)
        addLine(section.title, 10, true, PDF_COLORS.soft)
        section.fields.forEach((field) => {
          checkPageBreak(24)
          const question = t(`assessment.questions.${field}.title`)
          const answer = fieldLabel(t, field, answers[field]) || '\u2014'
          addLine(question, 9, false, PDF_COLORS.soft)
          addLine(`\u2014 ${answer}`, 9.5, true, PDF_COLORS.plum)
        })
      })
      addRule()

      // Disclaimer
      checkPageBreak(60)
      addLine(t('results.disclaimer'), 8.5, false, PDF_COLORS.soft)
      y += 2
      addLine(t('results.pdf.disclaimerNote'), 8, false, PDF_COLORS.soft)

      doc.save(`HerCycle-Summary-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <div className="no-print flex gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full
                     bg-plum text-cream text-sm font-semibold
                     hover:bg-plum-light transition-colors disabled:opacity-60"
        >
          {downloading ? t('results.preparingPdf') : t('results.downloadPdf')}
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-3.5 rounded-full border border-plum text-plum text-sm font-semibold
                     hover:bg-plum-tint transition-colors"
        >
          {t('results.print')}
        </button>
      </div>

      {/* Only shown for actual printing (Ctrl/Cmd+P) — hidden in normal
          browsing via the "hidden print:block" classes below, and isolated
          from the rest of the page by the .printable print CSS rule. */}
      <div
        id="summary-sheet"
        className="printable hidden print:block bg-white text-[#1e1e1e] p-8 rounded-2xl max-w-2xl"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <h2 className="text-xl font-bold m-0">HerCycle Kenya \u2014 PCOS Screening Summary</h2>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>

        <div
          className="border rounded-xl px-4 py-3 my-4"
          style={{ borderColor: tier === 'high' ? '#b42828' : tier === 'moderate' ? '#be8214' : '#28825a' }}
        >
          <strong>{tierLabel}</strong>
          <div className="text-xs text-gray-500 mt-1">
            {t('results.criteriaFlagged', { count: flagCount })}
          </div>
        </div>

        <ul className="pl-4 text-sm leading-relaxed">
          {criteriaDetails.map((c, i) => (
            <li key={i} style={{ opacity: c.met ? 1 : 0.55 }}>
              {c.met ? '\u2713' : '\u25cb'} {c.label}
            </li>
          ))}
        </ul>

        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold mt-5 mb-2">{section.title}</h3>
            <dl className="text-sm leading-loose">
              {section.fields.map((field) => (
                <div key={field}>
                  <dt className="text-gray-500 inline">{t(`assessment.questions.${field}.title`)}: </dt>
                  <dd className="inline font-medium">{fieldLabel(t, field, answers[field]) || '\u2014'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <p className="text-xs text-gray-500 mt-6 leading-relaxed">{t('results.disclaimer')}</p>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{t('results.pdf.disclaimerNote')}</p>
      </div>
    </div>
  )
}
