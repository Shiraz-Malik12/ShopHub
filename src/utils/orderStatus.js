// How each order status is shown. The status names and the allowed moves
// must match server/src/models/Order.js (ORDER_STATUSES / NEXT_STATUSES).
export const ORDER_STATUS = {
  pending: { label: 'Pending', color: 'gold' },
  processing: { label: 'Processing', color: 'blue' },
  shipped: { label: 'Shipped', color: 'purple' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
}

// The normal journey of an order, in order — used for the progress steps.
export const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered']

// What an admin may do next from each status. The server enforces this too;
// here it only decides which buttons to show.
export const NEXT_STATUSES = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}
