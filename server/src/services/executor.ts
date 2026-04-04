import { env } from '../config/env'

interface PistonRequest {
  language: string
  version: string
  files: Array<{ content: string }>
  stdin: string
  compile_timeout?: number
  run_timeout?: number
  compile_memory_limit?: number
  run_memory_limit?: number
}

interface PistonResponse {
  run: {
    stdout: string
    stderr: string
    code: number | null
    signal: string | null
    output: string
  }
  compile?: {
    stdout: string
    stderr: string
    code: number | null
    signal: string | null
    output: string
  }
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

const LANGUAGE_VERSIONS: Record<string, { language: string; version: string }> = {
  cpp: { language: 'c++', version: '10.2.0' },
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  java: { language: 'java', version: '15.0.2' },
}

export async function executeCode(
  code: string,
  language: string,
  stdin: string,
  timeLimit: number = 2000,
  memoryLimit: number = 256
): Promise<ExecutionResult> {
  const langConfig = LANGUAGE_VERSIONS[language]
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const payload: PistonRequest = {
    language: langConfig.language,
    version: langConfig.version,
    files: [{ content: code }],
    stdin,
    run_timeout: timeLimit,
    compile_timeout: 10000,
    run_memory_limit: memoryLimit * 1024 * 1024,
    compile_memory_limit: memoryLimit * 1024 * 1024,
  }

  const start = Date.now()

  const response = await fetch(`${env.pistonApiUrl}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const elapsed = Date.now() - start

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.status} ${response.statusText}`)
  }

  const result = (await response.json()) as PistonResponse

  if (result.compile && result.compile.code !== 0 && result.compile.stderr) {
    return {
      stdout: '',
      stderr: result.compile.stderr,
      exitCode: result.compile.code,
      executionTime: elapsed,
      compilationError: true,
    }
  }

  return {
    stdout: result.run.stdout,
    stderr: result.run.stderr,
    exitCode: result.run.code,
    executionTime: elapsed,
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
      if (exec.exitCode !== 0 && exec.stderr) {
        verdict = exec.stderr.toLowerCase().includes('timeout') ? 'TLE' : 'RTE'
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
