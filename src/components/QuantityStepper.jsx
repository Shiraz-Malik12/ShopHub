import { Button } from 'antd'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'

// "−  2  +" quantity control. It doesn't keep any state of its own: the
// parent passes the current `value` and decides what to do in `onChange`.
export default function QuantityStepper({ value, max, onChange, min = 1, disabled = false }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-700">
      <Button
        type="text"
        icon={<MinusOutlined />}
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      />
      <span className="w-10 text-center text-sm font-semibold text-slate-100" aria-live="polite">
        {value}
      </span>
      <Button
        type="text"
        icon={<PlusOutlined />}
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      />
    </div>
  )
}
