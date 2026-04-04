import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import CodeEditor from '../components/editor/CodeEditor'
import { getTier, formatSolveTime } from '../utils/tiers'

interface MatchEvent {
  timestamp: number
  playerId: string
  type: 'code_change' | 'submit' | 'run_tests' | 'test_result'
  data: Record<string, unknown>
}

interface Player {
  userId: string
  username: string
  ratingBefore: number
  ratingAfter: number
  language: string
  status: string
  solveTime: number
  testCasesPassed: number
  totalTestCases: number
}

interface MatchData {
  _id: string
  players: Player[]
  problemId: {
    title: string
    slug: string
    difficulty: string
    description: string
  } | null
  result: string
  winner: string | null
  duration: number
  events: MatchEvent[]
  startedAt: string
  endedAt: string
}

const SPEEDS = [1, 2, 4, 8]

function formatTime(ms: number): string {
  const secs = Math.floor(ms / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Replay() {
  const { matchId } = useParams<{ matchId: string }>()
  const [match, setMatch] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [player1Code, setPlayer1Code] = useState('')
  const [player2Code, setPlayer2Code] = useState('')
  const [player1Lang, setPlayer1Lang] = useState('cpp')
  const [player2Lang, setPlayer2Lang] = useState('cpp')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastProcessedRef = useRef(0)

  useEffect(() => {
    if (matchId) fetchReplay()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [matchId])

  useEffect(() => {
    document.title = match
      ? `Replay: ${match.players[0]?.username} vs ${match.players[1]?.username} | Code Battle Arena`
      : 'Replay | Code Battle Arena'
  }, [match])

  const fetchReplay = async () => {
    try {
      const { data } = await api.get(`/matches/${matchId}/replay`)
      if (data.success) {
        setMatch(data.data.match)
      }
    } catch {
      toast.error('Failed to load replay')
    } finally {
      setLoading(false)
    }
  }

  const reconstructState = useCallback(
    (targetTime: number) => {
      if (!match) return

      let code1 = ''
      let code2 = ''
      let lang1 = match.players[0]?.language || 'cpp'
      let lang2 = match.players[1]?.language || 'cpp'
      const p1Id = match.players[0]?.userId
      const p2Id = match.players[1]?.userId

      for (const event of match.events) {
        if (event.timestamp > targetTime) break

        if (event.type === 'code_change') {
          const data = event.data as { code: string; language: string }
          if (event.playerId === p1Id) {
            code1 = data.code
            lang1 = data.language
          } else if (event.playerId === p2Id) {
            code2 = data.code
            lang2 = data.language
          }
        }

        // Show toast for key events
        if (event.timestamp > lastProcessedRef.current) {
          if (event.type === 'submit') {
            const who = event.playerId === p1Id ? match.players[0].username : match.players[1].username
            toast(`${who} submitted!`, { icon: '📤', duration: 2000 })
          } else if (event.type === 'test_result') {
            const data = event.data as { passed?: number; total?: number; allPassed?: boolean; type?: string }
            if (data.type === 'submit' && data.allPassed) {
              const who = event.playerId === p1Id ? match.players[0].username : match.players[1].username
              toast.success(`${who} solved it!`, { duration: 3000 })
            }
          } else if (event.type === 'run_tests') {
            const who = event.playerId === p1Id ? match.players[0].username : match.players[1].username
            toast(`${who} ran tests`, { icon: '🧪', duration: 1500 })
          }
        }
      }

      lastProcessedRef.current = targetTime
      setPlayer1Code(code1)
      setPlayer2Code(code2)
      setPlayer1Lang(lang1)
      setPlayer2Lang(lang2)
    },
    [match]
  )

  // Play/pause timer
  useEffect(() => {
    if (playing && match) {
      const tickMs = 50
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + tickMs * speed
          if (next >= match.duration) {
            setPlaying(false)
            return match.duration
          }
          return next
        })
      }, tickMs)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [playing, speed, match])

  // Reconstruct state when time changes
  useEffect(() => {
    reconstructState(currentTime)
  }, [currentTime, reconstructState])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseInt(e.target.value, 10)
    lastProcessedRef.current = 0
    setCurrentTime(time)
  }

  const togglePlay = () => setPlaying((p) => !p)

  const jumpToFirstSolve = () => {
    if (!match) return
    const solveEvent = match.events.find(
      (e) => e.type === 'test_result' && (e.data as { allPassed?: boolean; type?: string }).allPassed && (e.data as { type?: string }).type === 'submit'
    )
    if (solveEvent) {
      lastProcessedRef.current = 0
      setCurrentTime(solveEvent.timestamp)
      toast.success('Jumped to first solve')
    } else {
      toast.error('No player solved this problem')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-dark-700 rounded" />
          <div className="h-96 bg-dark-700 rounded" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-accent-red">Replay not found</h1>
        <Link to="/matches" className="text-accent-blue hover:underline mt-4 inline-block">
          Back to matches
        </Link>
      </div>
    )
  }

  const p1 = match.players[0]
  const p2 = match.players[1]
  const tier1 = getTier(p1.ratingBefore)
  const tier2 = getTier(p2.ratingBefore)
  const progress = match.duration > 0 ? (currentTime / match.duration) * 100 : 0

  // Build event markers for timeline
  const markers = match.events
    .filter((e) => e.type === 'submit' || e.type === 'run_tests')
    .map((e) => ({
      position: match.duration > 0 ? (e.timestamp / match.duration) * 100 : 0,
      type: e.type,
      playerId: e.playerId,
    }))

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/matches" className="text-xs text-gray-500 hover:text-white">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded ${tier1.color} ${tier1.bgColor}`}>{tier1.name}</span>
            <span className="font-bold text-accent-blue">{p1.username}</span>
            <span className="text-xs text-accent-yellow">{p1.ratingBefore}</span>
          </div>
          <span className="text-gray-600 font-bold">VS</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-accent-red">{p2.username}</span>
            <span className="text-xs text-accent-yellow">{p2.ratingBefore}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${tier2.color} ${tier2.bgColor}`}>{tier2.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-lg font-mono font-bold text-white">{formatTime(currentTime)}</span>
          <span className="text-xs text-gray-500">/ {formatTime(match.duration)}</span>
          {match.problemId && (
            <Link to={`/problem/${match.problemId.slug}`} className="text-xs text-gray-400 hover:text-accent-blue">
              {match.problemId.title}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              {p1.status === 'solved' ? `✓ ${formatSolveTime(p1.solveTime)}` : p1.testCasesPassed > 0 ? `${p1.testCasesPassed}/${p1.totalTestCases}` : '-'}
            </span>
            <span className="text-gray-600 mx-1">|</span>
            <span className="text-xs text-gray-500">
              {p2.status === 'solved' ? `✓ ${formatSolveTime(p2.solveTime)}` : p2.testCasesPassed > 0 ? `${p2.testCasesPassed}/${p2.totalTestCases}` : '-'}
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              match.result === 'draw' ? 'text-gray-400 bg-gray-600/20' :
              match.winner === p1.userId ? 'text-accent-blue bg-accent-blue/10' :
              'text-accent-red bg-accent-red/10'
            }`}
          >
            {match.result === 'draw' ? 'DRAW' : match.winner === p1.userId ? `${p1.username} wins` : `${p2.username} wins`}
          </span>
        </div>
      </div>

      {/* Editors */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-dark-600 min-h-0">
          <div className="h-8 bg-dark-800/80 border-b border-dark-600 flex items-center px-3 shrink-0">
            <span className="text-xs text-accent-blue font-medium">{p1.username}</span>
            <span className="text-xs text-gray-500 ml-2">{player1Lang}</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor value={player1Code} onChange={() => {}} language={player1Lang} readOnly height="100%" />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-8 bg-dark-800/80 border-b border-dark-600 flex items-center px-3 shrink-0">
            <span className="text-xs text-accent-red font-medium">{p2.username}</span>
            <span className="text-xs text-gray-500 ml-2">{player2Lang}</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor value={player2Code} onChange={() => {}} language={player2Lang} readOnly height="100%" />
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="h-24 bg-dark-800 border-t border-dark-600 px-4 py-2 shrink-0">
        {/* Timeline with markers */}
        <div className="relative mb-2">
          {/* Event markers */}
          <div className="absolute inset-x-0 top-0 h-4 pointer-events-none">
            {markers.map((m, i) => (
              <div
                key={i}
                className="absolute top-0"
                style={{ left: `${m.position}%` }}
              >
                {m.type === 'submit' ? (
                  <div
                    className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-transparent ${
                      m.playerId === p1.userId ? 'border-b-accent-blue' : 'border-b-accent-red'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full mt-0.5 ${
                      m.playerId === p1.userId ? 'bg-blue-400/60' : 'bg-red-400/60'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={match.duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 mt-5 appearance-none bg-dark-600 rounded-full cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-green [&::-webkit-slider-thumb]:cursor-pointer"
          />
          {/* Progress fill */}
          <div
            className="absolute top-5 left-0 h-1.5 bg-accent-green/40 rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-accent-green text-dark-900 flex items-center justify-center font-bold text-lg hover:brightness-110"
            >
              {playing ? '⏸' : '▶'}
            </button>

            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-accent-blue text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={jumpToFirstSolve}
              className="px-3 py-1.5 bg-dark-700 text-gray-300 rounded text-xs hover:bg-dark-600"
            >
              Jump to First Solve
            </button>
            <button
              onClick={() => { lastProcessedRef.current = 0; setCurrentTime(0); setPlaying(false) }}
              className="px-3 py-1.5 bg-dark-700 text-gray-300 rounded text-xs hover:bg-dark-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
