import { useState, useEffect, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'

interface Problem {
  _id: string
  title: string
  slug: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  tags: string[]
  constraints: string
  examples: Array<{ input: string; output: string; explanation: string }>
  testCases: Array<{
    input: string
    expectedOutput: string
    isHidden: boolean
    timeLimit: number
    memoryLimit: number
  }>
  starterCode: { cpp: string; python: string; javascript: string; java: string }
}

const EMPTY_PROBLEM: Omit<Problem, '_id'> = {
  title: '',
  slug: '',
  difficulty: 'easy',
  description: '',
  tags: [],
  constraints: '',
  examples: [{ input: '', output: '', explanation: '' }],
  testCases: [{ input: '', expectedOutput: '', isHidden: false, timeLimit: 2000, memoryLimit: 256 }],
  starterCode: { cpp: '', python: '', javascript: '', java: '' },
}

export default function AdminPanel() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Omit<Problem, '_id'> & { _id?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Admin Panel | Code Battle Arena'
    fetchProblems()
  }, [])

  const fetchProblems = async () => {
    try {
      const { data } = await api.get('/admin/problems')
      if (data.success) setProblems(data.data.problems)
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)

    try {
      if (editing._id) {
        const { data } = await api.put(`/admin/problems/${editing.slug}`, editing)
        if (data.success) {
          toast.success('Problem updated')
          setEditing(null)
          fetchProblems()
        }
      } else {
        const { data } = await api.post('/admin/problems', editing)
        if (data.success) {
          toast.success('Problem created')
          setEditing(null)
          fetchProblems()
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this problem?')) return
    try {
      await api.delete(`/admin/problems/${slug}`)
      toast.success('Problem deleted')
      fetchProblems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const loadForEdit = async (slug: string) => {
    try {
      const { data } = await api.get(`/admin/problems/${slug}`)
      if (data.success) setEditing(data.data.problem)
    } catch {
      toast.error('Failed to load problem')
    }
  }

  const addExample = () => {
    if (!editing) return
    setEditing({
      ...editing,
      examples: [...editing.examples, { input: '', output: '', explanation: '' }],
    })
  }

  const removeExample = (idx: number) => {
    if (!editing) return
    setEditing({
      ...editing,
      examples: editing.examples.filter((_, i) => i !== idx),
    })
  }

  const addTestCase = () => {
    if (!editing) return
    setEditing({
      ...editing,
      testCases: [
        ...editing.testCases,
        { input: '', expectedOutput: '', isHidden: true, timeLimit: 2000, memoryLimit: 256 },
      ],
    })
  }

  const removeTestCase = (idx: number) => {
    if (!editing) return
    setEditing({
      ...editing,
      testCases: editing.testCases.filter((_, i) => i !== idx),
    })
  }

  // Form view
  if (editing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {editing._id ? 'Edit Problem' : 'Create Problem'}
          </h1>
          <button
            onClick={() => setEditing(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic info */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="input-field"
                  pattern="^[a-z0-9-]+$"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                <select
                  value={editing.difficulty}
                  onChange={(e) =>
                    setEditing({ ...editing, difficulty: e.target.value as Problem['difficulty'] })
                  }
                  className="input-field"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                <input
                  value={editing.tags.join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description (markdown)</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="input-field h-48 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Constraints</label>
              <textarea
                value={editing.constraints}
                onChange={(e) => setEditing({ ...editing, constraints: e.target.value })}
                className="input-field h-20 font-mono text-sm"
              />
            </div>
          </div>

          {/* Examples */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Examples</h2>
              <button type="button" onClick={addExample} className="text-sm text-accent-blue hover:underline">
                + Add Example
              </button>
            </div>
            {editing.examples.map((ex, i) => (
              <div key={i} className="bg-dark-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Example {i + 1}</span>
                  {editing.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(i)}
                      className="text-xs text-accent-red hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Input</label>
                    <textarea
                      value={ex.input}
                      onChange={(e) => {
                        const examples = [...editing.examples]
                        examples[i] = { ...examples[i], input: e.target.value }
                        setEditing({ ...editing, examples })
                      }}
                      className="input-field h-20 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Output</label>
                    <textarea
                      value={ex.output}
                      onChange={(e) => {
                        const examples = [...editing.examples]
                        examples[i] = { ...examples[i], output: e.target.value }
                        setEditing({ ...editing, examples })
                      }}
                      className="input-field h-20 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Explanation</label>
                  <input
                    value={ex.explanation}
                    onChange={(e) => {
                      const examples = [...editing.examples]
                      examples[i] = { ...examples[i], explanation: e.target.value }
                      setEditing({ ...editing, examples })
                    }}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Test Cases */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Test Cases</h2>
              <button type="button" onClick={addTestCase} className="text-sm text-accent-blue hover:underline">
                + Add Test Case
              </button>
            </div>
            {editing.testCases.map((tc, i) => (
              <div key={i} className="bg-dark-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-300">Test {i + 1}</span>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => {
                          const testCases = [...editing.testCases]
                          testCases[i] = { ...testCases[i], isHidden: e.target.checked }
                          setEditing({ ...editing, testCases })
                        }}
                        className="rounded"
                      />
                      Hidden
                    </label>
                  </div>
                  {editing.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(i)}
                      className="text-xs text-accent-red hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => {
                        const testCases = [...editing.testCases]
                        testCases[i] = { ...testCases[i], input: e.target.value }
                        setEditing({ ...editing, testCases })
                      }}
                      className="input-field h-20 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expected Output</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const testCases = [...editing.testCases]
                        testCases[i] = { ...testCases[i], expectedOutput: e.target.value }
                        setEditing({ ...editing, testCases })
                      }}
                      className="input-field h-20 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Starter Code */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold">Starter Code</h2>
            {(['cpp', 'python', 'javascript', 'java'] as const).map((lang) => (
              <div key={lang}>
                <label className="block text-sm text-gray-400 mb-1 capitalize">{lang}</label>
                <textarea
                  value={editing.starterCode[lang]}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      starterCode: { ...editing.starterCode, [lang]: e.target.value },
                    })
                  }
                  className="input-field h-32 font-mono text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-accent">
              {saving ? 'Saving...' : editing._id ? 'Update Problem' : 'Create Problem'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-primary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={() => setEditing({ ...EMPTY_PROBLEM })}
          className="btn-accent"
        >
          + New Problem
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600 text-left text-sm text-gray-400">
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Slug</th>
              <th className="px-6 py-3 font-medium">Difficulty</th>
              <th className="px-6 py-3 font-medium">Tests</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No problems yet. Create one or run the seed script.
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p._id} className="border-b border-dark-600/50 hover:bg-dark-700/50">
                  <td className="px-6 py-3 font-medium text-white">{p.title}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm font-mono">{p.slug}</td>
                  <td className="px-6 py-3">
                    <span className={`text-sm capitalize ${
                      p.difficulty === 'easy'
                        ? 'text-accent-green'
                        : p.difficulty === 'medium'
                          ? 'text-accent-yellow'
                          : 'text-accent-red'
                    }`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-sm">{p.testCases.length}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadForEdit(p.slug)}
                        className="text-xs text-accent-blue hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.slug)}
                        className="text-xs text-accent-red hover:underline"
                      >
                        Delete
                      </button>
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
