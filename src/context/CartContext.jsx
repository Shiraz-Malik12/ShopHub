import { createContext, useContext, useEffect, useState } from 'react'
import * as cartApi from '../api/cartApi'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0 }

// Holds the signed-in user's cart in ONE place, so the header badge, the
// product pages and the cart page all show the same data. Every action
// calls the API, then replaces the cart with the server's answer — the
// server is always the source of truth for quantities and totals.
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(false)

  const userId = user?.id

  useEffect(() => {
    // Signed out (or just logged out): there is no cart to show.
    if (!userId) {
      setCart(EMPTY_CART)
      return
    }

    // `ignore` stops an old, slow response from overwriting newer state
    // (e.g. the user logged out while the request was still in flight).
    let ignore = false
    setLoading(true)
    cartApi
      .fetchCart()
      .then(({ data }) => {
        if (!ignore) setCart(data.cart)
      })
      .catch(() => {
        if (!ignore) setCart(EMPTY_CART)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [userId])

  async function addItem(productId, quantity = 1) {
    const { data } = await cartApi.addCartItem(productId, quantity)
    setCart(data.cart)
  }

  async function updateQuantity(productId, quantity) {
    const { data } = await cartApi.updateCartItem(productId, quantity)
    setCart(data.cart)
  }

  async function removeItem(productId) {
    const { data } = await cartApi.removeCartItem(productId)
    setCart(data.cart)
  }

  async function clear() {
    const { data } = await cartApi.clearCart()
    setCart(data.cart)
  }

  const value = { cart, loading, addItem, updateQuantity, removeItem, clear }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside a <CartProvider>')
  }
  return ctx
}
