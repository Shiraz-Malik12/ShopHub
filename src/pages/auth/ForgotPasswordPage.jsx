import { useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()

  async function onFinish(values) {
    setLoading(true)
    try {
      await forgotPassword({ email: values.email })
      // Backend always responds the same way whether or not the email is
      // registered (prevents account enumeration) — so we always move
      // forward to the code-entry screen too, regardless of the outcome.
      message.success('If an account exists for that email, a reset code has been sent.')
      navigate('/reset-password', { state: { email: values.email } })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a reset code">
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

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Send reset code
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
