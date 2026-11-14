import { sendEmail } from './sendEmail.js'

// What each status update says. 'pending' has no update email — the
// "order confirmed" email covers it.
const STATUS_COPY = {
  processing: {
    subject: 'is being prepared',
    headline: "We're preparing your order",
    message: 'good news — we have started packing your order. We will let you know when it is on its way.',
  },
  shipped: {
    subject: 'is on its way',
    headline: 'Your order is on its way',
    message: 'your order has left our store and is with the courier. Please keep cash ready for delivery.',
  },
  delivered: {
    subject: 'has been delivered',
    headline: 'Your order has been delivered',
    message: 'your order has been delivered. Thank you for shopping with ShopHub!',
  },
  cancelled: {
    subject: 'was cancelled',
    headline: 'Your order was cancelled',
    message: 'your order has been cancelled. Nothing will be delivered and you will not be charged.',
  },
}

const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const formatPrice = (value) => priceFormatter.format(value)

// Names and addresses are typed by customers. Escaping them stops someone
// from putting HTML (fake links, hidden text...) inside an email we send.
export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function orderUrl(order) {
  return `${process.env.CLIENT_URL}/orders/${order._id}`
}

// Shared look for every order email.
function layout({ headline, intro, order, showItems }) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0; color:#111827;">${escapeHtml(item.name)} × ${item.quantity}</td>
          <td style="padding:8px 0; text-align:right; color:#111827;">${formatPrice(item.lineTotal)}</td>
        </tr>`,
    )
    .join('')
  const address = order.shippingAddress
  // Only for orders that used a coupon.
  const discountRow =
    order.discount > 0
      ? `
        <tr>
          <td style="padding:8px 0; color:#059669;">Discount (${escapeHtml(order.coupon?.code || 'coupon')})</td>
          <td style="padding:8px 0; text-align:right; color:#059669;">-${formatPrice(order.discount)}</td>
        </tr>`
      : ''

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color:#374151;">
      <h2 style="color:#4f46e5; margin-bottom: 4px;">ShopHub</h2>
      <h3 style="color:#111827; margin: 16px 0 4px;">${escapeHtml(headline)}</h3>
      <p>${escapeHtml(intro)}</p>
      <p style="margin: 16px 0 4px;"><strong>Order ${escapeHtml(order.orderNumber)}</strong></p>
      ${
        showItems
          ? `<table style="width:100%; border-collapse:collapse; border-top:1px solid #e5e7eb;">${rows}${discountRow}
               <tr><td style="padding:8px 0; border-top:1px solid #e5e7eb;"><strong>Total</strong></td>
                   <td style="padding:8px 0; border-top:1px solid #e5e7eb; text-align:right;"><strong>${formatPrice(order.total)}</strong></td></tr>
             </table>
             <p style="margin-top:16px;"><strong>Deliver to</strong><br/>
               ${escapeHtml(address.fullName)}<br/>${escapeHtml(address.addressLine)}<br/>${escapeHtml(address.city)}<br/>${escapeHtml(address.phone)}
             </p>
             <p>Payment: ${order.paymentMethod === 'card' ? 'paid by card' : 'cash on delivery'}</p>`
          : `<p>Total: <strong>${formatPrice(order.total)}</strong></p>`
      }
      <p style="margin-top:24px;">
        <a href="${orderUrl(order)}" style="background:#4f46e5; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none;">View your order</a>
      </p>
    </div>`
}

// Plain-text version, for email apps that don't show HTML.
function plainText({ headline, intro, order }) {
  const lines = order.items.map((item) => `- ${item.name} x ${item.quantity}: ${formatPrice(item.lineTotal)}`)
  if (order.discount > 0) lines.push(`Discount (${order.coupon?.code || 'coupon'}): -${formatPrice(order.discount)}`)
  const payment = `Payment: ${order.paymentMethod === 'card' ? 'paid by card' : 'cash on delivery'}`
  return [headline, '', intro, '', `Order ${order.orderNumber}`, ...lines, `Total: ${formatPrice(order.total)}`, payment, '', `View your order: ${orderUrl(order)}`].join('\n')
}

// The "order confirmed" email covers the whole checkout. With several
// shops it lists every item together and says how many parcels to expect.
export function checkoutForEmail(orders) {
  if (orders.length === 1) return orders[0]
  const sum = (field) => Math.round(orders.reduce((total, order) => total + order[field], 0) * 100) / 100
  return {
    _id: orders[0]._id,
    orderNumber: orders[0].checkoutId,
    items: orders.flatMap((order) => order.items),
    shippingAddress: orders[0].shippingAddress,
    coupon: orders.find((order) => order.coupon)?.coupon,
    discount: sum('discount'),
    total: sum('total'),
    parcelCount: orders.length,
    paymentMethod: orders[0].paymentMethod,
  }
}

// "Build" and "send" are separate so an email can be checked or previewed
// without sending it.

// Sent right after checkout.
export function buildOrderPlacedEmail(order, customer) {
  const content = {
    headline: 'Thank you! Your order is confirmed',
    // A checkout with several shops arrives as several parcels — say so,
    // so the customer isn't surprised when only one turns up first.
    intro:
      order.parcelCount > 1
        ? `Hi ${customer.name}, we have received your order. It comes from ${order.parcelCount} shops, so it will arrive in ${order.parcelCount} separate parcels.`
        : `Hi ${customer.name}, we have received your order and will start preparing it soon.`,
    order,
  }
  return {
    to: customer.email,
    subject: `Order ${order.orderNumber} confirmed`,
    text: plainText(content),
    html: layout({ ...content, showItems: true }),
  }
}

// Sent whenever the order moves on (processing / shipped / delivered / cancelled).
// The wording depends on the money, not just the status. Cash on delivery
// keeps STATUS_COPY as it is. A card order:
//   • on its way → it's already paid, so no "keep cash ready"
//   • cancelled after paying → it WAS charged, so say the refund is coming
//     (not "you will not be charged")
//   • cancelled before paying → nothing was charged, the default is right
function copyFor(order) {
  const copy = STATUS_COPY[order.status]
  if (!copy || order.paymentMethod !== 'card') return copy
  const amount = formatPrice(order.total)
  if (order.status === 'cancelled' && order.paymentStatus === 'refunded') {
    return {
      subject: 'was cancelled and refunded',
      headline: 'Your order was cancelled — refund on its way',
      message: `your order has been cancelled and your payment of ${amount} has been refunded to your card. It can take 5–10 business days to show on your statement.`,
    }
  }
  if (order.status === 'cancelled' && order.paymentStatus === 'refund_failed') {
    return {
      ...copy,
      message: `your order has been cancelled. Your payment of ${amount} will be refunded — our team is processing it and will contact you if anything is needed.`,
    }
  }
  return { ...copy, message: copy.message.replace(' Please keep cash ready for delivery.', '') }
}

export function buildOrderStatusEmail(order, customer) {
  const copy = copyFor(order)
  if (!copy) return null
  const content = { headline: copy.headline, intro: `Hi ${customer.name}, ${copy.message}`, order }
  return {
    to: customer.email,
    subject: `Your order ${order.orderNumber} ${copy.subject}`,
    text: plainText(content),
    html: layout({ ...content, showItems: false }),
  }
}

export function sendOrderPlacedEmail(order, customer) {
  return sendEmail(buildOrderPlacedEmail(order, customer))
}

export function sendOrderStatusEmail(order, customer) {
  const email = buildOrderStatusEmail(order, customer)
  return email ? sendEmail(email) : Promise.resolve()
}

// Emails are sent in the background: the customer doesn't wait for Gmail,
// and if sending fails (Gmail down, bad address) the order itself is still
// fine — the problem is only written to the server log.
export function sendInBackground(emailPromise) {
  emailPromise.catch((err) => console.error('[email] Could not send order email:', err.message))
}
