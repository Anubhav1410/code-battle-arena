import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  useEffect(() => {
    document.title = '404 — Code Battle Arena'
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-bold text-accent-red/20">404</h1>
      <h2 className="text-3xl font-bold text-white mt-4">Page not found</h2>
      <p className="text-gray-400 mt-2 mb-8 max-w-md">
        Looks like this page got a Runtime Error. The code you're looking for doesn't exist
        — or maybe it timed out.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="btn-accent">
          Go Home
        </Link>
        <Link to="/problems" className="btn-primary">
          Browse Problems
        </Link>
      </div>
    </div>
  )
}
