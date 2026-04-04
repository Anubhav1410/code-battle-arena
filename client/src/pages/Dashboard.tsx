import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useBattleStore } from '../store/battleStore'
import { getTier, formatTimeAgo } from '../utils/tiers'
import api from '../services/api'

interface MatchHistoryItem {
  _id: string
  players: Array<{
    userId: string
    username: string
    ratingBefore: number
    ratingAfter: number
    status: string
  }>
  problemId: { title: string; slug: string; difficulty: string } | null
  result: string
  winner: string | null
  endedAt: string
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const {
    matchState,
    matchId,
    searchStartTime,
    connect,
    findMatch,
    cancelSearch,
  } = useBattleStore()

  const [matches, setMatches] = useState<MatchHistoryItem[]>([])
  const [searchElapsed, setSearchElapsed] = useState(0)
  const [challengeCode, setChallengeCode] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Dashboard | Code Battle Arena'
    connect()
    fetchHistory()
  }, [connect])

  // Listen for challenge:created
  useEffect(() => {
    const { socket } = useBattleStore.getState()
    if (!socket) return
    const handler = ({ code }: { code: string }) => {
      setChallengeCode(code)
      toast.success('Challenge room created!')
    }
    socket.on('challenge:created', handler)
    return () => { socket.off('challenge:created', handler) }
  }, [matchState])

  // Navigate to battle when matched
  useEffect(() => {
    if (matchState === 'found' && matchId) {
      navigate(`/battle/${matchId}`)
    }
  }, [matchState, matchId, navigate])

  // Search timer
  useEffect(() => {
    if (matchState !== 'searching' || !searchStartTime) {
      setSearchElapsed(0)
      return
    }
    const interval = setInterval(() => {
      setSearchElapsed(Date.now() - searchStartTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [matchState, searchStartTime])

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/matches/history')
      if (data.success) setMatches(data.data.matches.slice(0, 5))
    } catch {
      // silent
    }
  }

  const handleCreateChallenge = () => {
    const { socket } = useBattleStore.getState()
    if (socket) {
      socket.emit('challenge:create', { timeLimit: 15 })
    }
  }

  const handleCancelChallenge = () => {
    const { socket } = useBattleStore.getState()
    if (socket && challengeCode) {
      socket.emit('challenge:cancel', { code: challengeCode })
      setChallengeCode(null)
    }
  }

  const elo = user?.rating.elo ?? 1200
  const tier = getTier(elo)
  const wins = user?.rating.wins ?? 0
  const losses = user?.rating.losses ?? 0
  const total = wins + losses + (user?.rating.draws ?? 0)
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, <span className="text-accent-green">{user?.username}</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">ELO Rating</p>
          <p className="text-4xl font-bold text-accent-yellow mt-1">{elo}</p>
          <p className={`text-sm font-medium mt-1 ${tier.color}`}>{tier.name}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Record</p>
          <p className="text-2xl font-bold mt-1">
            <span className="text-accent-green">{wins}W</span>
            {' / '}
            <span className="text-accent-red">{losses}L</span>
            {' / '}
            <span className="text-gray-400">{user?.rating.draws ?? 0}D</span>
          </p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Win Rate</p>
          <p className="text-4xl font-bold text-white mt-1">{winRate}%</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Win Streak</p>
          <p className="text-4xl font-bold text-accent-yellow mt-1">{user?.stats.winStreak ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Best: {user?.stats.bestWinStreak ?? 0}</p>
        </div>
      </div>

      {/* Find Match */}
      <div className="card mb-8">
        {matchState === 'searching' ? (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-accent-green rounded-full animate-ping" />
              <span className="text-xl font-bold text-white">Finding opponent...</span>
            </div>
            <p className="text-gray-400 mb-1">
              Searching for players within ±{200 + Math.floor(searchElapsed / 10000) * 50} ELO
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {Math.floor(searchElapsed / 1000)}s elapsed
            </p>
            <button onClick={cancelSearch} className="btn-primary">
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex gap-4 justify-center">
              <button onClick={findMatch} className="btn-accent text-xl px-12 py-4">
                Find Match
              </button>
              <button onClick={handleCreateChallenge} className="btn-primary text-lg px-8 py-4">
                Challenge a Friend
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Find a random opponent or invite a friend with a custom room
            </p>
          </div>
        )}
      </div>

      {/* Challenge Link */}
      {challengeCode && (
        <div className="card mb-8 text-center">
          <p className="text-sm text-gray-400 mb-2">Share this link with your friend:</p>
          <div className="flex items-center justify-center gap-3">
            <code className="bg-dark-700 px-4 py-2 rounded text-accent-yellow font-mono">
              {window.location.origin}/challenge/{challengeCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/challenge/${challengeCode}`)
                toast.success('Link copied!')
              }}
              className="px-3 py-2 bg-dark-700 text-gray-300 rounded text-sm hover:bg-dark-600"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Waiting for opponent to join... (expires in 10 min)</p>
          <button
            onClick={handleCancelChallenge}
            className="text-xs text-accent-red hover:underline mt-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Recent Matches */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No matches yet. Find your first opponent!
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const me = match.players.find((p) => p.userId === user?._id)
              const opp = match.players.find((p) => p.userId !== user?._id)
              const isWin = match.winner === user?._id
              const isDraw = match.result === 'draw'
              const ratingChange = me ? me.ratingAfter - me.ratingBefore : 0

              return (
                <div
                  key={match._id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDraw
                      ? 'border-gray-600/50 bg-gray-800/20'
                      : isWin
                        ? 'border-accent-green/20 bg-accent-green/5'
                        : 'border-accent-red/20 bg-accent-red/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
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
                    <div>
                      <span className="text-white font-medium">vs {opp?.username}</span>
                      {match.problemId && (
                        <Link
                          to={`/problem/${match.problemId.slug}`}
                          className="text-xs text-gray-500 ml-2 hover:text-accent-blue"
                        >
                          {match.problemId.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono font-bold text-sm ${
                        ratingChange >= 0 ? 'text-accent-green' : 'text-accent-red'
                      }`}
                    >
                      {ratingChange >= 0 ? '+' : ''}{ratingChange}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(match.endedAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
