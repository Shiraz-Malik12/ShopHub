import { createContext, useContext, useEffect, useState } from 'react'
import * as wishlistApi from '../api/wishlistApi'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

// Holds the ids of the signed-in user's saved products in ONE place, so
// every heart on every page and the header count agree. Like the cart,
// each change goes to the server first and we keep the server's answer.
export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [productIds, setProductIds] = useState([])

  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      setProductIds([])
      return
    }

    let ignore = false
    wishlistApi
      .fetchWishlist()
      .then(({ data }) => {
        if (!ignore) setProductIds(data.productIds)
      })
      .catch(() => {
        if (!ignore) setProductIds([])
      })
    return () => {
      ignore = true
    }
  }, [userId])

  function isSaved(productId) {
    return productIds.includes(productId)
  }

  // Saves the product if it isn't saved yet, removes it if it is.
  // Returns true when the product is saved afterwards.
  async function toggle(productId) {
    const { data } = isSaved(productId)
      ? await wishlistApi.removeFromWishlist(productId)
      : await wishlistApi.addToWishlist(productId)
    setProductIds(data.productIds)
    return data.productIds.includes(productId)
  }

  const value = { productIds, count: productIds.length, isSaved, toggle }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist must be used inside a <WishlistProvider>')
  }
  return ctx
}
