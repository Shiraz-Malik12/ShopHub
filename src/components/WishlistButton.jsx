import { useState } from 'react'
import { App as AntdApp, Button } from 'antd'
import { HeartFilled, HeartOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'

// Heart button that saves a product to the wishlist (or removes it).
// Guests are sent to sign in first, like "Add to cart".
// `overlay`: the small round version that sits on a product photo.
export default function WishlistButton({ product, overlay = false, ...buttonProps }) {
  const { user } = useAuth()
  const { isSaved, toggle } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const [saving, setSaving] = useState(false)

  const saved = isSaved(product._id)
  const label = saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`

  async function handleClick() {
    if (!user) {
      message.info('Please sign in to save products to your wishlist.')
      navigate('/login', { state: { from: location } })
      return
    }

    setSaving(true)
    try {
      const nowSaved = await toggle(product._id)
      message.success(nowSaved ? 'Saved to your wishlist' : 'Removed from your wishlist')
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not update your wishlist. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const icon = saved ? <HeartFilled className="text-rose-500" /> : <HeartOutlined />

  if (overlay) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={saved}
        title={label}
        disabled={saving}
        onClick={handleClick}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-lg text-slate-200 backdrop-blur transition hover:scale-110 hover:text-white disabled:opacity-60"
      >
        {icon}
      </button>
    )
  }

  return (
    <Button icon={icon} loading={saving} onClick={handleClick} aria-pressed={saved} aria-label={label} {...buttonProps}>
      {saved ? 'Saved' : 'Save'}
    </Button>
  )
}
