import { useState } from 'react'
import { App as AntdApp, Button } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { useCart } from '../context/CartContext'

// "Add to cart" used on product cards and the product detail page. Works
// for everyone: guests' items go into the browser cart (see CartContext)
// and they only sign in at checkout. Extra props go to the antd Button.
export default function AddToCartButton({ product, quantity = 1, ...buttonProps }) {
  const { addItem } = useCart()
  const { message } = AntdApp.useApp()
  const [adding, setAdding] = useState(false)

  const outOfStock = product.stock <= 0

  async function handleClick() {
    setAdding(true)
    try {
      await addItem(product._id, quantity)
      message.success(`${product.name} added to cart`)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not add to cart. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Button
      type="primary"
      // Picks the special "+1" click animation in theme/clickEffect.js.
      data-effect="add-to-cart"
      icon={<ShoppingCartOutlined />}
      loading={adding}
      disabled={outOfStock}
      onClick={handleClick}
      {...buttonProps}
    >
      {outOfStock ? 'Out of Stock' : 'Add to cart'}
    </Button>
  )
}
