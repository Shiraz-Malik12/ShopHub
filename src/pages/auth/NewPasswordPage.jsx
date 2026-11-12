import { useEffect, useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

// Forgot password, page 3 of 3: choose the new password. Only reachable
// right after ResetCodePage, which passes the one-time resetToken in router
// state (memory only — never in the URL, so it can't leak via history or
// links). The token works once and expires after 10 minutes on the server.
export default function NewPasswordPage() {
  const { state } = useLocation()
  const email = state?.email
  const resetToken = state?.resetToken
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const { message } = AntdApp.useApp()
  const [loading, setLoading] = useState(false)

  // Opened directly (refresh, bookmark): no token, so start over.
  useEffect(() => {
    if (!email || !resetToken) navigate('/forgot-password', { replace: true })
  }, [email, resetToken, navigate])

  async function onFinish(values) {
    setLoading(true)
    try {
      await resetPassword({ email, resetToken, newPassword: values.newPassword })
      message.success('Password reset! Please sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not reset your password. Please try again.')
      // Expired or already used: the only way forward is a new code.
      if (err?.response?.status === 400) navigate('/forgot-password', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (!email || !resetToken) return null

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${email}. Use at least 8 characters.`}>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="newPassword"
          label="New password"
          hasFeedback
          rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 8, message: 'At least 8 characters' },
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" autoFocus />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm new password"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                return Promise.reject(new Error('Passwords do not match'))
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<LockOutlined />} className="mt-2">
          Save new password
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-subtle">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-link hover:text-highlight">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
