import axios from 'axios'
import { getAccessToken, setAccessToken } from './tokenStore'

// baseURL '/api' works via the Vite dev proxy (see vite.config.js) during
// development, and can be overridden with VITE_API_URL once deployed.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // Lets the browser send/receive the httpOnly refresh-token cookie the
  // backend will set. Plain JS never touches that cookie directly.
  withCredentials: true,
})

// Attaches the short-lived access token to every request, if we have one.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// When an access token expires (401), silently exchange the httpOnly
// refresh cookie for a new one and retry the original request exactly
// once — the user never sees a forced logout every 15 minutes.
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthRoute = config?.url?.startsWith('/auth/')

    if (response?.status !== 401 || config._retried || isAuthRoute) {
      throw error
    }
    config._retried = true

    try {
      // Multiple requests can 401 at once — share one in-flight refresh
      // instead of firing a burst of them.
      refreshPromise ??= api.post('/auth/refresh').finally(() => {
        refreshPromise = null
      })
      const { data } = await refreshPromise
      setAccessToken(data.accessToken)
      config.headers.Authorization = `Bearer ${data.accessToken}`
      return api(config)
    } catch (refreshError) {
      setAccessToken(null)
      throw refreshError
    }
  },
)

export default api
