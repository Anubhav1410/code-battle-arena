import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    document.title = 'Code Battle Arena — Real-time Competitive Coding'
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-green/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-block mb-4 px-3 py-1 bg-accent-green/10 border border-accent-green/20 rounded-full">
            <span className="text-accent-green text-sm font-medium">Real-time 1v1 Coding Battles</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-accent-green">Code</span>{' '}
            <span className="text-white">Battle</span>{' '}
            <span className="text-accent-blue">Arena</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto mb-10">
            Real-time competitive coding. Match. Battle. Rise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-accent text-lg px-10 py-4">
              Get Started — It's Free
            </Link>
            <Link to="/spectate" className="btn-primary text-lg px-10 py-4">
              Watch Live Matches
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-4">
            No credit card required. Start battling in 30 seconds.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-dark-600">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            Everything you need to compete
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            A complete competitive coding platform built for real-time 1v1 battles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '&#9876;',
                title: 'Real-time 1v1 Battles',
                desc: 'Get matched by ELO rating. Same problem, same timer. Race to solve it first.',
              },
              {
                icon: '&#127942;',
                title: 'ELO Ranking System',
                desc: 'Climb from Bronze to Master. Six tiers with distinct badges. Global and weekly leaderboards.',
              },
              {
                icon: '&#128065;',
                title: 'Live Spectating',
                desc: 'Watch matches in real-time. See both players\' code as they type.',
              },
              {
                icon: '&#9199;',
                title: 'Match Replays',
                desc: 'Replay any match with a timeline scrubber. Study your opponents\' strategies.',
              },
            ].map((f, i) => (
              <div key={i} className="card text-center hover:border-accent-blue/30 transition-colors">
                <div className="text-4xl mb-4" dangerouslySetInnerHTML={{ __html: f.icon }} />
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-dark-800/50 border-t border-dark-600">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Find a match',
                desc: 'Click "Find Match" and get paired with a player near your skill level within seconds.',
              },
              {
                step: '2',
                title: 'Solve the problem',
                desc: 'Both players get the same problem. Write your solution in C++, Python, JS, or Java. Run tests and submit.',
              },
              {
                step: '3',
                title: 'Climb the ranks',
                desc: 'Win matches to gain ELO. Rise through the tiers. Top the leaderboard.',
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-blue font-bold text-xl">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-dark-600">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '20+', label: 'Problems' },
              { value: '4', label: 'Languages' },
              { value: '6', label: 'Tier Ranks' },
              { value: '15min', label: 'Per Match' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-accent-yellow">{s.value}</p>
                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-dark-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to compete?</h2>
          <p className="text-gray-400 mb-8">Join the arena and prove your coding skills.</p>
          <Link to="/register" className="btn-accent text-lg px-10 py-4">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent-green font-bold">Code</span>
            <span className="text-white font-bold">Battle</span>
            <span className="text-gray-600 text-sm ml-2">Arena</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/problems" className="hover:text-white transition-colors">Problems</Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            <Link to="/spectate" className="hover:text-white transition-colors">Spectate</Link>
          </div>
          <p className="text-gray-600 text-sm">
            Built with React, Socket.IO, and Monaco Editor
          </p>
        </div>
      </footer>
    </div>
  )
}
