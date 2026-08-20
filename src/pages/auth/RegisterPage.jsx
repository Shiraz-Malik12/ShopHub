import { useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
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
      navigate('/verify-otp', { state: { email: data?.email ?? values.email } })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start shopping with ShopHub">
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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

        <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-2">
          Create account
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
