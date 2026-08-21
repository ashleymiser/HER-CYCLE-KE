import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { AssessmentProvider } from './context/AssessmentContext'
import LanguageSelect from './pages/LanguageSelect'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Results from './pages/Results'

// Sends the user back to language select if they haven't chosen one yet
function RequireLanguage({ children }) {
  const { language } = useLanguage()
  if (!language) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <LanguageProvider>
      <AssessmentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LanguageSelect />} />
            <Route
              path="/home"
              element={
                <RequireLanguage>
                  <Home />
                </RequireLanguage>
              }
            />
            <Route
              path="/assessment"
              element={
                <RequireLanguage>
                  <Assessment />
                </RequireLanguage>
              }
            />
            <Route
              path="/results"
              element={
                <RequireLanguage>
                  <Results />
                </RequireLanguage>
              }
            />
          </Routes>
        </BrowserRouter>
      </AssessmentProvider>
    </LanguageProvider>
  )
}
