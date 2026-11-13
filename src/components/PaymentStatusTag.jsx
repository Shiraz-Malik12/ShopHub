import { Tag } from 'antd'

// Where an order's money stands (see paymentStatus in server/src/models/Order.js).
export const PAYMENT_STATUS = {
  cod: { color: 'default', label: 'Cash on delivery' },
  awaiting: { color: 'gold', label: 'Awaiting payment' },
  paid: { color: 'green', label: 'Paid by card' },
  unpaid: { color: 'default', label: 'Not paid' },
  refunded: { color: 'blue', label: 'Refunded' },
  refund_failed: { color: 'red', label: 'Refund failed' },
}

export default function PaymentStatusTag({ status }) {
  const tag = PAYMENT_STATUS[status] || PAYMENT_STATUS.cod
  return <Tag color={tag.color}>{tag.label}</Tag>
}
