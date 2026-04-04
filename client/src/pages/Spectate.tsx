import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { getTier } from '../utils/tiers'

interface LiveMatch {
  _id: string
  players: Array<{
    userId: string
    username: string
    ratingBefore: number
  }>
  problemId: { title: string; difficulty: string } | null
  startedAt: string | null
  spectatorCount: number
  state: string
}

function formatElapsed(startedAt: string | null): string {
  if (!startedAt) return '0:00'
  const ms = Date.now() - new Date(startedAt).getTime()
  const secs = Math.floor(ms / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Spectate() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Spectate | Code Battle Arena'
    fetchLive()
    const interval = setInterval(fetchLive, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchLive = async () => {
    try {
      const { data } = await api.get('/matches/live/list')
      if (data.success) {
        setMatches(data.data.matches)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Live Matches</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Auto-refreshing</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-dark-700 rounded" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">&#128064;</p>
          <p className="text-xl text-gray-400">No live matches right now</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back later or start a match yourself!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => {
            const p1 = match.players[0]
            const p2 = match.players[1]
            const t1 = p1 ? getTier(p1.ratingBefore) : null
            const t2 = p2 ? getTier(p2.ratingBefore) : null

            return (
              <div key={match._id} className="card hover:border-accent-blue/40 transition-colors">
                {/* Players */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {t1 && <span className={`text-xs px-1.5 py-0.5 rounded ${t1.color} ${t1.bgColor}`}>{t1.name}</span>}
                    <span className="font-bold text-accent-blue">{p1?.username}</span>
                    <span className="text-xs text-accent-yellow font-mono">{p1?.ratingBefore}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-accent-yellow font-mono">{p2?.ratingBefore}</span>
                    <span className="font-bold text-accent-red">{p2?.username}</span>
                    {t2 && <span className={`text-xs px-1.5 py-0.5 rounded ${t2.color} ${t2.bgColor}`}>{t2.name}</span>}
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-3">
                    {match.problemId && (
                      <span className={`font-medium capitalize ${
                        match.problemId.difficulty === 'easy' ? 'text-accent-green' :
                        match.problemId.difficulty === 'medium' ? 'text-accent-yellow' :
                        'text-accent-red'
                      }`}>
                        {match.problemId.difficulty}
                      </span>
                    )}
                    <span>{formatElapsed(match.startedAt)} elapsed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>&#128065;</span>
                    <span>{match.spectatorCount}</span>
                  </div>
                </div>

                {/* Watch button */}
                <Link
                  to={`/spectate/${match._id}`}
                  className="btn-primary w-full text-center text-sm py-2 block"
                >
                  Watch Live
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
