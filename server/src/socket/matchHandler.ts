import { Server as SocketServer } from 'socket.io'
import { AuthSocket } from './index'
import { Match } from '../models/Match'
import { User } from '../models/User'
import { Problem } from '../models/Problem'
import { runTestCases } from '../services/executor'
import { calculateElo } from '../services/eloService'
import { updateLeaderboard } from '../services/leaderboardService'
import { checkCodeSimilarity, logSuspiciousEvent } from '../services/antiCheat'
import { env } from '../config/env'

const COUNTDOWN_SECONDS = 5
const MATCH_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const DISCONNECT_GRACE_MS = 60 * 1000 // 60 seconds

// Track active matches in memory
const activeMatches = new Map<
  string,
  {
    startedAt: number
    timer: ReturnType<typeof setTimeout> | null
    disconnectTimers: Map<string, ReturnType<typeof setTimeout>>
    playersJoined: Set<string>
    playerCode: Map<string, string>
    playerLanguage: Map<string, string>
  }
>()

function getMatchState(matchId: string) {
  if (!activeMatches.has(matchId)) {
    activeMatches.set(matchId, {
      startedAt: 0,
      timer: null,
      disconnectTimers: new Map(),
      playersJoined: new Set(),
      playerCode: new Map(),
      playerLanguage: new Map(),
    })
  }
  return activeMatches.get(matchId)!
}

async function endMatch(
  io: SocketServer,
  matchId: string,
  reason: 'solved' | 'timeout' | 'forfeit'
): Promise<void> {
  const match = await Match.findById(matchId)
  if (!match || match.state === 'finished') return

  const state = activeMatches.get(matchId)
  if (state?.timer) clearTimeout(state.timer)

  const now = Date.now()
  const startedAt = state?.startedAt || now
  const duration = now - startedAt

  const p1 = match.players[0]
  const p2 = match.players[1]

  // Store final code
  if (state) {
    const code1 = state.playerCode.get(String(p1.userId)) || ''
    const code2 = state.playerCode.get(String(p2.userId)) || ''
    p1.finalCode = code1
    p2.finalCode = code2
    const lang1 = state.playerLanguage.get(String(p1.userId))
    const lang2 = state.playerLanguage.get(String(p2.userId))
    if (lang1) p1.language = lang1
    if (lang2) p2.language = lang2
  }

  // Determine winner
  let result: 'player1' | 'player2' | 'draw' | 'timeout' = 'timeout'
  let winnerId: string | null = null

  if (reason === 'forfeit') {
    // The player who didn't disconnect wins
    const disconnected = state?.disconnectTimers
    if (disconnected?.has(String(p1.userId))) {
      result = 'player2'
      winnerId = String(p2.userId)
    } else {
      result = 'player1'
      winnerId = String(p1.userId)
    }
  } else {
    const p1Solved = p1.status === 'solved'
    const p2Solved = p2.status === 'solved'

    if (p1Solved && p2Solved) {
      if (p1.solveTime < p2.solveTime) {
        result = 'player1'
        winnerId = String(p1.userId)
      } else if (p2.solveTime < p1.solveTime) {
        result = 'player2'
        winnerId = String(p2.userId)
      } else {
        result = 'draw'
      }
    } else if (p1Solved) {
      result = 'player1'
      winnerId = String(p1.userId)
    } else if (p2Solved) {
      result = 'player2'
      winnerId = String(p2.userId)
    } else {
      // Neither solved — compare test cases
      if (p1.testCasesPassed > p2.testCasesPassed) {
        result = 'player1'
        winnerId = String(p1.userId)
      } else if (p2.testCasesPassed > p1.testCasesPassed) {
        result = 'player2'
        winnerId = String(p2.userId)
      } else {
        result = 'draw'
      }
    }
  }

  // Calculate ELO
  const actualScoreP1 = result === 'player1' ? 1 : result === 'draw' ? 0.5 : 0
  const { newRatingA, newRatingB } = calculateElo(p1.ratingBefore, p2.ratingBefore, actualScoreP1)

  p1.ratingAfter = newRatingA
  p2.ratingAfter = newRatingB

  match.winner = winnerId ? (winnerId as unknown as typeof match.winner) : null
  match.result = result
  match.state = 'finished'
  match.duration = duration
  match.endedAt = new Date()

  await match.save()

  // Update user ratings and stats
  try {
    const updateUser = async (
      userId: string,
      newRating: number,
      isWinner: boolean | null,
      playerData: typeof p1
    ) => {
      const update: Record<string, unknown> = {
        'rating.elo': newRating,
        $inc: {
          'stats.totalMatches': 1,
          'rating.wins': isWinner === true ? 1 : 0,
          'rating.losses': isWinner === false ? 1 : 0,
          'rating.draws': isWinner === null ? 1 : 0,
        },
        $push: {
          'rating.history': {
            date: new Date(),
            elo: newRating,
            matchId: match._id,
          },
        },
      }

      if (isWinner === true) {
        update.$inc = {
          ...(update.$inc as Record<string, number>),
          'stats.winStreak': 1,
        }
      }

      if (playerData.status === 'solved') {
        update.$inc = {
          ...(update.$inc as Record<string, number>),
          'stats.problemsSolved': 1,
        }
      }

      await User.findByIdAndUpdate(userId, update)

      // Update bestWinStreak separately
      if (isWinner === true) {
        const user = await User.findById(userId)
        if (user && user.stats.winStreak > user.stats.bestWinStreak) {
          user.stats.bestWinStreak = user.stats.winStreak
          await user.save()
        }
      } else if (isWinner === false) {
        await User.findByIdAndUpdate(userId, { 'stats.winStreak': 0 })
      }
    }

    const p1IsWinner = result === 'player1' ? true : result === 'draw' ? null : false
    const p2IsWinner = result === 'player2' ? true : result === 'draw' ? null : false

    await Promise.all([
      updateUser(String(p1.userId), newRatingA, p1IsWinner, p1),
      updateUser(String(p2.userId), newRatingB, p2IsWinner, p2),
    ])

    // Sync to Redis leaderboard
    await Promise.all([
      updateLeaderboard(String(p1.userId), newRatingA, p1.username),
      updateLeaderboard(String(p2.userId), newRatingB, p2.username),
    ])
  } catch (err) {
    if (env.isDev) console.error('[Match] ELO update error:', err)
  }

  // Emit result to room
  const roomName = `match:${matchId}`
  io.to(roomName).emit('match:finished', {
    matchId,
    result,
    winner: winnerId,
    players: [
      {
        userId: String(p1.userId),
        username: p1.username,
        ratingBefore: p1.ratingBefore,
        ratingAfter: newRatingA,
        ratingChange: newRatingA - p1.ratingBefore,
        testCasesPassed: p1.testCasesPassed,
        totalTestCases: p1.totalTestCases,
        status: p1.status,
        solveTime: p1.solveTime,
      },
      {
        userId: String(p2.userId),
        username: p2.username,
        ratingBefore: p2.ratingBefore,
        ratingAfter: newRatingB,
        ratingChange: newRatingB - p2.ratingBefore,
        testCasesPassed: p2.testCasesPassed,
        totalTestCases: p2.totalTestCases,
        status: p2.status,
        solveTime: p2.solveTime,
      },
    ],
  })

  // Notify spectators
  io.to(`spectate:${matchId}`).emit('spectate:match_finished', {
    matchId, result, winner: winnerId,
    players: [
      { userId: String(p1.userId), username: p1.username, ratingChange: newRatingA - p1.ratingBefore, status: p1.status },
      { userId: String(p2.userId), username: p2.username, ratingChange: newRatingB - p2.ratingBefore, status: p2.status },
    ],
  })

  // Cleanup
  if (state) {
    state.disconnectTimers.forEach((t) => clearTimeout(t))
  }
  activeMatches.delete(matchId)

  // Anti-cheat: check code similarity
  checkCodeSimilarity(matchId).catch(() => {})

  if (env.isDev) {
    console.log(`[Match] ${matchId} finished: ${result}. ELO: ${p1.username}=${newRatingA}, ${p2.username}=${newRatingB}`)
  }
}

export function registerMatchHandlers(io: SocketServer, socket: AuthSocket): void {
  // Player joins battle room
  socket.on('match:join', async ({ matchId }: { matchId: string }) => {
    const match = await Match.findById(matchId)
    if (!match) {
      socket.emit('match:error', { error: 'Match not found' })
      return
    }

    const isPlayer = match.players.some((p) => String(p.userId) === socket.userId)
    if (!isPlayer) {
      socket.emit('match:error', { error: 'Not a player in this match' })
      return
    }

    const roomName = `match:${matchId}`
    socket.join(roomName)

    const state = getMatchState(matchId)

    // Clear disconnect timer if reconnecting
    const disconnectTimer = state.disconnectTimers.get(socket.userId)
    if (disconnectTimer) {
      clearTimeout(disconnectTimer)
      state.disconnectTimers.delete(socket.userId)
      io.to(roomName).emit('match:player_reconnected', {
        userId: socket.userId,
        username: socket.username,
      })
    }

    state.playersJoined.add(socket.userId)

    // If both players joined and still in waiting state, start countdown
    if (state.playersJoined.size === 2 && match.state === 'waiting') {
      match.state = 'countdown'
      await match.save()

      io.to(roomName).emit('match:countdown', { seconds: COUNTDOWN_SECONDS })

      let secondsLeft = COUNTDOWN_SECONDS
      const countdownInterval = setInterval(async () => {
        secondsLeft--
        io.to(roomName).emit('match:countdown_tick', { seconds: secondsLeft })

        if (secondsLeft <= 0) {
          clearInterval(countdownInterval)

          // Start match
          const m = await Match.findById(matchId)
          if (!m || m.state === 'finished') return

          m.state = 'in_progress'
          m.startedAt = new Date()
          await m.save()

          state.startedAt = Date.now()

          io.to(roomName).emit('match:start', {
            startedAt: state.startedAt,
            durationMs: MATCH_DURATION_MS,
          })

          // Set 15-minute timer
          state.timer = setTimeout(() => {
            endMatch(io, matchId, 'timeout')
          }, MATCH_DURATION_MS)
        }
      }, 1000)
    }

    // Send current match state to joining player
    socket.emit('match:state', {
      matchId,
      state: match.state,
      players: match.players.map((p) => ({
        userId: String(p.userId),
        username: p.username,
        ratingBefore: p.ratingBefore,
      })),
    })
  })

  // Code update from player
  socket.on(
    'code:update',
    async ({ matchId, code, language }: { matchId: string; code: string; language: string }) => {
      const state = activeMatches.get(matchId)
      if (!state) return

      state.playerCode.set(socket.userId, code)
      state.playerLanguage.set(socket.userId, language)

      // Log event
      const timestamp = state.startedAt > 0 ? Date.now() - state.startedAt : 0
      Match.findByIdAndUpdate(matchId, {
        $push: {
          events: {
            timestamp,
            playerId: socket.userId,
            type: 'code_change',
            data: { code, language },
          },
        },
      }).catch(() => {})

      // Broadcast to opponent in room with 500ms delay info
      const roomName = `match:${matchId}`
      socket.to(roomName).emit('opponent:code_update', {
        userId: socket.userId,
        code,
        language,
        timestamp,
      })

      // Also emit typing indicator
      socket.to(roomName).emit('opponent:typing', { userId: socket.userId })

      // Broadcast to spectators
      io.to(`spectate:${matchId}`).emit('spectate:code_update', {
        userId: socket.userId,
        code,
        language,
      })
    }
  )

  // Run tests
  socket.on(
    'match:run_tests',
    async ({ matchId, code, language }: { matchId: string; code: string; language: string }) => {
      const match = await Match.findById(matchId)
      if (!match) {
        socket.emit('match:test_results', {
          results: [], summary: { passed: 0, total: 0, allPassed: false },
          error: 'Match not found', type: 'run',
        })
        return
      }
      if (match.state !== 'in_progress') {
        socket.emit('match:test_results', {
          results: [], summary: { passed: 0, total: 0, allPassed: false },
          error: `Match is ${match.state}, not in progress`, type: 'run',
        })
        return
      }

      const state = activeMatches.get(matchId)
      if (!state) {
        socket.emit('match:test_results', {
          results: [], summary: { passed: 0, total: 0, allPassed: false },
          error: 'Match state not found in memory', type: 'run',
        })
        return
      }

      const problem = await Problem.findById(match.problemId)
      if (!problem) {
        socket.emit('match:test_results', {
          results: [], summary: { passed: 0, total: 0, allPassed: false },
          error: 'Problem not found', type: 'run',
        })
        return
      }

      const timestamp = Date.now() - state.startedAt

      // Notify opponent and spectators
      const roomName = `match:${matchId}`
      socket.to(roomName).emit('opponent:ran_tests', { userId: socket.userId })
      io.to(`spectate:${matchId}`).emit('spectate:player_action', {
        userId: socket.userId, username: socket.username, action: 'ran_tests',
      })

      // Log run event
      Match.findByIdAndUpdate(matchId, {
        $push: {
          events: { timestamp, playerId: socket.userId, type: 'run_tests', data: { language } },
        },
      }).catch(() => {})

      try {
        const results = await runTestCases(code, language, problem.testCases, false)
        const passed = results.filter((r) => r.verdict === 'AC').length

        // Log result event
        Match.findByIdAndUpdate(matchId, {
          $push: {
            events: {
              timestamp: Date.now() - state.startedAt,
              playerId: socket.userId,
              type: 'test_result',
              data: { passed, total: results.length, type: 'run' },
            },
          },
        }).catch(() => {})

        socket.emit('match:test_results', {
          results,
          summary: { passed, total: results.length, allPassed: passed === results.length },
          type: 'run',
        })
      } catch (err) {
        if (env.isDev) console.error('[Run] Execution error:', err)
        socket.emit('match:test_results', {
          results: [],
          summary: { passed: 0, total: 0, allPassed: false },
          error: err instanceof Error ? err.message : 'Execution failed',
          type: 'run',
        })
      }
    }
  )

  // Submit solution
  socket.on(
    'match:submit',
    async ({ matchId, code, language }: { matchId: string; code: string; language: string }) => {
      const match = await Match.findById(matchId)
      if (!match || match.state !== 'in_progress') return

      const state = activeMatches.get(matchId)
      if (!state) return

      const problem = await Problem.findById(match.problemId)
      if (!problem) return

      const timestamp = Date.now() - state.startedAt

      // Log submit event
      Match.findByIdAndUpdate(matchId, {
        $push: {
          events: { timestamp, playerId: socket.userId, type: 'submit', data: { language } },
        },
      }).catch(() => {})

      // Notify opponent and spectators
      const roomName = `match:${matchId}`
      socket.to(roomName).emit('opponent:submitted', { userId: socket.userId })
      io.to(`spectate:${matchId}`).emit('spectate:player_action', {
        userId: socket.userId, username: socket.username, action: 'submitted',
      })

      try {
        const results = await runTestCases(code, language, problem.testCases, true)
        const passed = results.filter((r) => r.verdict === 'AC').length
        const total = results.length
        const allPassed = passed === total

        // Update player data in match
        const playerIndex = match.players.findIndex((p) => String(p.userId) === socket.userId)
        if (playerIndex !== -1) {
          match.players[playerIndex].testCasesPassed = passed
          match.players[playerIndex].totalTestCases = total
          match.players[playerIndex].language = language
          match.players[playerIndex].finalCode = code
          if (allPassed) {
            match.players[playerIndex].status = 'solved'
            match.players[playerIndex].solveTime = timestamp
          } else if (passed > 0) {
            match.players[playerIndex].status = 'partial'
          }
          await match.save()
        }

        // Log result event
        Match.findByIdAndUpdate(matchId, {
          $push: {
            events: {
              timestamp: Date.now() - state.startedAt,
              playerId: socket.userId,
              type: 'test_result',
              data: { passed, total, allPassed, type: 'submit' },
            },
          },
        }).catch(() => {})

        socket.emit('match:test_results', {
          results,
          summary: {
            passed,
            total,
            allPassed,
            verdict: allPassed ? 'AC' : results.find((r) => r.verdict !== 'AC')?.verdict || 'WA',
          },
          type: 'submit',
        })

        // If solved, check if match should end
        if (allPassed) {
          io.to(roomName).emit('match:player_solved', {
            userId: socket.userId,
            username: socket.username,
            solveTime: timestamp,
          })
          io.to(`spectate:${matchId}`).emit('spectate:player_action', {
            userId: socket.userId, username: socket.username, action: 'solved', solveTime: timestamp,
          })

          // Check if both solved or if this is the first solver
          const refreshed = await Match.findById(matchId)
          if (refreshed) {
            const bothSolved = refreshed.players.every((p) => p.status === 'solved')
            if (bothSolved) {
              endMatch(io, matchId, 'solved')
            }
            // If only one solved, match continues — opponent still has time
          }
        }
      } catch (err) {
        socket.emit('match:test_results', {
          results: [],
          summary: { passed: 0, total: 0, allPassed: false },
          error: err instanceof Error ? err.message : 'Execution failed',
          type: 'submit',
        })
      }
    }
  )

  // Language change
  socket.on(
    'match:language_change',
    ({ matchId, language }: { matchId: string; language: string }) => {
      const state = activeMatches.get(matchId)
      if (state) {
        state.playerLanguage.set(socket.userId, language)
      }
    }
  )

  // Anti-cheat events
  socket.on(
    'anticheat:paste',
    ({ matchId, charCount }: { matchId: string; charCount: number }) => {
      const state = activeMatches.get(matchId)
      if (!state) return
      const timestamp = state.startedAt > 0 ? Date.now() - state.startedAt : 0
      logSuspiciousEvent(matchId, {
        type: 'large_paste',
        playerId: socket.userId,
        timestamp,
        details: `Pasted ${charCount} characters`,
      })
    }
  )

  socket.on(
    'anticheat:tab_switch',
    ({ matchId, count }: { matchId: string; count: number }) => {
      const state = activeMatches.get(matchId)
      if (!state) return
      const timestamp = state.startedAt > 0 ? Date.now() - state.startedAt : 0
      logSuspiciousEvent(matchId, {
        type: 'tab_switch',
        playerId: socket.userId,
        timestamp,
        details: `Tab switch #${count}`,
      })
    }
  )

  // Handle disconnect with grace period
  socket.on('disconnect', () => {
    // Find any active match this player is in
    for (const [matchId, state] of activeMatches.entries()) {
      if (state.playersJoined.has(socket.userId)) {
        const roomName = `match:${matchId}`

        io.to(roomName).emit('match:player_disconnected', {
          userId: socket.userId,
          username: socket.username,
          gracePeriodMs: DISCONNECT_GRACE_MS,
        })

        // Set forfeit timer
        const timer = setTimeout(() => {
          endMatch(io, matchId, 'forfeit')
        }, DISCONNECT_GRACE_MS)

        state.disconnectTimers.set(socket.userId, timer)
      }
    }
  })
}
