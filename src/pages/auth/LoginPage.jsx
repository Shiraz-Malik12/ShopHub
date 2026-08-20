import { useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()

  // If ProtectedRoute redirected here, send the user back where they were
  // headed once they successfully log in. Otherwise default to /account.
  const from = location.state?.from?.pathname || '/account'

  async function onFinish(values) {
    setLoading(true)
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      if (err?.response?.status === 403) {
        // Backend's signal for "credentials are correct, but email isn't
        // verified yet" — send them to finish the OTP step instead of
        // showing a generic error.
        message.warning('Please verify your email first')
        navigate('/verify-otp', { state: { email: values.email } })
        return
      }
      message.error(err?.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to ShopHub">
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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

        {/* Custom row instead of Form.Item's `label` prop — antd sizes the
            label to its content even in vertical layout, so a flex row
            inside it has no room to spread; this div isn't constrained. */}
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-slate-300">
            Password
          </label>
          <Link to="/forgot-password" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
            Forgot password?
          </Link>
        </div>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password id="password" size="large" placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Sign in
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New to ShopHub?{' '}
        <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
