import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { getTier } from '../utils/tiers'

interface LeaderboardEntry {
  userId: string
  username: string
  elo: number
  rank: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

export default function Leaderboard() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'global' | 'weekly'>('global')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    document.title = 'Leaderboard | Code Battle Arena'
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [tab, page])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/leaderboard?type=${tab}&page=${page}&limit=50`)
      if (data.success) {
        setEntries(data.data.entries)
        setTotalPages(data.data.pagination.pages)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['global', 'weekly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1) }}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-accent-blue text-white'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600 text-left text-sm text-gray-400">
              <th className="px-4 py-3 w-16 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium text-right">ELO</th>
              <th className="px-4 py-3 font-medium text-right">W</th>
              <th className="px-4 py-3 font-medium text-right">L</th>
              <th className="px-4 py-3 font-medium text-right">Win%</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-dark-600/50">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 w-full bg-dark-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No players yet
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const tier = getTier(entry.elo)
                const isMe = entry.userId === user?._id

                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-dark-600/50 transition-colors ${
                      isMe
                        ? 'bg-accent-blue/5 border-l-2 border-l-accent-blue'
                        : 'hover:bg-dark-700/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/profile/${entry.username}`}
                        className="font-medium text-white hover:text-accent-blue transition-colors"
                      >
                        {entry.username}
                        {isMe && <span className="text-accent-blue text-xs ml-2">(you)</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${tier.color} ${tier.bgColor}`}>
                        {tier.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-accent-yellow">
                      {entry.elo}
                    </td>
                    <td className="px-4 py-3 text-right text-accent-green text-sm">
                      {entry.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-accent-red text-sm">
                      {entry.losses}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-sm">
                      {entry.winRate}%
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-dark-700 rounded text-sm text-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-dark-700 rounded text-sm text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
