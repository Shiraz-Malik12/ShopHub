import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/authApi'
import { setAccessToken } from '../api/tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Distinguishes "we haven't checked yet" from "checked, not logged in" so
  // ProtectedRoute doesn't flash-redirect to /login on every page refresh.
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // The access token lives in memory only (see tokenStore.js), so it's
    // always gone after a hard reload — there's nothing to read back out
    // of storage. Instead, unconditionally try to trade the httpOnly
    // refresh cookie for a new one; if there's no valid cookie this just
    // 401s and we fall through to logged-out, same as before.
    async function restoreSession() {
      try {
        const { data } = await authApi.refreshSession()
        setAccessToken(data.accessToken)
        const me = await authApi.fetchCurrentUser()
        setUser(me.data.user)
      } catch {
        setAccessToken(null)
      } finally {
        setInitializing(false)
      }
    }
    restoreSession()
  }, [])

  function persistSession(token, userData) {
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
      setAccessToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
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
