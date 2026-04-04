import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { getTier, formatTimeAgo, formatSolveTime } from '../utils/tiers'

interface ProfileUser {
  _id: string
  username: string
  email: string
  role: string
  avatar: string
  rating: {
    elo: number
    wins: number
    losses: number
    draws: number
    history: Array<{ date: string; elo: number }>
  }
  stats: {
    totalMatches: number
    avgSolveTime: number
    fastestSolve: number
    problemsSolved: number
    winStreak: number
    bestWinStreak: number
    languageDistribution: Record<string, number>
  }
  createdAt: string
}

interface MatchItem {
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

const PIE_COLORS = ['#4488ff', '#00ff88', '#ffaa00', '#ff4444', '#a855f7', '#06b6d4']

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 45%)`
}

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuthStore()
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/users/profile/${username}`)
      if (data.success) {
        setProfileUser(data.data.user)
        setMatches(data.data.recentMatches)
        document.title = `${data.data.user.username} | Code Battle Arena`
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-dark-700 rounded" />
          <div className="h-64 bg-dark-700 rounded" />
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-accent-red">User not found</h1>
      </div>
    )
  }

  const tier = getTier(profileUser.rating.elo)
  const isOwn = currentUser?._id === profileUser._id
  const wins = profileUser.rating.wins
  const losses = profileUser.rating.losses
  const draws = profileUser.rating.draws
  const totalGames = wins + losses + draws
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  // Rating history for chart
  const ratingData = (profileUser.rating.history || []).map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    elo: h.elo,
  }))

  // Language distribution for pie chart
  const langDist = profileUser.stats.languageDistribution || {}
  const langData = Object.entries(langDist)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card flex items-center gap-6 mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ backgroundColor: getAvatarColor(profileUser.username) }}
        >
          {getInitials(profileUser.username)}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{profileUser.username}</h1>
            {isOwn && <span className="text-xs text-gray-500">(you)</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm font-bold px-2 py-0.5 rounded ${tier.color} ${tier.bgColor}`}>
              {tier.name}
            </span>
            <span className="text-2xl font-bold font-mono text-accent-yellow">
              {profileUser.rating.elo}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Member since {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Record</p>
          <p className="text-lg font-bold mt-1">
            <span className="text-accent-green">{wins}W</span>
            {' / '}<span className="text-accent-red">{losses}L</span>
            {' / '}<span className="text-gray-400">{draws}D</span>
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Win Rate</p>
          <p className="text-2xl font-bold text-white mt-1">{winRate}%</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Win Streak</p>
          <p className="text-2xl font-bold text-accent-yellow mt-1">{profileUser.stats.winStreak}</p>
          <p className="text-xs text-gray-500">Best: {profileUser.stats.bestWinStreak}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Problems Solved</p>
          <p className="text-2xl font-bold text-accent-green mt-1">{profileUser.stats.problemsSolved}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Total Matches</p>
          <p className="text-2xl font-bold text-white mt-1">{profileUser.stats.totalMatches}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Avg Solve</p>
          <p className="text-2xl font-bold text-white mt-1">{formatSolveTime(profileUser.stats.avgSolveTime)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Fastest Solve</p>
          <p className="text-2xl font-bold text-accent-green mt-1">{formatSolveTime(profileUser.stats.fastestSolve)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 uppercase">Rank</p>
          <p className="text-2xl font-bold text-accent-blue mt-1">#{profileUser.stats.totalMatches > 0 ? '-' : '-'}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Rating History */}
        <div className="card md:col-span-2">
          <h3 className="text-lg font-bold mb-4">Rating History</h3>
          {ratingData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ratingData}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1e2a4a', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#ffaa00' }}
                />
                <Line type="monotone" dataKey="elo" stroke="#ffaa00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              Play more matches to see your rating history
            </div>
          )}
        </div>

        {/* Language Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Languages</h3>
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={langData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {langData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #1e2a4a', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No language data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Recent Matches</h3>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No matches yet</p>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const me = match.players.find((p) => p.userId === profileUser._id)
              const opp = match.players.find((p) => p.userId !== profileUser._id)
              const isWin = match.winner === profileUser._id
              const isDraw = match.result === 'draw'
              const ratingChange = me ? me.ratingAfter - me.ratingBefore : 0

              return (
                <div
                  key={match._id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDraw
                      ? 'border-gray-600/30 bg-gray-800/20'
                      : isWin
                        ? 'border-accent-green/20 bg-accent-green/5'
                        : 'border-accent-red/20 bg-accent-red/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        isDraw
                          ? 'bg-gray-600/30 text-gray-400'
                          : isWin
                            ? 'bg-accent-green/20 text-accent-green'
                            : 'bg-accent-red/20 text-accent-red'
                      }`}
                    >
                      {isDraw ? 'D' : isWin ? 'W' : 'L'}
                    </span>
                    <div>
                      <span className="text-white text-sm">vs </span>
                      {opp && (
                        <Link
                          to={`/profile/${opp.username}`}
                          className="text-white text-sm font-medium hover:text-accent-blue"
                        >
                          {opp.username}
                        </Link>
                      )}
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
