import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Panel, Group } from 'react-resizable-panels'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import CodeEditor from '../components/editor/CodeEditor'
import TestCasePanel from '../components/problem/TestCasePanel'
import ResizeHandle from '../components/ui/ResizeHandle'

interface Example {
  input: string
  output: string
  explanation: string
}

interface Problem {
  _id: string
  title: string
  slug: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  constraints: string
  examples: Example[]
  testCases: Array<{
    input: string
    expectedOutput: string
    isHidden: boolean
  }>
  starterCode: Record<string, string>
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

const DIFFICULTY_COLORS = {
  easy: 'text-accent-green bg-accent-green/10',
  medium: 'text-accent-yellow bg-accent-yellow/10',
  hard: 'text-accent-red bg-accent-red/10',
}

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
]

export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuthStore()

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('cpp')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<{
    passed: number
    total: number
    allPassed: boolean
    verdict?: string
  } | null>(null)
  const [isSubmission, setIsSubmission] = useState(false)

  useEffect(() => {
    if (slug) fetchProblem()
  }, [slug])

  useEffect(() => {
    if (problem?.starterCode[language]) {
      setCode(problem.starterCode[language])
    }
  }, [language, problem])

  const fetchProblem = async () => {
    try {
      const { data } = await api.get(`/problems/${slug}`)
      if (data.success) {
        setProblem(data.data.problem)
        document.title = `${data.data.problem.title} | Code Battle Arena`
        setCode(data.data.problem.starterCode.cpp || '')
      }
    } catch {
      toast.error('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }

  const handleRun = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to run code')
      return
    }
    setRunning(true)
    setResults([])
    setSummary(null)
    setIsSubmission(false)
    try {
      const { data } = await api.post(`/problems/${slug}/run`, { code, language })
      if (data.success) {
        setResults(data.data.results)
        setSummary(data.data.summary)
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to submit')
      return
    }
    setSubmitting(true)
    setResults([])
    setSummary(null)
    setIsSubmission(true)
    try {
      const { data } = await api.post(`/problems/${slug}/submit`, { code, language })
      if (data.success) {
        setResults(data.data.results)
        setSummary(data.data.summary)
        if (data.data.summary.allPassed) {
          toast.success('All test cases passed!')
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-dark-700 rounded" />
          <div className="h-4 w-full bg-dark-700 rounded" />
          <div className="h-4 w-3/4 bg-dark-700 rounded" />
          <div className="h-96 bg-dark-700 rounded" />
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-accent-red">Problem not found</h1>
      </div>
    )
  }

  const hasResults = results.length > 0 || summary

  return (
    <div className="h-[calc(100vh-56px)]">
      <Group orientation="horizontal">
        {/* Left: Problem Description */}
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full overflow-y-auto p-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{problem.title}</h1>
              <span
                className={`text-xs font-bold px-2 py-1 rounded capitalize ${
                  DIFFICULTY_COLORS[problem.difficulty]
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-dark-600 text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="card prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                {problem.description}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <h3 className="text-lg font-bold">Examples</h3>
              {problem.examples.map((ex, i) => (
                <div key={i} className="card space-y-2">
                  <p className="text-sm font-bold text-gray-300">Example {i + 1}</p>
                  <div>
                    <span className="text-xs text-gray-500">Input:</span>
                    <pre className="bg-dark-900 rounded p-2 text-sm text-gray-300 mt-1 overflow-x-auto">
                      {ex.input}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Output:</span>
                    <pre className="bg-dark-900 rounded p-2 text-sm text-gray-300 mt-1 overflow-x-auto">
                      {ex.output}
                    </pre>
                  </div>
                  {ex.explanation && (
                    <div>
                      <span className="text-xs text-gray-500">Explanation:</span>
                      <p className="text-sm text-gray-400 mt-1">{ex.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {problem.constraints && (
              <div className="card mt-4">
                <h3 className="text-lg font-bold mb-2">Constraints</h3>
                <pre className="text-sm text-gray-400 whitespace-pre-wrap">
                  {problem.constraints}
                </pre>
              </div>
            )}
          </div>
        </Panel>

        <ResizeHandle />

        {/* Right: Editor + Results */}
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="h-12 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-4 shrink-0">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="px-4 py-1.5 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
                >
                  {running ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="btn-accent text-sm py-1.5 px-4"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Editor + Results vertical split */}
            <Group orientation="vertical" className="flex-1 min-h-0">
              <Panel defaultSize={hasResults ? 65 : 100} minSize={20}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="100%"
                />
              </Panel>

              {hasResults && (
                <>
                  <ResizeHandle direction="vertical" />
                  <Panel defaultSize={35} minSize={15}>
                    <div className="h-full overflow-y-auto p-4 bg-dark-800/30">
                      <TestCasePanel results={results} summary={summary} isSubmission={isSubmission} />
                    </div>
                  </Panel>
                </>
              )}
            </Group>
          </div>
        </Panel>
      </Group>
    </div>
  )
}
