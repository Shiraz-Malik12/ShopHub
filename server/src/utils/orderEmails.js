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
function escapeHtml(value = '') {
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
             <p>Payment: cash on delivery</p>`
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
  return [headline, '', intro, '', `Order ${order.orderNumber}`, ...lines, `Total: ${formatPrice(order.total)}`, '', `View your order: ${orderUrl(order)}`].join('\n')
}

// "Build" and "send" are separate so an email can be checked or previewed
// without sending it.

// Sent right after checkout.
export function buildOrderPlacedEmail(order, customer) {
  const content = {
    headline: 'Thank you! Your order is confirmed',
    intro: `Hi ${customer.name}, we have received your order and will start preparing it soon.`,
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
export function buildOrderStatusEmail(order, customer) {
  const copy = STATUS_COPY[order.status]
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
