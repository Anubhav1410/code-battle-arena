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

interface TestCasePanelProps {
  results: TestResult[]
  summary: {
    passed: number
    total: number
    allPassed: boolean
    verdict?: string
  } | null
  isSubmission?: boolean
}

const VERDICT_COLORS: Record<string, string> = {
  AC: 'text-accent-green bg-accent-green/10 border-accent-green/30',
  WA: 'text-accent-red bg-accent-red/10 border-accent-red/30',
  TLE: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/30',
  RTE: 'text-accent-red bg-accent-red/10 border-accent-red/30',
  CE: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/30',
}

const VERDICT_LABELS: Record<string, string> = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit Exceeded',
  RTE: 'Runtime Error',
  CE: 'Compilation Error',
}

export default function TestCasePanel({ results, summary, isSubmission }: TestCasePanelProps) {
  if (!results.length && !summary) return null

  return (
    <div className="space-y-3">
      {/* Summary */}
      {summary && (
        <div
          className={`rounded-lg p-4 border ${
            summary.allPassed
              ? 'bg-accent-green/10 border-accent-green/30'
              : 'bg-accent-red/10 border-accent-red/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-lg font-bold ${
                summary.allPassed ? 'text-accent-green' : 'text-accent-red'
              }`}
            >
              {isSubmission
                ? summary.allPassed
                  ? 'All Tests Passed!'
                  : `${VERDICT_LABELS[summary.verdict || 'WA']}`
                : summary.allPassed
                  ? 'All Visible Tests Passed!'
                  : 'Some Tests Failed'}
            </span>
            <span className="text-gray-400 text-sm">
              {summary.passed}/{summary.total} passed
            </span>
          </div>
        </div>
      )}

      {/* Individual test results */}
      {results.map((result) => (
        <div
          key={result.testCase}
          className={`rounded-lg border p-3 ${VERDICT_COLORS[result.verdict]}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              Test Case {result.testCase}
              {result.isHidden && ' (hidden)'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-70">{result.executionTime}ms</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded border border-current">
                {result.verdict}
              </span>
            </div>
          </div>

          {!result.isHidden && result.verdict !== 'AC' && (
            <div className="space-y-2 text-xs mt-3">
              <div>
                <span className="text-gray-400 block mb-0.5">Input:</span>
                <pre className="bg-dark-900/50 rounded p-2 text-gray-300 overflow-x-auto">
                  {result.input}
                </pre>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Expected:</span>
                <pre className="bg-dark-900/50 rounded p-2 text-gray-300 overflow-x-auto">
                  {result.expectedOutput}
                </pre>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Actual:</span>
                <pre className="bg-dark-900/50 rounded p-2 text-gray-300 overflow-x-auto">
                  {result.actualOutput || '(no output)'}
                </pre>
              </div>
              {result.stderr && (
                <div>
                  <span className="text-gray-400 block mb-0.5">Stderr:</span>
                  <pre className="bg-dark-900/50 rounded p-2 text-accent-red/80 overflow-x-auto">
                    {result.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
