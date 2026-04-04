import { lazy, Suspense } from 'react'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  height?: string
}

const LANGUAGE_MAP: Record<string, string> = {
  cpp: 'cpp',
  python: 'python',
  javascript: 'javascript',
  java: 'java',
}

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = '500px',
}: CodeEditorProps) {
  return (
    <Suspense
      fallback={
        <div
          className="bg-[#1e1e1e] rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <span className="text-gray-500">Loading editor...</span>
        </div>
      }
    >
      <MonacoEditor
        height={height}
        language={LANGUAGE_MAP[language] || 'plaintext'}
        value={value}
        onChange={(v) => onChange(v || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          tabSize: language === 'python' ? 4 : 2,
          wordWrap: 'on',
          padding: { top: 12 },
        }}
      />
    </Suspense>
  )
}
