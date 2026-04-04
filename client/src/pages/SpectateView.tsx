import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { connectSocket } from '../services/socket'
import CodeEditor from '../components/editor/CodeEditor'
import { getTier } from '../utils/tiers'
import type { Socket } from 'socket.io-client'

interface PlayerInfo {
  userId: string
  username: string
  ratingBefore: number
  language: string
}

function formatTime(ms: number): string {
  const secs = Math.floor(ms / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SpectateView() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()

  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [matchState, setMatchState] = useState<string>('loading')
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [player1Code, setPlayer1Code] = useState('')
  const [player2Code, setPlayer2Code] = useState('')
  const [matchFinished, setMatchFinished] = useState<{
    result: string
    winner: string | null
    players: Array<{ userId: string; username: string; ratingChange: number; status: string }>
  } | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.title = 'Spectating | Code Battle Arena'
    const socket = connectSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('spectate:join', { matchId })
    })

    if (socket.connected) {
      setConnected(true)
      socket.emit('spectate:join', { matchId })
    }

    socket.on('spectate:state', ({ state, players: p, startedAt: st, spectatorCount: sc }) => {
      setMatchState(state)
      setPlayers(p)
      setSpectatorCount(sc)
      if (st) setStartedAt(st)
    })

    socket.on('spectate:code_update', ({ userId, code }) => {
      if (players.length >= 2) {
        if (userId === players[0]?.userId) setPlayer1Code(code)
        else setPlayer2Code(code)
      } else {
        // Store by order received — will fix once players state is set
        setPlayer1Code((prev) => prev)
        setPlayer2Code((prev) => prev)
      }
      // Use a ref-based approach for player matching
      codeBufferRef.current.set(userId, code)
    })

    socket.on('spectate:player_action', ({ username, action, solveTime }) => {
      if (action === 'ran_tests') {
        toast(`${username} ran tests`, { icon: '🧪', duration: 2000 })
      } else if (action === 'submitted') {
        toast(`${username} submitted!`, { icon: '📤', duration: 2000 })
      } else if (action === 'solved') {
        const time = solveTime ? ` in ${formatTime(solveTime)}` : ''
        toast.success(`${username} solved it${time}!`, { duration: 3000 })
      }
    })

    socket.on('spectate:match_finished', (data) => {
      setMatchFinished(data)
      setMatchState('finished')
    })

    socket.on('spectate:error', ({ error }) => {
      toast.error(error)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('spectate:leave', { matchId })
        socketRef.current.off('spectate:state')
        socketRef.current.off('spectate:code_update')
        socketRef.current.off('spectate:player_action')
        socketRef.current.off('spectate:match_finished')
        socketRef.current.off('spectate:error')
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [matchId])

  // Buffer for code updates before players are known
  const codeBufferRef = useRef<Map<string, string>>(new Map())

  // Sync code buffer to editor state when players change
  useEffect(() => {
    if (players.length >= 2) {
      const p1Code = codeBufferRef.current.get(players[0].userId)
      const p2Code = codeBufferRef.current.get(players[1].userId)
      if (p1Code !== undefined) setPlayer1Code(p1Code)
      if (p2Code !== undefined) setPlayer2Code(p2Code)

      // Re-register code_update handler with known players
      const socket = socketRef.current
      if (socket) {
        socket.off('spectate:code_update')
        socket.on('spectate:code_update', ({ userId, code }) => {
          codeBufferRef.current.set(userId, code)
          if (userId === players[0].userId) setPlayer1Code(code)
          else if (userId === players[1].userId) setPlayer2Code(code)
        })
      }
    }
  }, [players])

  // Timer
  useEffect(() => {
    if (startedAt && matchState === 'in_progress') {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAt)
      }, 200)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [startedAt, matchState])

  const p1 = players[0]
  const p2 = players[1]
  const t1 = p1 ? getTier(p1.ratingBefore) : null
  const t2 = p2 ? getTier(p2.ratingBefore) : null

  // Finished overlay
  if (matchFinished) {
    const fp1 = matchFinished.players[0]
    const fp2 = matchFinished.players[1]
    const isDraw = matchFinished.result === 'draw'

    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="card max-w-lg w-full text-center">
          <p className="text-sm text-gray-500 mb-2">Match ended</p>
          <h1 className="text-3xl font-bold mb-4">
            {isDraw ? (
              <span className="text-accent-yellow">Draw!</span>
            ) : (
              <span className="text-accent-green">
                {matchFinished.winner === fp1?.userId ? fp1?.username : fp2?.username} wins!
              </span>
            )}
          </h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[fp1, fp2].map((p, i) => (
              <div key={i} className="text-center">
                <p className="font-bold text-white">{p?.username}</p>
                <p className={`text-sm font-mono ${(p?.ratingChange ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {(p?.ratingChange ?? 0) >= 0 ? '+' : ''}{p?.ratingChange}
                </p>
                <p className="text-xs text-gray-500">{p?.status}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Link to={`/replay/${matchId}`} className="btn-accent">
              Watch Replay
            </Link>
            <button onClick={() => navigate('/spectate')} className="btn-primary">
              Back to Live
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading / waiting
  if (matchState === 'loading' || !p1 || !p2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <p className="text-gray-400">{connected ? 'Loading match...' : 'Connecting...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/spectate" className="text-xs text-gray-500 hover:text-white">← Live</Link>
          <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-0.5 rounded font-bold">LIVE</span>
          {t1 && <span className={`text-xs px-1.5 py-0.5 rounded ${t1.color} ${t1.bgColor}`}>{t1.name}</span>}
          <span className="font-bold text-accent-blue">{p1.username}</span>
          <span className="text-xs text-accent-yellow">{p1.ratingBefore}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>&#128065;</span>
            <span>{spectatorCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-accent-yellow">{p2.ratingBefore}</span>
          <span className="font-bold text-accent-red">{p2.username}</span>
          {t2 && <span className={`text-xs px-1.5 py-0.5 rounded ${t2.color} ${t2.bgColor}`}>{t2.name}</span>}
        </div>
      </div>

      {/* Editors side by side */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-dark-600 min-h-0">
          <div className="h-8 bg-dark-800/80 border-b border-dark-600 flex items-center px-3 shrink-0">
            <span className="text-xs text-accent-blue font-medium">{p1.username}</span>
            <span className="text-xs text-gray-500 ml-2">{p1.language}</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor value={player1Code} onChange={() => {}} language={p1.language} readOnly height="100%" />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-8 bg-dark-800/80 border-b border-dark-600 flex items-center px-3 shrink-0">
            <span className="text-xs text-accent-red font-medium">{p2.username}</span>
            <span className="text-xs text-gray-500 ml-2">{p2.language}</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor value={player2Code} onChange={() => {}} language={p2.language} readOnly height="100%" />
          </div>
        </div>
      </div>
    </div>
  )
}
