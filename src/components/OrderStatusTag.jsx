import { Tag } from 'antd'
import { ORDER_STATUS } from '../utils/orderStatus'

// Coloured label for an order's status — the same look on the customer's
// order pages and in the admin table.
export default function OrderStatusTag({ status }) {
  const { label, color } = ORDER_STATUS[status] || { label: status, color: 'default' }
  return <Tag color={color}>{label}</Tag>
}
