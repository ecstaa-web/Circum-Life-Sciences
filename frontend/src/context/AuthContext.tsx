import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, type User } from '../lib/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('retropulse.user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const login = async (email: string, password: string) => {
    const u = await api.login(email, password)
    setUser(u)
    localStorage.setItem('retropulse.user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('retropulse.user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
