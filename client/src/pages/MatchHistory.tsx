import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatTimeAgo, formatSolveTime } from '../utils/tiers'
import CodeEditor from '../components/editor/CodeEditor'

interface MatchItem {
  _id: string
  players: Array<{
    userId: string
    username: string
    ratingBefore: number
    ratingAfter: number
    language: string
    finalCode: string
    solveTime: number
    status: string
  }>
  problemId: { title: string; slug: string; difficulty: string } | null
  result: string
  winner: string | null
  endedAt: string
  duration: number
}

const RESULT_FILTERS = [
  { value: '', label: 'All' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
  { value: 'draws', label: 'Draws' },
]

const DIFF_FILTERS = [
  { value: '', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export default function MatchHistory() {
  const { user } = useAuthStore()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [resultFilter, setResultFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null)

  useEffect(() => {
    document.title = 'Match History | Code Battle Arena'
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [resultFilter, diffFilter, page])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (resultFilter) params.set('result', resultFilter)
      if (diffFilter) params.set('difficulty', diffFilter)

      const { data } = await api.get(`/users/matches?${params}`)
      if (data.success) {
        setMatches(data.data.matches)
        setTotalPages(data.data.pagination.pages)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (matchId: string) => {
    try {
      const { data } = await api.get(`/users/matches/${matchId}`)
      if (data.success) setSelectedMatch(data.data.match)
    } catch {
      // silent
    }
  }

  // Match detail modal
  if (selectedMatch) {
    const me = selectedMatch.players.find((p) => p.userId === user?._id)
    const opp = selectedMatch.players.find((p) => p.userId !== user?._id)

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedMatch(null)}
          className="text-sm text-accent-blue hover:underline mb-4"
        >
          Back to History
        </button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Match Detail</h1>
          <div className="flex items-center gap-3">
            <Link
              to={`/replay/${selectedMatch._id}`}
              className="btn-accent text-sm py-1.5 px-4"
            >
              Watch Replay
            </Link>
            {selectedMatch.problemId && (
              <Link
                to={`/problem/${selectedMatch.problemId.slug}`}
                className="text-accent-blue hover:underline text-sm"
              >
                {selectedMatch.problemId.title}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-accent-blue">{me?.username} (You)</span>
              <span className="text-sm text-gray-400">{me?.language}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Status: <span className={me?.status === 'solved' ? 'text-accent-green' : 'text-gray-400'}>{me?.status}</span>
              {me?.solveTime ? ` in ${formatSolveTime(me.solveTime)}` : ''}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-accent-red">{opp?.username}</span>
              <span className="text-sm text-gray-400">{opp?.language}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Status: <span className={opp?.status === 'solved' ? 'text-accent-green' : 'text-gray-400'}>{opp?.status}</span>
              {opp?.solveTime ? ` in ${formatSolveTime(opp.solveTime)}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg overflow-hidden border border-dark-600">
            <CodeEditor
              value={me?.finalCode || '// No code submitted'}
              onChange={() => {}}
              language={me?.language || 'cpp'}
              readOnly
              height="500px"
            />
          </div>
          <div className="rounded-lg overflow-hidden border border-dark-600">
            <CodeEditor
              value={opp?.finalCode || '// No code submitted'}
              onChange={() => {}}
              language={opp?.language || 'cpp'}
              readOnly
              height="500px"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Match History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1">
          {RESULT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setResultFilter(f.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                resultFilter === f.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {DIFF_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setDiffFilter(f.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                diffFilter === f.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Opponent</th>
              <th className="px-4 py-3 font-medium">Problem</th>
              <th className="px-4 py-3 font-medium text-right">Rating</th>
              <th className="px-4 py-3 font-medium">Lang</th>
              <th className="px-4 py-3 font-medium text-right">Time</th>
              <th className="px-4 py-3 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-dark-600/50">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 w-full bg-dark-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No matches found
                </td>
              </tr>
            ) : (
              matches.map((match) => {
                const me = match.players.find((p) => p.userId === user?._id)
                const opp = match.players.find((p) => p.userId !== user?._id)
                const isWin = match.winner === user?._id
                const isDraw = match.result === 'draw'
                const ratingChange = me ? me.ratingAfter - me.ratingBefore : 0

                return (
                  <tr
                    key={match._id}
                    onClick={() => openDetail(match._id)}
                    className="border-b border-dark-600/50 hover:bg-dark-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          isDraw
                            ? 'bg-gray-600/30 text-gray-400'
                            : isWin
                              ? 'bg-accent-green/20 text-accent-green'
                              : 'bg-accent-red/20 text-accent-red'
                        }`}
                      >
                        {isDraw ? 'DRAW' : isWin ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {opp && (
                        <Link
                          to={`/profile/${opp.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-white font-medium hover:text-accent-blue"
                        >
                          {opp.username}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {match.problemId ? (
                        <span className="text-gray-300 text-sm">{match.problemId.title}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          ratingChange >= 0 ? 'text-accent-green' : 'text-accent-red'
                        }`}
                      >
                        {ratingChange >= 0 ? '+' : ''}{ratingChange}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 uppercase">{me?.language || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {me?.solveTime ? formatSolveTime(me.solveTime) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {formatTimeAgo(match.endedAt)}
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
