import { createContext, useContext, useEffect, useState } from 'react'
import * as cartApi from '../api/cartApi'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0 }
const GUEST_CART_KEY = 'shophub-guest-cart'
const MAX_ITEM_QUANTITY = 99 // same limit as server/src/models/Cart.js

// ---- The guest cart in the browser: just [{ productId, quantity }] ----
// No prices are ever stored here — the server prices the list (preview),
// so a guest can't change what they pay by editing localStorage.
function readGuestItems() {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY))
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

function saveGuestItems(items) {
  try {
    if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    else localStorage.removeItem(GUEST_CART_KEY)
  } catch {
    // Storage blocked (private window): the cart still works until reload.
  }
}

// Errors shaped like an axios error, so pages show them the same way
// (err.response.data.message) whether they came from the server or here.
function cartError(message) {
  const error = new Error(message)
  error.response = { data: { message } }
  return error
}

// Holds the cart in ONE place, so the header badge, the product pages and
// the cart page all show the same data. Two modes:
//   • signed in — every action calls the cart API; the server's answer
//     replaces the cart (the server is the source of truth).
//   • guest     — the list lives in localStorage; after every change the
//     server prices it (POST /cart/preview). Signing in moves it into the
//     account cart (POST /cart/merge), and checkout requires signing in.
export function CartProvider({ children }) {
  const { user, initializing } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  // Whose cart has finished loading ('guest' or a user id). Comparing it
  // with the current visitor makes `loading` true from the very first render
  // after sign-in — so a page like Checkout never mistakes "not loaded yet"
  // for "empty cart".
  const [loadedFor, setLoadedFor] = useState(null)

  const owner = initializing ? null : user?.id || 'guest'
  const isGuest = owner === 'guest'
  const loading = owner === null || loadedFor !== owner

  useEffect(() => {
    if (owner === null) return undefined // still finding out who is here

    // `ignore` stops an old, slow response from overwriting newer state
    // (e.g. the user logged out while the request was still in flight).
    let ignore = false
    let request
    if (owner === 'guest') {
      const items = readGuestItems()
      request = items.length ? cartApi.previewCart(items) : Promise.resolve({ data: { cart: EMPTY_CART } })
    } else {
      // Just signed in with things in the guest cart: move them over first.
      const guestItems = readGuestItems()
      // If the merge fails, the guest items stay saved and we still show
      // the account cart.
      request = guestItems.length
        ? cartApi
            .mergeCart(guestItems)
            .then((response) => {
              saveGuestItems([])
              return response
            })
            .catch(() => cartApi.fetchCart())
        : cartApi.fetchCart()
    }

    request
      .then(({ data }) => {
        if (!ignore) setCart(data.cart)
      })
      .catch(() => {
        if (!ignore) setCart(EMPTY_CART)
      })
      .finally(() => {
        if (!ignore) setLoadedFor(owner)
      })
    return () => {
      ignore = true
    }
  }, [owner])

  // Guest helper: save the new list, then let the server price it.
  async function applyGuestItems(items) {
    const { data } = items.length ? await cartApi.previewCart(items) : { data: { cart: EMPTY_CART } }
    saveGuestItems(items)
    setCart(data.cart)
    return data.cart
  }

  // Guest helper: the product's line in a priced cart (for stock checks).
  function lineFor(pricedCart, productId) {
    return pricedCart.items.find((item) => item.product._id === productId)
  }

  // Reloads the cart — used after something outside the cart changed it
  // (e.g. placing an order empties it).
  async function refresh() {
    if (isGuest) {
      await applyGuestItems(readGuestItems())
      return
    }
    const { data } = await cartApi.fetchCart()
    setCart(data.cart)
  }

  async function addItem(productId, quantity = 1) {
    if (!isGuest) {
      const { data } = await cartApi.addCartItem(productId, quantity)
      setCart(data.cart)
      return
    }

    const items = readGuestItems()
    const existing = items.find((item) => item.productId === productId)
    const newQuantity = Math.min((existing?.quantity || 0) + quantity, MAX_ITEM_QUANTITY)
    const next = existing
      ? items.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item))
      : [...items, { productId, quantity: newQuantity }]

    // Same rules as the signed-in cart: check the price list the server
    // sends back, and undo the change if there isn't enough stock.
    const { data } = await cartApi.previewCart(next)
    const line = lineFor(data.cart, productId)
    if (!line || !line.available) throw cartError('This product is no longer available.')
    if (newQuantity > line.product.stock) {
      throw cartError(
        line.product.stock === 0
          ? `${line.product.name} is out of stock.`
          : `Only ${line.product.stock} of ${line.product.name} left in stock.`,
      )
    }
    saveGuestItems(next)
    setCart(data.cart)
  }

  async function updateQuantity(productId, quantity) {
    if (!isGuest) {
      const { data } = await cartApi.updateCartItem(productId, quantity)
      setCart(data.cart)
      return
    }
    const next = readGuestItems().map((item) => (item.productId === productId ? { ...item, quantity } : item))
    const { data } = await cartApi.previewCart(next)
    const line = lineFor(data.cart, productId)
    if (line && quantity > line.product.stock) {
      throw cartError(`Only ${line.product.stock} of ${line.product.name} left in stock.`)
    }
    saveGuestItems(next)
    setCart(data.cart)
  }

  async function removeItem(productId) {
    if (!isGuest) {
      const { data } = await cartApi.removeCartItem(productId)
      setCart(data.cart)
      return
    }
    await applyGuestItems(readGuestItems().filter((item) => item.productId !== productId))
  }

  async function clear() {
    if (!isGuest) {
      const { data } = await cartApi.clearCart()
      setCart(data.cart)
      return
    }
    await applyGuestItems([])
  }

  const value = { cart, loading, isGuest, refresh, addItem, updateQuantity, removeItem, clear }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside a <CartProvider>')
  }
  return ctx
}
