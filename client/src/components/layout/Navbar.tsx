import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getTier } from '../../utils/tiers'

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const tier = user ? getTier(user.rating.elo) : null

  return (
    <nav className="bg-dark-800 border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold">
            <span className="text-accent-green">Code</span>
            <span className="text-white">Battle</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/problems" className="text-sm text-gray-400 hover:text-white transition-colors">
              Problems
            </Link>
            <Link to="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link to="/spectate" className="text-sm text-gray-400 hover:text-white transition-colors">
              Spectate
            </Link>
            {isAuthenticated && (
              <Link to="/matches" className="text-sm text-gray-400 hover:text-white transition-colors">
                History
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-sm text-accent-yellow hover:text-yellow-300 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              {/* ELO + Tier badge */}
              <div className="flex items-center gap-2">
                {tier && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tier.color} ${tier.bgColor}`}>
                    {tier.name}
                  </span>
                )}
                <span className="text-sm font-mono font-bold text-accent-yellow">{user.rating.elo}</span>
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(user.username) }}
                  >
                    {getInitials(user.username)}
                  </div>
                  <span className="text-sm font-medium text-gray-200">{user.username}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 py-1">
                    <Link
                      to={`/profile/${user.username}`}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/matches"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Match History
                    </Link>
                    <div className="border-t border-dark-600 my-1" />
                    <button
                      onClick={() => { logout(); setDropdownOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-sm text-accent-red hover:bg-dark-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-accent text-sm py-1.5 px-4">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
