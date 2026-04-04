import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import NavbarLayout from './components/layout/NavbarLayout'
import ProtectedRoute from './components/ui/ProtectedRoute'
import AdminRoute from './components/ui/AdminRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import BattleArena from './pages/BattleArena'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import MatchHistory from './pages/MatchHistory'
import Spectate from './pages/Spectate'
import SpectateView from './pages/SpectateView'
import Replay from './pages/Replay'
import Challenge from './pages/Challenge'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

export default function App() {
  const { loadUser, token } = useAuthStore()

  useEffect(() => {
    if (token) {
      loadUser()
    }
  }, [token, loadUser])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-900">
        <Routes>
          {/* Full-screen pages — no navbar */}
          <Route
            path="/battle/:matchId"
            element={
              <ProtectedRoute>
                <BattleArena />
              </ProtectedRoute>
            }
          />
          <Route path="/replay/:matchId" element={<Replay />} />
          <Route
            path="/spectate/:matchId"
            element={
              <ProtectedRoute>
                <SpectateView />
              </ProtectedRoute>
            }
          />

          {/* All other routes — with navbar */}
          <Route element={<NavbarLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problem/:slug" element={<ProblemDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <MatchHistory />
                </ProtectedRoute>
              }
            />
            <Route path="/spectate" element={<Spectate />} />
            <Route
              path="/challenge/:roomCode"
              element={
                <ProtectedRoute>
                  <Challenge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>
    </ErrorBoundary>
  )
}
