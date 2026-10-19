// Startup safety check: reads the settings from server/.env BEFORE the
// server starts and refuses to start if something important is missing or
// unsafe — a clear message now beats a confusing crash (or a silent
// security hole) later, while customers are using the shop.

const MIN_SECRET_LENGTH = 32

// Needed in every environment.
const REQUIRED = ['MONGODB_URI', 'CLIENT_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']

// Only optional while developing: without them the dev fallbacks kick in
// (images saved to server/uploads, emails printed to the console). A real
// shop needs both — customers couldn't verify their email otherwise.
const REQUIRED_IN_PRODUCTION = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
]

// Returns { problems, warnings } — problems stop the server, warnings don't.
export function checkEnv(env = process.env) {
  const isProduction = env.NODE_ENV === 'production'
  const problems = []
  const warnings = []

  for (const name of REQUIRED) {
    if (!env[name]) problems.push(`${name} is missing.`)
  }

  for (const name of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
    const secret = env[name]
    if (!secret) continue
    if (secret.startsWith('replace-with')) {
      problems.push(`${name} is still the example value from .env.example — generate a real one.`)
    } else if (secret.length < MIN_SECRET_LENGTH) {
      const message = `${name} is only ${secret.length} characters; use at least ${MIN_SECRET_LENGTH}.`
      if (isProduction) problems.push(message)
      else warnings.push(message)
    }
  }
  if (env.ACCESS_TOKEN_SECRET && env.ACCESS_TOKEN_SECRET === env.REFRESH_TOKEN_SECRET) {
    problems.push('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different.')
  }

  if (isProduction) {
    for (const name of REQUIRED_IN_PRODUCTION) {
      if (!env[name]) problems.push(`${name} is missing (required when NODE_ENV=production).`)
    }
    if (env.CLIENT_URL && !env.CLIENT_URL.startsWith('https://')) {
      warnings.push('CLIENT_URL does not start with https:// — a live shop should always use HTTPS.')
    }
  }

  return { problems, warnings }
}

export function validateEnvOrExit() {
  const { problems, warnings } = checkEnv()
  for (const warning of warnings) console.warn(`[config] Warning: ${warning}`)
  if (problems.length > 0) {
    console.error('\n[config] The server cannot start. Fix these in server/.env:')
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Generate a secret with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n')
    process.exit(1)
  }
}
