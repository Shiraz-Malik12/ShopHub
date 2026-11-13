import { Tag } from 'antd'

const STATUS_TAGS = {
  pending: { color: 'gold', label: 'Pending review' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  suspended: { color: 'volcano', label: 'Suspended' },
}

// Coloured label for a shop's status. Shared by the owner's "Open a shop"
// page and the admin's Shops page so both always say the same thing.
export default function ShopStatusTag({ status }) {
  const tag = STATUS_TAGS[status] || { color: 'default', label: status }
  return <Tag color={tag.color}>{tag.label}</Tag>
}
