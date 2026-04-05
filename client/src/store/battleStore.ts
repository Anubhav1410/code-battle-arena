import { create } from 'zustand'
import { connectSocket, disconnectSocket } from '../services/socket'
import type { Socket } from 'socket.io-client'

type MatchState = 'idle' | 'searching' | 'found' | 'countdown' | 'in_progress' | 'finished'

interface PlayerInfo {
  userId: string
  username: string
  elo: number
}

interface MatchResult {
  result: 'player1' | 'player2' | 'draw' | 'timeout'
  winner: string | null
  players: Array<{
    userId: string
    username: string
    ratingBefore: number
    ratingAfter: number
    ratingChange: number
    testCasesPassed: number
    totalTestCases: number
    status: string
    solveTime: number
  }>
}

interface TestResult {
  testCase: number
  verdict: 'AC' | 'WA' | 'TLE' | 'RTE' | 'CE'
  input: string
  expectedOutput: string
  actualOutput: string
  stderr: string
  executionTime: number
  isHidden: boolean
}

interface Problem {
  _id: string
  title: string
  slug: string
  description: string
  difficulty: string
  tags: string[]
  constraints: string
  examples: Array<{ input: string; output: string; explanation: string }>
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
  starterCode: Record<string, string>
}

interface BattleState {
  // Connection
  socket: Socket | null
  connected: boolean
  reconnecting: boolean
  disconnectedAt: number | null

  // Match state
  matchState: MatchState
  matchId: string | null
  problem: Problem | null
  players: PlayerInfo[]
  countdownSeconds: number
  searchStartTime: number | null

  // Battle
  code: string
  language: string
  opponentCode: string
  opponentLanguage: string
  startedAt: number | null
  elapsedMs: number

  // Status indicators
  opponentTyping: boolean
  opponentSubmitted: boolean
  opponentRanTests: boolean
  opponentSolved: boolean
  playerDisconnected: { userId: string; username: string } | null

  // Results
  testResults: TestResult[]
  testSummary: { passed: number; total: number; allPassed: boolean; verdict?: string } | null
  isRunning: boolean
  isSubmitting: boolean
  resultType: 'run' | 'submit' | null
  matchResult: MatchResult | null

  // Actions
  connect: () => void
  disconnect: () => void
  findMatch: () => void
  cancelSearch: () => void
  joinMatch: (matchId: string) => void
  updateCode: (code: string) => void
  changeLanguage: (language: string) => void
  runTests: () => void
  submitCode: () => void
  updateElapsed: (ms: number) => void
  reset: () => void
}

export const useBattleStore = create<BattleState>((set, get) => ({
  socket: null,
  connected: false,
  reconnecting: false,
  disconnectedAt: null,
  matchState: 'idle',
  matchId: null,
  problem: null,
  players: [],
  countdownSeconds: 0,
  searchStartTime: null,
  code: '',
  language: 'cpp',
  opponentCode: '',
  opponentLanguage: 'cpp',
  startedAt: null,
  elapsedMs: 0,
  opponentTyping: false,
  opponentSubmitted: false,
  opponentRanTests: false,
  opponentSolved: false,
  playerDisconnected: null,
  testResults: [],
  testSummary: null,
  isRunning: false,
  isSubmitting: false,
  resultType: null,
  matchResult: null,

  connect: () => {
    const { socket: existingSocket } = get()
    if (existingSocket) return

    let forfeitTimer: ReturnType<typeof setTimeout> | null = null

    const socket = connectSocket()
    set({ socket, connected: socket.connected })

    socket.on('connect', () => {
      const { matchId, matchState, reconnecting } = get()
      set({ connected: true, reconnecting: false, disconnectedAt: null })

      // Re-join match room after reconnect
      if (reconnecting && matchId && matchState !== 'idle' && matchState !== 'finished') {
        socket.emit('match:join', { matchId })
      }

      if (forfeitTimer) {
        clearTimeout(forfeitTimer)
        forfeitTimer = null
      }
    })

    socket.on('disconnect', () => {
      const { matchState } = get()
      const inBattle = matchState === 'in_progress' || matchState === 'countdown'

      set({
        connected: false,
        reconnecting: inBattle,
        disconnectedAt: inBattle ? Date.now() : null,
      })

      // Start 60s forfeit countdown if in a battle
      if (inBattle) {
        forfeitTimer = setTimeout(() => {
          const { connected } = get()
          if (!connected) {
            set({ matchState: 'finished', reconnecting: false })
          }
        }, 60000)
      }
    })

    socket.io.on('reconnect_attempt', () => {
      set({ reconnecting: true })
    })

    socket.io.on('reconnect_failed', () => {
      const { matchState } = get()
      if (matchState === 'in_progress' || matchState === 'countdown') {
        set({ matchState: 'finished', reconnecting: false })
      }
    })

    // Matchmaking events
    socket.on('matchmaking:joined', () => {
      set({ matchState: 'searching', searchStartTime: Date.now() })
    })

    socket.on('matchmaking:cancelled', () => {
      set({ matchState: 'idle', searchStartTime: null })
    })

    socket.on('match:found', ({ matchId, problem, players }) => {
      set({
        matchState: 'found',
        matchId,
        problem,
        players,
        code: problem.starterCode?.cpp || '',
        language: 'cpp',
        searchStartTime: null,
      })
      // Auto-join the match room
      socket.emit('match:join', { matchId })
    })

    // Match lifecycle events
    socket.on('match:countdown', ({ seconds }) => {
      set({ matchState: 'countdown', countdownSeconds: seconds })
    })

    socket.on('match:countdown_tick', ({ seconds }) => {
      set({ countdownSeconds: seconds })
    })

    socket.on('match:start', ({ startedAt }) => {
      set({ matchState: 'in_progress', startedAt })
    })

    socket.on('match:finished', (result: MatchResult) => {
      set({ matchState: 'finished', matchResult: result })
    })

    // Opponent events
    let typingTimeout: ReturnType<typeof setTimeout> | null = null

    socket.on('opponent:code_update', ({ code, language }) => {
      // 500ms artificial delay
      setTimeout(() => {
        set({ opponentCode: code, opponentLanguage: language })
      }, 500)

      set({ opponentTyping: true })
      if (typingTimeout) clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => set({ opponentTyping: false }), 1500)
    })

    socket.on('opponent:typing', () => {
      set({ opponentTyping: true })
      if (typingTimeout) clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => set({ opponentTyping: false }), 1500)
    })

    socket.on('opponent:ran_tests', () => {
      set({ opponentRanTests: true })
      setTimeout(() => set({ opponentRanTests: false }), 3000)
    })

    socket.on('opponent:submitted', () => {
      set({ opponentSubmitted: true })
      setTimeout(() => set({ opponentSubmitted: false }), 3000)
    })

    socket.on('match:player_solved', () => {
      set({ opponentSolved: true })
    })

    socket.on('match:player_disconnected', ({ userId, username }) => {
      set({ playerDisconnected: { userId, username } })
    })

    socket.on('match:player_reconnected', () => {
      set({ playerDisconnected: null })
    })

    // Test results
    socket.on('match:test_results', ({ results, summary, type }) => {
      set({
        testResults: results || [],
        testSummary: summary,
        isRunning: false,
        isSubmitting: false,
        resultType: type,
      })
    })

    socket.on('match:error', () => {
      // errors handled via toast in components
    })
  },

  disconnect: () => {
    disconnectSocket()
    set({ socket: null, connected: false })
  },

  findMatch: () => {
    const { socket } = get()
    if (socket) {
      socket.emit('matchmaking:join')
    }
  },

  cancelSearch: () => {
    const { socket } = get()
    if (socket) {
      socket.emit('matchmaking:cancel')
    }
    set({ matchState: 'idle', searchStartTime: null })
  },

  joinMatch: (matchId: string) => {
    const { socket } = get()
    if (socket) {
      socket.emit('match:join', { matchId })
    }
  },

  updateCode: (code: string) => {
    const { socket, matchId, language } = get()
    set({ code })
    if (socket && matchId) {
      socket.emit('code:update', { matchId, code, language })
    }
  },

  changeLanguage: (language: string) => {
    const { socket, matchId, problem } = get()
    set({
      language,
      code: problem?.starterCode[language] || '',
    })
    if (socket && matchId) {
      socket.emit('match:language_change', { matchId, language })
    }
  },

  runTests: () => {
    const { socket, matchId, code, language } = get()
    if (socket && matchId) {
      set({ isRunning: true, testResults: [], testSummary: null, resultType: null })
      socket.emit('match:run_tests', { matchId, code, language })
    }
  },

  submitCode: () => {
    const { socket, matchId, code, language } = get()
    if (socket && matchId) {
      set({ isSubmitting: true, testResults: [], testSummary: null, resultType: null })
      socket.emit('match:submit', { matchId, code, language })
    }
  },

  updateElapsed: (ms: number) => {
    set({ elapsedMs: ms })
  },

  reset: () => {
    set({
      matchState: 'idle',
      matchId: null,
      problem: null,
      players: [],
      countdownSeconds: 0,
      searchStartTime: null,
      code: '',
      language: 'cpp',
      opponentCode: '',
      opponentLanguage: 'cpp',
      startedAt: null,
      elapsedMs: 0,
      reconnecting: false,
      disconnectedAt: null,
      opponentTyping: false,
      opponentSubmitted: false,
      opponentRanTests: false,
      opponentSolved: false,
      playerDisconnected: null,
      testResults: [],
      testSummary: null,
      isRunning: false,
      isSubmitting: false,
      resultType: null,
      matchResult: null,
    })
  },
}))
