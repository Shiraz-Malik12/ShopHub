import { useState } from 'react'
import { App as AntdApp, Button } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

// "Add to cart" used on product cards and the product detail page.
// Guests are sent to sign in first (the cart belongs to an account) and
// come back to the page they were on. Extra props go to the antd Button.
export default function AddToCartButton({ product, quantity = 1, ...buttonProps }) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const [adding, setAdding] = useState(false)

  const outOfStock = product.stock <= 0

  async function handleClick() {
    if (!user) {
      message.info('Please sign in to add items to your cart.')
      navigate('/login', { state: { from: location } })
      return
    }

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
