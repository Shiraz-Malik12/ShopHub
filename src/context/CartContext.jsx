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
  // Whose cart has finished loading. Comparing it with the current user
  // makes `loading` true from the very first render after sign-in — so a
  // page like Checkout never mistakes "not loaded yet" for "empty cart".
  const [loadedUserId, setLoadedUserId] = useState(null)

  const userId = user?.id
  const loading = Boolean(userId) && loadedUserId !== userId

  useEffect(() => {
    // Signed out (or just logged out): there is no cart to show.
    if (!userId) {
      setCart(EMPTY_CART)
      setLoadedUserId(null)
      return
    }

    // `ignore` stops an old, slow response from overwriting newer state
    // (e.g. the user logged out while the request was still in flight).
    let ignore = false
    cartApi
      .fetchCart()
      .then(({ data }) => {
        if (!ignore) setCart(data.cart)
      })
      .catch(() => {
        if (!ignore) setCart(EMPTY_CART)
      })
      .finally(() => {
        if (!ignore) setLoadedUserId(userId)
      })
    return () => {
      ignore = true
    }
  }, [userId])

  // Reloads the cart from the server — used after something outside the
  // cart changed it (e.g. placing an order empties it).
  async function refresh() {
    const { data } = await cartApi.fetchCart()
    setCart(data.cart)
  }

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

  const value = { cart, loading, refresh, addItem, updateQuantity, removeItem, clear }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside a <CartProvider>')
  }
  return ctx
}
