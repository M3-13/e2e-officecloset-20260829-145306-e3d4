import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserOut } from '../api'

export interface AuthContextValue {
  user: UserOut | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<UserOut | null>(null)
  const [loading] = useState<boolean>(false)

  const login = async (_email: string, _password: string): Promise<void> => {
    throw new Error('not implemented')
  }

  const register = async (_email: string, _password: string): Promise<void> => {
    throw new Error('not implemented')
  }

  const logout = async (): Promise<void> => {
    throw new Error('not implemented')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
