import { useState, useEffect, useRef } from 'react'
import { Printer, Download, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function SummarySheet({ t, language, answers, score, onDownload }) {
  const { user } = useAuth()
  const [downloaded, setDownloaded] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const cachedBlobUrlRef = useRef(null)
  const printIframeRef = useRef(null)

  const patientName = user?.fullName || 'Patient'
  const patientPhone = user?.phoneNumber || ''

  const tier = score?.tier || 'low'
  const flagCount = score?.flagCount || 0
  const medicationCaveat = score?.medicationCaveat || false

  const tierLabel = t(`results.tier.${tier}`) || `${tier.charAt(0).toUpperCase() + tier.slice(1)} Risk`
  const activeLang = language === 'sw' ? 'sw' : 'en'

  // Pre-fetch the localized PDF whenever the active language changes
  useEffect(() => {
    let isCancelled = false

    // Clean up old cached iframe and object URL when language switches
    if (printIframeRef.current && document.body.contains(printIframeRef.current)) {
      document.body.removeChild(printIframeRef.current)
      printIframeRef.current = null
    }
    if (cachedBlobUrlRef.current) {
      URL.revokeObjectURL(cachedBlobUrlRef.current)
      cachedBlobUrlRef.current = null
    }

    async function warmPdfCache() {
      try {
        const blob = await api.fetchDoctorReportBlob(activeLang)
        if (!isCancelled && blob) {
          const blobUrl = URL.createObjectURL(blob)
          cachedBlobUrlRef.current = blobUrl

          // Preload hidden iframe with the localized PDF stream
          const iframe = document.createElement('iframe')
          iframe.style.position = 'fixed'
          iframe.style.right = '0'
          iframe.style.bottom = '0'
          iframe.style.width = '0'
          iframe.style.height = '0'
          iframe.style.border = '0'
          iframe.src = blobUrl
          document.body.appendChild(iframe)
          printIframeRef.current = iframe
        }
      } catch (err) {
        console.warn('PDF warm cache notice:', err.message)
      }
    }

    warmPdfCache()

    return () => {
      isCancelled = true
      if (printIframeRef.current && document.body.contains(printIframeRef.current)) {
        document.body.removeChild(printIframeRef.current)
        printIframeRef.current = null
      }
    }
  }, [activeLang])

  // Instant localized PDF download
  async function handleDownload() {
    if (cachedBlobUrlRef.current) {
      const downloadAnchor = document.createElement('a')
      const sanitizedFileName = patientName.replace(/[^a-zA-Z0-9]/g, '_')
      const langCode = activeLang.toUpperCase()

      downloadAnchor.href = cachedBlobUrlRef.current
      downloadAnchor.download = `HerCycle_Doctor_Summary_${langCode}_${sanitizedFileName}.pdf`
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
      return
    }

    try {
      await api.downloadDoctorReport(patientName, activeLang)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to download report.')
    }
  }

  // Instant localized PDF print
  async function handlePrint() {
    setIsPrinting(true)

    // 1. If preloaded iframe is ready, trigger immediate print
    if (printIframeRef.current?.contentWindow) {
      try {
        printIframeRef.current.contentWindow.focus()
        printIframeRef.current.contentWindow.print()
        setIsPrinting(false)
        return
      } catch {
        // Fall through to dynamic iframe
      }
    }

    // 2. Fetch fresh localized blob if cache was not preloaded
    try {
      const blob = cachedBlobUrlRef.current 
        ? null 
        : await api.fetchDoctorReportBlob(activeLang)
      
      const blobUrl = cachedBlobUrlRef.current || URL.createObjectURL(blob)

      const tempIframe = document.createElement('iframe')
      tempIframe.style.position = 'fixed'
      tempIframe.style.right = '0'
      tempIframe.style.bottom = '0'
      tempIframe.style.width = '0'
      tempIframe.style.height = '0'
      tempIframe.style.border = '0'
      tempIframe.src = blobUrl

      document.body.appendChild(tempIframe)

      tempIframe.onload = () => {
        setTimeout(() => {
          tempIframe.contentWindow.focus()
          tempIframe.contentWindow.print()
          setIsPrinting(false)
        }, 300)
      }
    } catch (err) {
      console.warn('Direct PDF print fallback:', err.message)
      setIsPrinting(false)
      window.print()
    }
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#EBE5DC] rounded-2xl p-6 shadow-sm font-sans text-plum">
      {/* 1. PATIENT INFORMATION */}
      <div className="mb-4">
        <p className="font-mono text-[11px] tracking-[0.15em] text-[#8C827A] uppercase mb-1">
          {activeLang === 'sw' ? 'TAARIFA ZA MGONJWA' : 'PATIENT INFORMATION'}
        </p>
        <h3 className="text-xl font-bold text-[#2D1527]">{patientName}</h3>
        {patientPhone && (
          <p className="text-sm text-[#736B66] mt-0.5">{patientPhone}</p>
        )}
      </div>

      <hr className="border-t border-[#EBE5DC] my-4" />

      {/* 2. ROTTERDAM EVALUATION */}
      <div className="mb-4">
        <p className="text-[15px] font-semibold text-[#2D1527]">
          {activeLang === 'sw' ? 'Tathmini ya Rotterdam:' : 'Rotterdam Evaluation:'}{' '}
          <span className="text-[#C05638] font-bold">{tierLabel}</span>
        </p>
        <p className="text-sm text-[#736B66] mt-0.5">
          {activeLang === 'sw'
            ? `${flagCount} kati ya vigezo 3 vya Rotterdam vimeonekana.`
            : `${flagCount} of 3 Rotterdam criteria flagged.`}
        </p>
      </div>

      {/* 3. MEDICATION CAVEAT */}
      {medicationCaveat && (
        <div className="bg-[#FBF0D9] border border-[#F3DFC1] text-[#8C6B2D] rounded-xl p-3 text-xs mb-4 leading-relaxed">
          {activeLang === 'sw'
            ? 'Uko kwenye dawa za homoni, kwa hivyo matokeo haya yanaweza yasiwe thabiti.'
            : "You're on hormonal medication, so these results may be less reliable."}
        </div>
      )}

      {/* 4. RECOMMENDED GYNECOLOGISTS */}
      <div className="bg-[#F5EFE6] border border-[#E8DFC8] rounded-xl p-4 mb-6">
        <p className="font-mono text-[11px] tracking-[0.12em] font-bold text-[#2D1527] uppercase mb-1">
          {activeLang === 'sw' ? 'MADAKTARI WA WANAWAKE WANAOPENDEKEZWA' : 'RECOMMENDED GYNECOLOGISTS'}
        </p>
        <p className="text-xs italic text-[#736B66] leading-relaxed">
          {activeLang === 'sw'
            ? 'Mawasiliano ya madaktari bingwa wa wanawake na vituo vya rufaa vitapatikana hivi karibuni.'
            : 'Verified gynecologist contacts and partner referral clinics will be available soon.'}
        </p>
      </div>

      {/* 5. ACTION BUTTONS */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 bg-[#3A2438] hover:bg-[#2A1628] active:scale-[0.99] text-white py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {downloaded ? (
            <Check size={18} className="text-emerald-300" />
          ) : (
            <Download size={18} />
          )}
          {downloaded
            ? (activeLang === 'sw' ? 'Imepakuliwa' : 'Downloaded')
            : (activeLang === 'sw' ? 'Pakua PDF' : 'Download PDF')}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          disabled={isPrinting}
          title={activeLang === 'sw' ? 'Chapisha Muhtasari' : 'Print Summary'}
          aria-label="Print summary sheet"
          className="bg-[#F5EFE6] hover:bg-[#EBE3D5] active:scale-[0.97] text-[#2D1527] border border-[#E0D7CA] p-3.5 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
        </button>
      </div>
    </div>
  )
}