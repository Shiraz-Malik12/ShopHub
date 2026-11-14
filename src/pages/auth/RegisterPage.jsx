import { useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { CheckCircleFilled, ShopOutlined, ShoppingOutlined, UserAddOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const GOALS = [
  { value: 'shop', icon: <ShoppingOutlined />, title: 'Just shop', text: 'Browse and buy' },
  { value: 'sell', icon: <ShopOutlined />, title: 'Shop and sell', text: 'Open a shop too' },
]

// "I want to" choice as two option cards. Each card is a real radio button
// (hidden, with the card as its label), so the keyboard — Tab, then the
// arrow keys — and screen readers work like with any radio group.
function GoalPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="I want to" className="grid grid-cols-2 gap-3">
      {GOALS.map((goal) => {
        const selected = value === goal.value
        return (
          <label
            key={goal.value}
            // Phones: icon above the text (the cards are narrow). Wider: side by side.
            className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 transition has-focus-visible:ring-2 has-focus-visible:ring-accent/40 sm:flex-row sm:gap-3 ${
              selected ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <input
              type="radio"
              name="goal"
              value={goal.value}
              checked={selected}
              onChange={() => onChange(goal.value)}
              className="sr-only"
            />
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
                selected ? 'bg-accent text-white' : 'bg-muted text-subtle'
              }`}
              aria-hidden="true"
            >
              {goal.icon}
            </span>
            <span className="min-w-0 pr-4">
              <span className="block text-sm font-semibold text-ink">{goal.title}</span>
              <span className="block text-xs leading-snug text-subtle">{goal.text}</span>
            </span>
            {selected && <CheckCircleFilled className="absolute right-2.5 top-2.5 text-accent" aria-hidden="true" />}
          </label>
        )
      })}
    </div>
  )
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  // 'shop' or 'sell'. Only decides where to go after sign-up; it isn't sent
  // to the server (a seller is a normal account whose shop got approved).
  const [goal, setGoal] = useState('shop')
  const { register } = useAuth()
  const navigate = useNavigate()
  // Where the visitor was going before signing up (e.g. /checkout) — handed
  // on to the verify page, which sends them there once the email is verified.
  const { state } = useLocation()
  // useApp() (not the static `message` import) so toasts correctly pick up
  // the ConfigProvider theme — antd v5's documented pattern.
  const { message } = AntdApp.useApp()

  async function onFinish(values) {
    setLoading(true)
    try {
      const data = await register({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      message.success('OTP sent to your email')
      // "Shop and sell": once the email is verified, go straight to the
      // shop application. Everyone gets the same kind of account either way.
      const from = goal === 'sell' ? { pathname: '/open-shop' } : state?.from
      navigate('/verify-otp', { state: { email: data?.email ?? values.email, from } })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={goal === 'sell' ? 'Shop on ShopHub — and sell your own products' : 'Start shopping with ShopHub'}
    >
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="I want to"
          extra={goal === 'sell' ? "After verifying your email, you'll add your shop details. ShopHub reviews every new shop." : null}
        >
          <GoalPicker value={goal} onChange={setGoal} />
        </Form.Item>

        <Form.Item
          name="name"
          label="Full name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input size="large" placeholder="Jane Doe" autoComplete="name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Enter a valid email address' },
          ]}
        >
          <Input size="large" placeholder="you@example.com" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          hasFeedback
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'At least 8 characters' },
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('Passwords do not match'))
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<UserAddOutlined />} className="mt-2">
          Create account
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-subtle">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-link hover:text-highlight">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
