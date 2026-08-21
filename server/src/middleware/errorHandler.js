export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err)
  const status = err.status || 500
  // Deliberate errors (validation, auth checks, etc.) always set err.status
  // and a safe, user-facing message — those pass through unchanged. An
  // unset status means something unexpected blew up (a DB error, a bug),
  // and its message may contain internals we never want to hand a client
  // (query fragments, stack-ish driver text). In production, show a
  // generic message for those instead; the real one is still in the logs.
  const exposeMessage = err.status || process.env.NODE_ENV !== 'production'
  const message = exposeMessage ? err.message || 'Something went wrong' : 'Something went wrong'
  res.status(status).json({ message })
}
