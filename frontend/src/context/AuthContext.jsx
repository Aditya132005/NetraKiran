import { createContext, useContext, useState, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nk_user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('nk_token', data.token)
    localStorage.setItem('nk_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (form) => {
    const { data } = await api.post('/auth/signup', form)
    localStorage.setItem('nk_token', data.token)
    localStorage.setItem('nk_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nk_token')
    localStorage.removeItem('nk_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      localStorage.setItem('nk_user', JSON.stringify(data))
      setUser(data)
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
