import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useBattleStore } from '../store/battleStore'
import { useAuthStore } from '../store/authStore'
import { useAntiCheat } from '../hooks/useAntiCheat'
import { playMatchFound, playCountdownBeep, playCountdownGo, playSubmit, playVictory, playDefeat } from '../utils/sounds'
import { Panel, Group } from 'react-resizable-panels'
import CodeEditor from '../components/editor/CodeEditor'
import TestCasePanel from '../components/problem/TestCasePanel'
import ResizeHandle from '../components/ui/ResizeHandle'

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
]

const MATCH_DURATION_MS = 15 * 60 * 1000

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function BattleArena() {
  const { matchId: urlMatchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    matchState,
    matchId,
    problem,
    players,
    countdownSeconds,
    code,
    language,
    opponentCode,
    opponentTyping,
    opponentSubmitted,
    opponentRanTests,
    opponentSolved,
    playerDisconnected,
    startedAt,
    elapsedMs,
    testResults,
    testSummary,
    isRunning,
    isSubmitting,
    resultType,
    matchResult,
    connect,
    joinMatch,
    updateCode,
    changeLanguage,
    runTests,
    submitCode,
    updateElapsed,
    reset,
    findMatch: reFindMatch,
  } = useBattleStore()

  const [showProblem, setShowProblem] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevCountdown = useRef(0)

  const { socket } = useBattleStore()
  const { handlePaste, canSubmit } = useAntiCheat(socket, matchId, matchState)

  // Connect socket on mount
  useEffect(() => {
    connect()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [connect])

  // Sound effects
  useEffect(() => {
    if (matchState === 'found') playMatchFound()
  }, [matchState])

  useEffect(() => {
    if (countdownSeconds > 0 && countdownSeconds < prevCountdown.current) {
      playCountdownBeep()
    }
    if (prevCountdown.current > 0 && countdownSeconds === 0 && matchState === 'in_progress') {
      playCountdownGo()
    }
    prevCountdown.current = countdownSeconds
  }, [countdownSeconds, matchState])

  useEffect(() => {
    if (matchState === 'finished' && matchResult) {
      const isWinner = matchResult.winner === user?._id
      const isDraw = matchResult.result === 'draw'
      if (isWinner) {
        playVictory()
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      } else if (!isDraw) {
        playDefeat()
      }
    }
  }, [matchState, matchResult, user?._id])

  // Join match if navigating directly
  useEffect(() => {
    if (urlMatchId && matchId !== urlMatchId) {
      joinMatch(urlMatchId)
    }
  }, [urlMatchId, matchId, joinMatch])

  // Timer
  useEffect(() => {
    if (matchState === 'in_progress' && startedAt) {
      timerRef.current = setInterval(() => {
        updateElapsed(Date.now() - startedAt)
      }, 100)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [matchState, startedAt, updateElapsed])

  // Set page title
  useEffect(() => {
    document.title = matchState === 'in_progress'
      ? `Battle - ${formatTime(elapsedMs)} | Code Battle Arena`
      : 'Battle Arena | Code Battle Arena'
  }, [matchState, elapsedMs])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      const oldCode = useBattleStore.getState().code
      const diff = newCode.length - oldCode.length

      // Anti-cheat: detect large pastes
      if (diff > 50) handlePaste(diff)

      // Optimistic local update
      useBattleStore.setState({ code: newCode })

      // Debounce emit
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateCode(newCode)
      }, 300)
    },
    [updateCode, handlePaste]
  )

  const handleSubmitWithRateLimit = useCallback(() => {
    if (canSubmit()) {
      playSubmit()
      submitCode()
    }
  }, [canSubmit, submitCode])

  const opponent = players.find((p) => p.userId !== user?._id)
  const self = players.find((p) => p.userId === user?._id)
  const timeRemaining = MATCH_DURATION_MS - elapsedMs
  const isTimeLow = timeRemaining < 60000

  // COUNTDOWN overlay
  if (matchState === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Match starting in</p>
          <div className="text-9xl font-bold text-accent-green animate-pulse">
            {countdownSeconds}
          </div>
          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-accent-blue font-bold text-xl">{self?.username}</p>
              <p className="text-accent-yellow text-sm">{self?.elo}</p>
            </div>
            <span className="text-4xl font-bold text-gray-600">VS</span>
            <div className="text-center">
              <p className="text-accent-red font-bold text-xl">{opponent?.username}</p>
              <p className="text-accent-yellow text-sm">{opponent?.elo}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // FINISHED overlay
  if (matchState === 'finished' && matchResult) {
    const myResult = matchResult.players.find((p) => p.userId === user?._id)
    const oppResult = matchResult.players.find((p) => p.userId !== user?._id)
    const isWinner = matchResult.winner === user?._id
    const isDraw = matchResult.result === 'draw'

    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="card max-w-lg w-full text-center">
          <div className="text-6xl mb-4">
            {isDraw ? '🤝' : isWinner ? '🏆' : '💀'}
          </div>
          <h1
            className={`text-4xl font-bold mb-2 ${
              isDraw ? 'text-accent-yellow' : isWinner ? 'text-accent-green' : 'text-accent-red'
            }`}
          >
            {isDraw ? 'Draw!' : isWinner ? 'Victory!' : 'Defeat'}
          </h1>

          <div className="grid grid-cols-2 gap-6 mt-6 mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">You</p>
              <p className="text-xl font-bold text-white">{myResult?.username}</p>
              <p className="text-2xl font-bold text-accent-yellow">
                {myResult?.ratingAfter}
                <span
                  className={`text-sm ml-2 ${
                    (myResult?.ratingChange ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'
                  }`}
                >
                  {(myResult?.ratingChange ?? 0) >= 0 ? '+' : ''}
                  {myResult?.ratingChange}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {myResult?.testCasesPassed}/{myResult?.totalTestCases} tests passed
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Opponent</p>
              <p className="text-xl font-bold text-white">{oppResult?.username}</p>
              <p className="text-2xl font-bold text-accent-yellow">
                {oppResult?.ratingAfter}
                <span
                  className={`text-sm ml-2 ${
                    (oppResult?.ratingChange ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'
                  }`}
                >
                  {(oppResult?.ratingChange ?? 0) >= 0 ? '+' : ''}
                  {oppResult?.ratingChange}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {oppResult?.testCasesPassed}/{oppResult?.totalTestCases} tests passed
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                reset()
                reFindMatch()
              }}
              className="btn-accent"
            >
              Play Again
            </button>
            <button
              onClick={() => {
                reset()
                navigate('/dashboard')
              }}
              className="btn-primary"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // WAITING / match not ready
  if (matchState !== 'in_progress' || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="text-gray-400 text-lg">Waiting for match to start...</div>
          <div className="mt-4 animate-pulse text-accent-blue">Loading battle room</div>
        </div>
      </div>
    )
  }

  // IN_PROGRESS — main battle view
  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* Top bar */}
      <div className="h-12 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-accent-blue font-bold">{self?.username}</span>
          <span className="text-xs text-accent-yellow">{self?.elo}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`text-2xl font-mono font-bold ${isTimeLow ? 'text-accent-red animate-pulse' : 'text-white'}`}
          >
            {formatTime(elapsedMs)}
          </div>
          <span className="text-xs text-gray-500">/ {formatTime(MATCH_DURATION_MS)}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {opponentTyping && (
              <span className="text-xs text-gray-500 animate-pulse">typing...</span>
            )}
            {opponentRanTests && (
              <span className="text-xs text-accent-yellow animate-pulse">ran tests</span>
            )}
            {opponentSubmitted && (
              <span className="text-xs text-accent-blue animate-pulse">submitted!</span>
            )}
            {opponentSolved && (
              <span className="text-xs text-accent-green font-bold">SOLVED</span>
            )}
          </div>
          <span className="text-accent-red font-bold">{opponent?.username}</span>
          <span className="text-xs text-accent-yellow">{opponent?.elo}</span>
        </div>
      </div>

      {/* Disconnect warning */}
      {playerDisconnected && (
        <div className="bg-accent-yellow/10 border-b border-accent-yellow/30 text-accent-yellow text-center text-sm py-1">
          {playerDisconnected.username} disconnected — they have 60s to reconnect or forfeit
        </div>
      )}

      {/* Main area — resizable panels */}
      <Group orientation="horizontal" className="flex-1 overflow-hidden">
        {/* Problem panel */}
        {showProblem && (
          <>
            <Panel defaultSize={25} minSize={15} className="overflow-y-auto bg-dark-800/50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">{problem.title}</h2>
                  <button
                    onClick={() => setShowProblem(false)}
                    className="text-gray-500 hover:text-white text-xs"
                  >
                    Hide
                  </button>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                    problem.difficulty === 'easy'
                      ? 'text-accent-green bg-accent-green/10'
                      : problem.difficulty === 'medium'
                        ? 'text-accent-yellow bg-accent-yellow/10'
                        : 'text-accent-red bg-accent-red/10'
                  }`}
                >
                  {problem.difficulty}
                </span>

                <div className="mt-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {problem.description}
                </div>

                {problem.examples.map((ex, i) => (
                  <div key={i} className="mt-4 bg-dark-900/50 rounded p-3">
                    <p className="text-xs font-bold text-gray-400 mb-2">Example {i + 1}</p>
                    <div className="text-xs">
                      <p className="text-gray-500">Input:</p>
                      <pre className="text-gray-300 mb-1">{ex.input}</pre>
                      <p className="text-gray-500">Output:</p>
                      <pre className="text-gray-300 mb-1">{ex.output}</pre>
                      {ex.explanation && (
                        <p className="text-gray-500 mt-1">{ex.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}

                {problem.constraints && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-400 mb-1">Constraints</p>
                    <pre className="text-xs text-gray-500 whitespace-pre-wrap">{problem.constraints}</pre>
                  </div>
                )}
              </div>
            </Panel>
            <ResizeHandle />
          </>
        )}

        {/* Player editor panel */}
        <Panel defaultSize={showProblem ? 40 : 50} minSize={15}>
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="h-10 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-3 shrink-0">
              <div className="flex items-center gap-2">
                {!showProblem && (
                  <button
                    onClick={() => setShowProblem(true)}
                    className="text-xs text-accent-blue hover:underline mr-2"
                  >
                    Show Problem
                  </button>
                )}
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs text-gray-300"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runTests}
                  disabled={isRunning || isSubmitting}
                  className="px-3 py-1 bg-dark-600 text-gray-300 rounded text-xs font-medium hover:bg-dark-700 disabled:opacity-50"
                >
                  {isRunning ? 'Running...' : 'Run'}
                </button>
                <button
                  onClick={handleSubmitWithRateLimit}
                  disabled={isRunning || isSubmitting}
                  className="px-3 py-1 bg-accent-green text-dark-900 rounded text-xs font-bold hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Editor + Results vertical split */}
            <Group orientation="vertical" className="flex-1 min-h-0">
              <Panel defaultSize={testResults.length > 0 || testSummary ? 70 : 100} minSize={20}>
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  height="100%"
                />
              </Panel>

              {(testResults.length > 0 || testSummary) && (
                <>
                  <ResizeHandle direction="vertical" />
                  <Panel defaultSize={30} minSize={20}>
                    <div className="h-full overflow-y-auto p-3 bg-dark-800/50">
                      <TestCasePanel
                        results={testResults}
                        summary={testSummary}
                        isSubmission={resultType === 'submit'}
                      />
                    </div>
                  </Panel>
                </>
              )}
            </Group>
          </div>
        </Panel>

        <ResizeHandle />

        {/* Opponent editor panel */}
        <Panel defaultSize={showProblem ? 35 : 50} minSize={15}>
          <div className="h-full flex flex-col">
            <div className="h-10 bg-dark-800 border-b border-dark-600 flex items-center px-3 shrink-0">
              <span className="text-xs text-gray-400">
                {opponent?.username}&apos;s code
                {opponentTyping && (
                  <span className="text-accent-yellow ml-2 animate-pulse">typing...</span>
                )}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor
                value={opponentCode}
                onChange={() => {}}
                language={language}
                readOnly
                height="100%"
              />
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  )
}
