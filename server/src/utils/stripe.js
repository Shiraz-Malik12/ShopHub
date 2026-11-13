import Stripe from 'stripe'

// Card payments go through Stripe. In development we use Stripe's TEST MODE:
// test keys (sk_test_...) and test cards (4242 4242 4242 4242), so no real
// money ever moves. Going live later = swapping in live keys, no code change.
//
// Without STRIPE_SECRET_KEY the shop simply works with cash on delivery
// only — the checkout page hides the card option (see GET /api/payments/config).

let client = null

export function isStripeConfigured(env = process.env) {
  return Boolean(env.STRIPE_SECRET_KEY)
}

// One shared Stripe client, created the first time it's needed.
export function getStripe() {
  if (client) return client
  if (!isStripeConfigured()) {
    const error = new Error('Card payments are not available right now. Please choose cash on delivery.')
    error.status = 503
    throw error
  }
  client = new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}

// For automated tests only: swap in a stand-in Stripe so tests can run
// without a Stripe account or internet. Never called by the app itself.
export function setStripeClientForTests(fake) {
  client = fake
}

// Stripe counts money in the smallest unit (cents): $12.34 → 1234.
export function toCents(amount) {
  return Math.round(amount * 100)
}

// Stripe refuses card payments below $0.50.
export const MIN_CARD_AMOUNT = 0.5
