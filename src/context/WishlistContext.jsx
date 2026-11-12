import { createContext, useContext, useEffect, useState } from 'react'
import * as wishlistApi from '../api/wishlistApi'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

const GUEST_WISHLIST_KEY = 'shophub-guest-wishlist'
const MAX_WISHLIST_ITEMS = 100 // same limit as server/src/models/Wishlist.js

// ---- The guest wishlist in the browser: a list of product ids ----
function readGuestIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY))
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function saveGuestIds(ids) {
  try {
    if (ids.length) localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids))
    else localStorage.removeItem(GUEST_WISHLIST_KEY)
  } catch {
    // Storage blocked (private window): the wishlist still works until reload.
  }
}

// Holds the ids of the saved products in ONE place, so every heart on every
// page and the header count agree. Two modes, like the cart:
//   • signed in — each change goes to the server; we keep the server's answer.
//   • guest     — the ids live in localStorage. Signing in moves them into
//     the account wishlist (POST /wishlist/merge).
export function WishlistProvider({ children }) {
  const { user, initializing } = useAuth()
  const [productIds, setProductIds] = useState([])

  // Who the wishlist belongs to: a user id, 'guest', or null while we
  // don't know yet (still checking the session).
  const owner = initializing ? null : user?.id || 'guest'
  const isGuest = owner === 'guest'

  useEffect(() => {
    if (owner === null) return undefined
    if (owner === 'guest') {
      setProductIds(readGuestIds())
      return undefined
    }

    // Signed in: move any guest hearts over first, then use the account list.
    let ignore = false
    const guestIds = readGuestIds()
    const request = guestIds.length
      ? wishlistApi
          .mergeWishlist(guestIds)
          .then((response) => {
            saveGuestIds([])
            return response
          })
          .catch(() => wishlistApi.fetchWishlist())
      : wishlistApi.fetchWishlist()

    request
      .then(({ data }) => {
        if (!ignore) setProductIds(data.productIds)
      })
      .catch(() => {
        if (!ignore) setProductIds([])
      })
    return () => {
      ignore = true
    }
  }, [owner])

  function isSaved(productId) {
    return productIds.includes(productId)
  }

  // Saves the product if it isn't saved yet, removes it if it is.
  // Returns true when the product is saved afterwards.
  async function toggle(productId) {
    if (isGuest) {
      const ids = readGuestIds()
      let next
      if (ids.includes(productId)) {
        next = ids.filter((id) => id !== productId)
      } else {
        if (ids.length >= MAX_WISHLIST_ITEMS) {
          const error = new Error('full')
          error.response = { data: { message: `Your wishlist is full (${MAX_WISHLIST_ITEMS} products). Remove some first.` } }
          throw error
        }
        next = [...ids, productId]
      }
      saveGuestIds(next)
      setProductIds(next)
      return next.includes(productId)
    }

    const { data } = isSaved(productId)
      ? await wishlistApi.removeFromWishlist(productId)
      : await wishlistApi.addToWishlist(productId)
    setProductIds(data.productIds)
    return data.productIds.includes(productId)
  }

  // The saved products themselves (for the wishlist page), from the server
  // for both modes — a guest's ids go through the public preview endpoint.
  async function loadProducts() {
    const { data } = isGuest ? await wishlistApi.previewWishlist(readGuestIds()) : await wishlistApi.fetchWishlist()
    return data.products
  }

  const value = { productIds, count: productIds.length, owner, isGuest, isSaved, toggle, loadProducts }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist must be used inside a <WishlistProvider>')
  }
  return ctx
}
