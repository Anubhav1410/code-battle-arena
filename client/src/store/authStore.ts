import { create } from 'zustand'
import api from '../services/api'
import type { User, AuthResponse } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      if (data.success && data.data) {
        localStorage.setItem('token', data.data.token)
        set({
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch (error: unknown) {
      set({ isLoading: false })
      const err = error as { response?: { data?: { error?: string } } }
      throw new Error(err.response?.data?.error || 'Login failed')
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        username,
        email,
        password,
      })
      if (data.success && data.data) {
        localStorage.setItem('token', data.data.token)
        set({
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch (error: unknown) {
      set({ isLoading: false })
      const err = error as { response?: { data?: { error?: string } } }
      throw new Error(err.response?.data?.error || 'Registration failed')
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthenticated: false, isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me')
      if (data.success) {
        set({ user: data.data.user, isAuthenticated: true, isLoading: false })
      }
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
