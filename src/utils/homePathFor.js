// Where a signed-in user lands by default (after login, email verification,
// or visiting a guest-only page like /login while already signed in).
// Customers go straight to shopping; admins go to store management.
export function homePathFor(user) {
  return user?.role === 'admin' ? '/admin/orders' : '/products'
}
