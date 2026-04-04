import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useBattleStore } from '../store/battleStore'
import { useAuthStore } from '../store/authStore'

export default function Challenge() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { socket, matchState, matchId, connect } = useBattleStore()
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    document.title = 'Challenge | Code Battle Arena'
    connect()
  }, [connect])

  // Auto-join when socket is ready
  useEffect(() => {
    if (roomCode && socket && !joining) {
      setJoining(true)
      socket.emit('challenge:join', { code: roomCode })

      socket.on('challenge:error', ({ error }: { error: string }) => {
        toast.error(error)
        setJoining(false)
      })
    }
  }, [roomCode, socket, joining])

  // Navigate to battle when matched
  useEffect(() => {
    if (matchState === 'found' && matchId) {
      navigate(`/battle/${matchId}`)
    }
  }, [matchState, matchId, navigate])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="card text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">You've been challenged!</h2>
          <p className="text-gray-400 mb-6">Sign in to accept this challenge.</p>
          <a
            href={`/login?redirect=/challenge/${roomCode}`}
            className="btn-accent inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="card text-center max-w-md">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Joining Challenge...</h2>
        <p className="text-gray-400 text-sm">Room code: <span className="font-mono text-accent-yellow">{roomCode}</span></p>
      </div>
    </div>
  )
}
