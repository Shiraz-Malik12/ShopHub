import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))
  // Distinguishes "we haven't checked yet" from "checked, not logged in" so
  // ProtectedRoute doesn't flash-redirect to /login on every page refresh.
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!accessToken) {
        setInitializing(false)
        return
      }
      try {
        const { data } = await authApi.fetchCurrentUser()
        setUser(data.user)
      } catch {
        // Token is missing/expired/invalid — clear it and treat as logged out.
        localStorage.removeItem('accessToken')
        setAccessToken(null)
      } finally {
        setInitializing(false)
      }
    }
    restoreSession()
    // Intentionally only on mount: this is a one-time "who am I" check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persistSession(token, userData) {
    localStorage.setItem('accessToken', token)
    setAccessToken(token)
    setUser(userData)
  }

  async function register(payload) {
    const { data } = await authApi.registerUser(payload)
    // No session yet on purpose — the account isn't usable until the OTP
    // is verified, so we deliberately don't log the user in here.
    return data
  }

  async function verifyOtp(payload) {
    const { data } = await authApi.verifyOtp(payload)
    persistSession(data.accessToken, data.user)
    return data
  }

  async function resendOtp(payload) {
    const { data } = await authApi.resendOtp(payload)
    return data
  }

  async function login(payload) {
    const { data } = await authApi.loginUser(payload)
    persistSession(data.accessToken, data.user)
    return data
  }

  async function forgotPassword(payload) {
    const { data } = await authApi.forgotPassword(payload)
    return data
  }

  async function resetPassword(payload) {
    const { data } = await authApi.resetPassword(payload)
    return data
  }

  async function logout() {
    try {
      await authApi.logoutUser()
    } finally {
      // Clear local state even if the network call fails — the user
      // clicked "sign out" and expects the UI to reflect that immediately.
      localStorage.removeItem('accessToken')
      setAccessToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
    accessToken,
    initializing,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return ctx
}
