// One place for how prices look across the storefront: 1200 → "$1,200.00".
const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatPrice(price) {
  return priceFormatter.format(price)
}
