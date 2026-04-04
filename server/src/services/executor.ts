import { exec } from 'child_process'
import { writeFile, rm, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { env } from '../config/env'

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
// Judge0 remote execution (tried first, cached for 5 min on failure)
// ---------------------------------------------------------------------------

const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54, python: 71, javascript: 63, java: 62,
}

let judge0Available = true
let lastJudge0Check = 0
const JUDGE0_RETRY_MS = 5 * 60 * 1000

async function executeViaJudge0(
  code: string, language: string, stdin: string, timeLimit: number, memoryLimit: number
): Promise<ExecutionResult> {
  const languageId = LANGUAGE_IDS[language]
  if (!languageId) throw new Error(`Unsupported language: ${language}`)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (env.judge0ApiKey) {
    headers['X-RapidAPI-Key'] = env.judge0ApiKey
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
  }

  const payload = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(stdin).toString('base64'),
    cpu_time_limit: Math.max(1, Math.min(timeLimit / 1000, 15)),
    memory_limit: memoryLimit * 1024,
    base64_encoded: true,
    wait: true,
  }

  const url = `${env.judge0ApiUrl}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`
  const start = Date.now()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const result = await response.json() as {
      stdout: string | null; stderr: string | null; compile_output: string | null
      status: { id: number }; time: string | null
    }

    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : ''
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : ''
    const compileOut = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : ''
    const sid = result.status.id
    const ms = result.time ? Math.round(parseFloat(result.time) * 1000) : Date.now() - start

    if (sid === 6) return { stdout: '', stderr: compileOut || stderr, exitCode: 1, executionTime: ms, compilationError: true }
    const rte = sid >= 7 && sid <= 12
    return { stdout, stderr: stderr || compileOut, exitCode: rte || sid === 5 ? 1 : 0, executionTime: ms, compilationError: false }
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Local execution — all 4 languages via child_process
// ---------------------------------------------------------------------------

const EXEC_DIR = '/tmp/cba-exec'
const COMPILE_TIMEOUT_MS = 30000
const RUN_TIMEOUT_MS = 10000

interface LangConfig {
  ext: string
  filename: string
  compile?: (dir: string) => string
  run: (dir: string) => string
  binaryName?: string // used for cache check
}

const LANG_CONFIGS: Record<string, LangConfig> = {
  cpp: {
    ext: '.cpp',
    filename: 'solution.cpp',
    compile: (dir) => `g++ -O2 -o ${dir}/solution ${dir}/solution.cpp`,
    run: (dir) => `${dir}/solution`,
    binaryName: 'solution',
  },
  python: {
    ext: '.py',
    filename: 'solution.py',
    run: (dir) => `python3 ${dir}/solution.py`,
  },
  javascript: {
    ext: '.js',
    filename: 'solution.js',
    run: (dir) => `node ${dir}/solution.js`,
  },
  java: {
    ext: '.java',
    filename: 'Main.java',
    compile: (dir) => `javac ${dir}/Main.java`,
    run: (dir) => `java -cp ${dir} Main`,
    binaryName: 'Main.class',
  },
}

// Compilation cache: hash(code+language) → dir with compiled binary
const compileCache = new Map<string, { dir: string; ts: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX = 50

function cacheKey(code: string, language: string): string {
  return crypto.createHash('md5').update(`${language}:${code}`).digest('hex')
}

function pruneCache() {
  if (compileCache.size <= CACHE_MAX) return
  const now = Date.now()
  for (const [key, entry] of compileCache) {
    if (now - entry.ts > CACHE_TTL_MS) {
      rm(entry.dir, { recursive: true, force: true }).catch(() => {})
      compileCache.delete(key)
    }
  }
}

async function executeLocally(
  code: string, language: string, stdin: string, timeLimit: number
): Promise<ExecutionResult> {
  const config = LANG_CONFIGS[language]
  if (!config) {
    return { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1, executionTime: 0, compilationError: true }
  }

  const id = crypto.randomBytes(8).toString('hex')
  const runDir = path.join(EXEC_DIR, id)
  let usedCacheDir: string | null = null

  try {
    await mkdir(runDir, { recursive: true })

    const inputPath = path.join(runDir, 'input.txt')
    await writeFile(inputPath, stdin)

    let execDir = runDir

    // Check compile cache for compiled languages
    if (config.compile) {
      const key = cacheKey(code, language)
      const cached = compileCache.get(key)

      if (cached) {
        // Reuse cached compilation
        execDir = cached.dir
        cached.ts = Date.now()
        usedCacheDir = cached.dir
      } else {
        // Write source and compile
        await writeFile(path.join(runDir, config.filename), code)

        const compileResult = await runCommand(config.compile(runDir), runDir, COMPILE_TIMEOUT_MS)

        if (compileResult.exitCode !== 0) {
          const isTimeout = compileResult.executionTime >= COMPILE_TIMEOUT_MS - 500
          return {
            stdout: '',
            stderr: isTimeout
              ? 'Compilation timed out (30s limit)'
              : (compileResult.stderr || compileResult.stdout || 'Compilation failed'),
            exitCode: 1,
            executionTime: compileResult.executionTime,
            compilationError: true,
          }
        }

        // Cache the compiled dir — don't delete it in finally
        compileCache.set(key, { dir: runDir, ts: Date.now() })
        usedCacheDir = runDir
        pruneCache()
      }
    } else {
      // Interpreted language — write source to run dir
      await writeFile(path.join(runDir, config.filename), code)
    }

    // Run with memory limit and execution timeout (separate from compile timeout)
    const execTimeoutMs = Math.min(timeLimit, RUN_TIMEOUT_MS)
    const cmd = `ulimit -v 262144 2>/dev/null; ${config.run(execDir)} < ${inputPath}`
    const result = await runCommand(cmd, execDir, execTimeoutMs)

    const isTimeout = result.exitCode !== 0 && result.executionTime >= execTimeoutMs - 500

    return {
      stdout: result.stdout,
      stderr: isTimeout ? 'Time limit exceeded' : result.stderr,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      compilationError: false,
    }
  } finally {
    // Only delete runDir if it's NOT the cached compile dir
    if (usedCacheDir !== runDir) {
      rm(runDir, { recursive: true, force: true }).catch(() => {})
    } else {
      // Still clean up input.txt from cached dir
      rm(path.join(runDir, 'input.txt'), { force: true }).catch(() => {})
    }
  }
}

function runCommand(
  cmd: string, cwd: string, timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; executionTime: number }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const child = exec(
      cmd,
      {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 2 * 1024 * 1024,
        shell: '/bin/sh',
        env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
      },
      (error, stdout, stderr) => {
        const elapsed = Date.now() - start

        if (error && 'killed' in error && error.killed) {
          resolve({ stdout: '', stderr: 'Time limit exceeded', exitCode: 124, executionTime: elapsed })
          return
        }

        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          executionTime: elapsed,
        })
      }
    )

    // Safety: kill if still alive after timeout
    setTimeout(() => {
      try { child.kill('SIGKILL') } catch {}
    }, timeoutMs + 1000)
  })
}

// ---------------------------------------------------------------------------
// Public API — Judge0 first, local fallback
// ---------------------------------------------------------------------------

export async function executeCode(
  code: string, language: string, stdin: string,
  timeLimit: number = 2000, memoryLimit: number = 256
): Promise<ExecutionResult> {
  // Try Judge0 if recently reachable or retry interval passed
  if (judge0Available || Date.now() - lastJudge0Check > JUDGE0_RETRY_MS) {
    try {
      const result = await executeViaJudge0(code, language, stdin, timeLimit, memoryLimit)
      judge0Available = true
      return result
    } catch {
      judge0Available = false
      lastJudge0Check = Date.now()
    }
  }

  return executeLocally(code, language, stdin, timeLimit)
}

export async function runTestCases(
  code: string,
  language: string,
  testCases: Array<{
    input: string; expectedOutput: string; isHidden: boolean
    timeLimit: number; memoryLimit: number
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
          testCase: i + 1, verdict: 'CE',
          input: tc.isHidden ? '[hidden]' : tc.input,
          expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
          actualOutput: '', stderr: exec.stderr,
          executionTime: exec.executionTime, isHidden: tc.isHidden,
        })
        for (let j = i + 1; j < cases.length; j++) {
          results.push({
            testCase: j + 1, verdict: 'CE',
            input: cases[j].isHidden ? '[hidden]' : cases[j].input,
            expectedOutput: cases[j].isHidden ? '[hidden]' : cases[j].expectedOutput,
            actualOutput: '', stderr: exec.stderr,
            executionTime: 0, isHidden: cases[j].isHidden,
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
        testCase: i + 1, verdict,
        input: tc.isHidden ? '[hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
        actualOutput: tc.isHidden ? '[hidden]' : actual,
        stderr: tc.isHidden ? '' : exec.stderr,
        executionTime: exec.executionTime, isHidden: tc.isHidden,
      })
    } catch (error) {
      results.push({
        testCase: i + 1, verdict: 'RTE',
        input: tc.isHidden ? '[hidden]' : tc.input,
        expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
        actualOutput: '',
        stderr: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0, isHidden: tc.isHidden,
      })
    }
  }

  return results
}
