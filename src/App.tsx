import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './components/Auth/LoginPage'
import { AppLayout } from './components/Layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { AccountsPage } from './pages/AccountsPage'
import { AccountDetail } from './pages/AccountDetail'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-8 h-8 border-2 border-accent-500/60 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-8 h-8 border-2 border-accent-500/60 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
        </Route>
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </HashRouter>
  )
}
