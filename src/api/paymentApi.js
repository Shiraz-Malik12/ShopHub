import api from './axiosInstance'

// Card payments (Stripe). The browser never decides that something is paid:
// it only asks the server, which asks Stripe.

// { cardEnabled, testMode } — is "Pay by card" offered at checkout?
export const fetchPaymentConfig = () => api.get('/payments/config')
// After returning from Stripe's page: how did the payment go?
export const fetchCheckoutPayment = (checkoutId) => api.get(`/payments/checkouts/${checkoutId}`)
// "Pay now": a fresh Stripe payment page for what's still unpaid → { paymentUrl }
export const payCheckout = (checkoutId) => api.post(`/payments/checkouts/${checkoutId}/pay`)
