import { useState } from 'react'
import { Button, Input } from 'antd'
import { CloseOutlined, TagOutlined } from '@ant-design/icons'
import * as couponApi from '../api/couponApi'
import { formatPrice } from '../utils/formatPrice'

// "Have a coupon?" box in the checkout summary. It asks the server to check
// the code and shows the answer — it never calculates a discount itself.
// `applied` is the server's answer ({ coupon, discount, total }) or null.
export default function CouponBox({ applied, onApplied, onRemoved }) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  async function handleApply() {
    if (!code.trim()) return
    setChecking(true)
    setError(null)
    try {
      const { data } = await couponApi.applyCoupon(code)
      onApplied(data)
      setCode('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not check this coupon. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-emerald-300">
          <TagOutlined />
          <span className="truncate">
            <strong>{applied.coupon.code}</strong> · {applied.coupon.description} (−{formatPrice(applied.discount)})
          </span>
        </span>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onRemoved} aria-label="Remove coupon" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          aria-label="Coupon code"
          placeholder="Coupon code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onPressEnter={handleApply}
          maxLength={30}
          status={error ? 'error' : undefined}
        />
        <Button onClick={handleApply} loading={checking} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  )
}
