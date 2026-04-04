import { execFile } from 'child_process'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { env } from '../config/env'

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,
  python: 71,
  javascript: 63,
  java: 62,
}

export type Verdict = 'AC' | 'WA' | 'TLE' | 'RTE' | 'CE'

export interface TestResult {
  testCase: number
  verdict: Verdict
  input: string
  expectedOutput: string
  actualOutput: string
  stderr: string
  executionTime: number
  isHidden: boolean
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number | null
  executionTime: number
  compilationError: boolean
}

// ---------------------------------------------------------------------------
// Judge0 remote execution
// ---------------------------------------------------------------------------

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (env.judge0ApiKey) {
    headers['X-RapidAPI-Key'] = env.judge0ApiKey
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
  }
  return headers
}

async function executeViaJudge0(
  code: string,
  language: string,
  stdin: string,
  timeLimit: number,
  memoryLimit: number
): Promise<ExecutionResult> {
  const languageId = LANGUAGE_IDS[language]
  if (!languageId) throw new Error(`Unsupported language: ${language}`)

  const timeLimitSeconds = Math.max(1, Math.min(timeLimit / 1000, 15))

  const payload = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(stdin).toString('base64'),
    cpu_time_limit: timeLimitSeconds,
    memory_limit: memoryLimit * 1024,
    base64_encoded: true,
    wait: true,
  }

  const url = `${env.judge0ApiUrl}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`

  console.log(`[Executor] Judge0 POST ${url}`)

  const start = Date.now()
  let response: Response

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
  } catch (err: unknown) {
    const e = err as Error & { cause?: Error & { code?: string } }
    console.error(`[Executor] Judge0 fetch failed:`, {
      message: e.message,
      cause: e.cause?.message,
      code: e.cause?.code,
    })
    throw new Error(`Judge0 unreachable: ${e.cause?.message || e.message}`)
  }

  const elapsed = Date.now() - start

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error(`[Executor] Judge0 HTTP ${response.status}: ${text.slice(0, 200)}`)
    throw new Error(`Judge0 error: ${response.status}`)
  }

  const result = await response.json() as {
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    status: { id: number }
    time: string | null
  }

  const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : ''
  const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : ''
  const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : ''
  const statusId = result.status.id
  const timeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : elapsed

  if (statusId === 6) {
    return { stdout: '', stderr: compileOutput || stderr, exitCode: 1, executionTime: timeMs, compilationError: true }
  }

  const isRTE = statusId >= 7 && statusId <= 12
  return {
    stdout,
    stderr: stderr || compileOutput,
    exitCode: isRTE || statusId === 5 ? 1 : 0,
    executionTime: timeMs,
    compilationError: false,
  }
}

// ---------------------------------------------------------------------------
// Local fallback — runs Python/JS via child_process when Judge0 is unreachable
// ---------------------------------------------------------------------------

const LOCAL_COMMANDS: Record<string, { cmd: string; ext: string }> = {
  python: { cmd: 'python3', ext: '.py' },
  javascript: { cmd: 'node', ext: '.js' },
}

async function executeLocally(
  code: string,
  language: string,
  stdin: string,
  timeLimit: number
): Promise<ExecutionResult> {
  const config = LOCAL_COMMANDS[language]
  if (!config) {
    return {
      stdout: '',
      stderr: `Local execution only supports Python and JavaScript. ${language} requires Judge0.`,
      exitCode: 1,
      executionTime: 0,
      compilationError: true,
    }
  }

  const tmpDir = path.join(os.tmpdir(), 'cba-exec')
  await mkdir(tmpDir, { recursive: true })
  const id = crypto.randomBytes(8).toString('hex')
  const filePath = path.join(tmpDir, `${id}${config.ext}`)

  try {
    await writeFile(filePath, code)

    const start = Date.now()
    const timeoutMs = Math.min(timeLimit, 10000)

    return await new Promise<ExecutionResult>((resolve) => {
      const child = execFile(
        config.cmd,
        [filePath],
        { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          const elapsed = Date.now() - start

          if (error && 'killed' in error && error.killed) {
            resolve({ stdout: '', stderr: 'Time limit exceeded', exitCode: 1, executionTime: elapsed, compilationError: false })
            return
          }

          resolve({
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
            executionTime: elapsed,
            compilationError: false,
          })
        }
      )

      if (child.stdin) {
        child.stdin.write(stdin)
        child.stdin.end()
      }
    })
  } finally {
    unlink(filePath).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Public API — tries Judge0 first, falls back to local execution
// ---------------------------------------------------------------------------

let judge0Available = true
let lastJudge0Check = 0

export async function executeCode(
  code: string,
  language: string,
  stdin: string,
  timeLimit: number = 2000,
  memoryLimit: number = 256
): Promise<ExecutionResult> {
  // Try Judge0 if it was recently reachable (re-check every 60s)
  if (judge0Available || Date.now() - lastJudge0Check > 60000) {
    try {
      const result = await executeViaJudge0(code, language, stdin, timeLimit, memoryLimit)
      judge0Available = true
      return result
    } catch {
      console.log('[Executor] Judge0 failed, falling back to local execution')
      judge0Available = false
      lastJudge0Check = Date.now()
    }
  }

  // Fallback to local
  return executeLocally(code, language, stdin, timeLimit)
}

export async function runTestCases(
  code: string,
  language: string,
  testCases: Array<{
    input: string
    expectedOutput: string
    isHidden: boolean
    timeLimit: number
    memoryLimit: number
  }>,
  includeHidden: boolean
): Promise<TestResult[]> {
  const cases = includeHidden ? testCases : testCases.filter((tc) => !tc.isHidden)
  const results: TestResult[] = []

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i]
    try {
      const exec = await executeCode(code, language, tc.input, tc.timeLimit, tc.memoryLimit)

      if (exec.compilationError) {
        results.push({
          testCase: i + 1,
          verdict: 'CE',
          input: tc.isHidden ? '[hidden]' : tc.input,
          expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
          actualOutput: '',
          stderr: exec.stderr,
          executionTime: exec.executionTime,
          isHidden: tc.isHidden,
        })
        for (let j = i + 1; j < cases.length; j++) {
          results.push({
            testCase: j + 1,
            verdict: 'CE',
            input: cases[j].isHidden ? '[hidden]' : cases[j].input,
            expectedOutput: cases[j].isHidden ? '[hidden]' : cases[j].expectedOutput,
            actualOutput: '',
            stderr: exec.stderr,
            executionTime: 0,
            isHidden: cases[j].isHidden,
          })
        }
        break
      }

      const actual = exec.stdout.trim()
      const expected = tc.expectedOutput.trim()

      let verdict: Verdict
      if (exec.exitCode !== 0) {
        verdict = exec.stderr.toLowerCase().includes('time') ? 'TLE' : 'RTE'
      } else if (actual === expected) {
        verdict = 'AC'
      } else {
        verdict = 'WA'
      }

      results.push({
        testCase: i + 1,
        verdict,
        input: tc.isHidden ? '[hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? '[hidden]' : actual,
        stderr: tc.isHidden ? '' : exec.stderr,
        executionTime: exec.executionTime,
        isHidden: tc.isHidden,
      })
    } catch (error) {
      results.push({
        testCase: i + 1,
        verdict: 'RTE',
        input: tc.isHidden ? '[hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
        actualOutput: '',
        stderr: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        isHidden: tc.isHidden,
      })
    }
  }

  return results
}
