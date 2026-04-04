import { env } from '../config/env'

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,        // C++ (GCC 9.2.0)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  java: 62,       // Java (OpenJDK 13.0.1)
}

// Judge0 status IDs
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
}

interface Judge0Response {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: { id: number; description: string }
  time: string | null
  memory: number | null
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

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  // RapidAPI requires these headers
  if (env.judge0ApiKey) {
    headers['X-RapidAPI-Key'] = env.judge0ApiKey
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
  }
  return headers
}

export async function executeCode(
  code: string,
  language: string,
  stdin: string,
  timeLimit: number = 2000,
  memoryLimit: number = 256
): Promise<ExecutionResult> {
  const languageId = LANGUAGE_IDS[language]
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const timeLimitSeconds = Math.max(1, Math.min(timeLimit / 1000, 15))

  const payload = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(stdin).toString('base64'),
    cpu_time_limit: timeLimitSeconds,
    memory_limit: memoryLimit * 1024, // Judge0 expects KB
    base64_encoded: true,
    wait: true,
  }

  const start = Date.now()

  const response = await fetch(
    `${env.judge0ApiUrl}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }
  )

  const elapsed = Date.now() - start

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Judge0 API error: ${response.status} ${text}`)
  }

  const result = (await response.json()) as Judge0Response

  const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : ''
  const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : ''
  const compileOutput = result.compile_output
    ? Buffer.from(result.compile_output, 'base64').toString()
    : ''
  const statusId = result.status.id
  const timeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : elapsed

  // Compilation error
  if (statusId === STATUS.COMPILATION_ERROR) {
    return {
      stdout: '',
      stderr: compileOutput || stderr,
      exitCode: 1,
      executionTime: timeMs,
      compilationError: true,
    }
  }

  // Runtime errors
  const isRuntimeError =
    statusId >= STATUS.RUNTIME_ERROR_SIGSEGV && statusId <= STATUS.RUNTIME_ERROR_OTHER

  return {
    stdout,
    stderr: stderr || compileOutput,
    exitCode: isRuntimeError || statusId === STATUS.TIME_LIMIT ? 1 : 0,
    executionTime: timeMs,
    compilationError: false,
  }
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
        // CE means all remaining tests also fail
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
