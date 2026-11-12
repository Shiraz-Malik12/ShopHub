import { useState } from 'react'
import { App as AntdApp, Button } from 'antd'
import { HeartFilled, HeartOutlined } from '@ant-design/icons'
import { useWishlist } from '../context/WishlistContext'

// Heart button that saves a product to the wishlist (or removes it). Works
// for guests too — their hearts are kept in the browser (WishlistContext).
// `round`: the icon-only circle used next to "Add to cart" on product cards.
export default function WishlistButton({ product, round = false, ...buttonProps }) {
  const { isSaved, toggle } = useWishlist()
  const { message } = AntdApp.useApp()
  const [saving, setSaving] = useState(false)

  const saved = isSaved(product._id)
  const label = saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`

  async function handleClick() {
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

  const icon = saved ? <HeartFilled className="text-coral" /> : <HeartOutlined />

  if (round) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={saved}
        title={label}
        disabled={saving}
        onClick={handleClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lg text-subtle transition hover:border-coral/40 hover:text-highlight disabled:opacity-60"
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
