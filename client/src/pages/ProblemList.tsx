import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface ProblemSummary {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  metadata: { timesUsed: number; solveRate: number }
}

const DIFFICULTY_COLORS = {
  easy: 'text-accent-green',
  medium: 'text-accent-yellow',
  hard: 'text-accent-red',
}

const ALL_TAGS = [
  'array', 'string', 'hash-table', 'math', 'dynamic-programming',
  'sorting', 'greedy', 'binary-search', 'stack', 'two-pointers',
  'linked-list', 'sliding-window', 'design', 'interval',
]

export default function ProblemList() {
  const [problems, setProblems] = useState<ProblemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')

  useEffect(() => {
    document.title = 'Problems | Code Battle Arena'
    fetchProblems()
  }, [difficulty, selectedTag])

  const fetchProblems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (difficulty) params.set('difficulty', difficulty)
      if (selectedTag) params.set('tag', selectedTag)

      const { data } = await api.get(`/problems?${params}`)
      if (data.success) {
        setProblems(data.data.problems)
      }
    } catch {
      // silently fail, empty list shown
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Problems</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {['', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                difficulty === d
                  ? 'bg-accent-blue text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {d || 'All'}
            </button>
          ))}
        </div>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent-blue"
        >
          <option value="">All Tags</option>
          {ALL_TAGS.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Problem Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600 text-left text-sm text-gray-400">
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Difficulty</th>
              <th className="px-6 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-dark-600/50">
                  <td className="px-6 py-4"><div className="h-4 w-48 bg-dark-700 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-dark-700 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-dark-700 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No problems found
                </td>
              </tr>
            ) : (
              problems.map((problem) => (
                <tr key={problem._id} className="border-b border-dark-600/50 hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/problem/${problem.slug}`}
                      className="text-white hover:text-accent-blue transition-colors font-medium"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium capitalize ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-dark-600 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
