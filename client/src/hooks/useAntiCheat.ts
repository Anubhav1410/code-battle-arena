import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Socket } from 'socket.io-client'

export function useAntiCheat(
  socket: Socket | null,
  matchId: string | null,
  matchState: string
) {
  const tabSwitchCount = useRef(0)
  const lastSubmitTime = useRef(0)

  // Tab visibility tracking
  useEffect(() => {
    if (matchState !== 'in_progress' || !socket || !matchId) return

    const handler = () => {
      if (document.hidden) {
        tabSwitchCount.current++
        socket.emit('anticheat:tab_switch', { matchId, count: tabSwitchCount.current })

        if (tabSwitchCount.current >= 3) {
          toast.error('Excessive tab switching detected', { duration: 4000 })
        }
      }
    }

    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [matchState, socket, matchId])

  const handlePaste = (charCount: number) => {
    if (!socket || !matchId) return

    if (charCount > 50) {
      socket.emit('anticheat:paste', { matchId, charCount })
      toast('Large paste detected', {
        icon: '&#9888;&#65039;',
        duration: 3000,
        style: { background: '#1a1a2e', color: '#ffaa00', border: '1px solid #ffaa00' },
      })
    }
  }

  const canSubmit = (): boolean => {
    const now = Date.now()
    if (now - lastSubmitTime.current < 10000) {
      toast.error('Please wait 10 seconds between submissions')
      return false
    }
    lastSubmitTime.current = now
    return true
  }

  return { handlePaste, canSubmit }
}
