import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { AssessmentProvider } from './context/AssessmentContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// 1. Lazy-load route components to shrink the initial download bundle
const LanguageSelect = lazy(() => import('./pages/LanguageSelect'))
const Landing = lazy(() => import('./pages/Landing'))
const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Assessment = lazy(() => import('./pages/Assessment'))
const Results = lazy(() => import('./pages/Results'))

// 2. Pre-fetch key user-flow bundles in the background after initial render
function RoutePreloader() {
  useEffect(() => {
    const prefetchModules = () => {
      import('./pages/Home')
      import('./pages/Assessment')
      import('./pages/Results')
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchModules)
    } else {
      setTimeout(prefetchModules, 1000)
    }
  }, [])

  return null
}

// 3. Language guard
function RequireLanguage({ children }) {
  const { language } = useLanguage()
  const location = useLocation()

  if (!language) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

// 4. Protected route guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const hasToken = Boolean(localStorage.getItem('hercycle_token'))

  if (loading && !hasToken) {
    return null
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AssessmentProvider>
          <BrowserRouter>
            <RoutePreloader />
            <Suspense fallback={<div className="min-h-screen bg-sand" />}>
              <Routes>
                {/* Language Selection Route */}
                <Route path="/" element={<LanguageSelect />} />

                {/* Public Routes */}
                <Route
                  path="/landing"
                  element={
                    <RequireLanguage>
                      <Landing />
                    </RequireLanguage>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <RequireLanguage>
                      <Signup />
                    </RequireLanguage>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <RequireLanguage>
                      <Login />
                    </RequireLanguage>
                  }
                />

                {/* Authenticated Patient Routes */}
                <Route
                  path="/home"
                  element={
                    <RequireLanguage>
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    </RequireLanguage>
                  }
                />
                <Route
                  path="/assessment"
                  element={
                    <RequireLanguage>
                      <ProtectedRoute>
                        <Assessment />
                      </ProtectedRoute>
                    </RequireLanguage>
                  }
                />
                <Route
                  path="/results"
                  element={
                    <RequireLanguage>
                      <ProtectedRoute>
                        <Results />
                      </ProtectedRoute>
                    </RequireLanguage>
                  }
                />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AssessmentProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}