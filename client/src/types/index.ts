export interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  rating: {
    elo: number
    wins: number
    losses: number
    draws: number
  }
  stats: {
    totalMatches: number
    avgSolveTime: number
    fastestSolve: number
    problemsSolved: number
    winStreak: number
    bestWinStreak: number
  }
  preferredLanguage: string
  avatar: string
  createdAt: string
  lastActive: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  error?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
