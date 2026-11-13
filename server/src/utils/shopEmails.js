import { sendEmail } from './sendEmail.js'
import { escapeHtml } from './orderEmails.js'

// What the owner is told after each admin decision.
const DECISION_COPY = {
  approved: {
    subject: 'Your ShopHub shop is approved',
    headline: 'Your shop is approved',
    message: 'good news — your shop has been approved. You are now a seller on ShopHub.',
  },
  rejected: {
    subject: 'Your ShopHub shop application needs changes',
    headline: 'Your application needs changes',
    message: 'we could not approve your shop yet. You can fix the details and send it again.',
  },
  suspended: {
    subject: 'Your ShopHub shop has been suspended',
    headline: 'Your shop is suspended',
    message: 'your shop has been suspended and cannot sell for now. Please contact us if you think this is a mistake.',
  },
}

// Emails the owner about the admin's decision on their shop.
export async function sendShopDecisionEmail(shop, owner) {
  const copy = DECISION_COPY[shop.status]
  if (!copy || !owner?.email) return

  const link = `${process.env.CLIENT_URL}/open-shop`
  const reasonText = shop.statusReason ? `\n\nReason: ${shop.statusReason}` : ''
  const reasonHtml = shop.statusReason
    ? `<p style="background:#f3f4f6; padding:12px; border-radius:8px;"><strong>Reason:</strong> ${escapeHtml(shop.statusReason)}</p>`
    : ''

  await sendEmail({
    to: owner.email,
    subject: copy.subject,
    text: `Hi ${owner.name}, ${copy.message}\n\nShop: ${shop.name}${reasonText}\n\nSee your shop: ${link}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color:#374151;">
        <h2 style="color:#4f46e5; margin-bottom: 4px;">ShopHub</h2>
        <h3 style="color:#111827; margin: 16px 0 4px;">${escapeHtml(copy.headline)}</h3>
        <p>Hi ${escapeHtml(owner.name)}, ${escapeHtml(copy.message)}</p>
        <p><strong>Shop:</strong> ${escapeHtml(shop.name)}</p>
        ${reasonHtml}
        <p style="margin-top:24px;">
          <a href="${link}" style="background:#4f46e5; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none;">See your shop</a>
        </p>
      </div>
    `,
  })
}
