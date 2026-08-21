// The access token lives here — a plain module-level variable — and
// nowhere else. Deliberately not localStorage/sessionStorage: those are
// readable by any script on the page, so a single XSS bug anywhere in the
// app (a review field, a search box) would be enough to steal it. Keeping
// it in memory means it's gone on a hard reload; AuthContext recovers it
// by exchanging the httpOnly refresh cookie for a fresh one on mount,
// exactly like the axios interceptor does on a 401.
let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token
}
