import { useEffect, useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const RESEND_COOLDOWN_SECONDS = 60

export default function ResetPasswordPage() {
  const { state } = useLocation()
  const email = state?.email
  const navigate = useNavigate()
  const { resetPassword, forgotPassword } = useAuth()
  const { message } = AntdApp.useApp()

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  // No email in route state means someone landed here directly instead of
  // going through ForgotPasswordPage first.
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function onFinish(values) {
    setLoading(true)
    try {
      await resetPassword({ email, code: values.code, newPassword: values.newPassword })
      message.success('Password reset! Please sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await forgotPassword({ email })
      message.success('A new code has been sent')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Could not resend the code')
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <AuthLayout title="Reset your password" subtitle={`Enter the code sent to ${email} and a new password`}>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="code"
          label="6-digit code"
          rules={[
            { required: true, message: 'Please enter the code' },
            { len: 6, message: 'Enter the 6-digit code' },
          ]}
        >
          <Input.OTP length={6} size="large" className="w-full [&>*]:flex-1" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New password"
          hasFeedback
          rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 8, message: 'At least 8 characters' },
          ]}
        >
          <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" />
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

        <Button type="primary" htmlType="submit" size="large" block loading={loading} className="mt-2">
          Reset password
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Didn&apos;t get the code?{' '}
        {cooldown > 0 ? (
          <span className="text-slate-500">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
          >
            Resend code
          </button>
        )}
      </p>

      <p className="mt-2 text-center text-sm text-slate-400">
        Wrong email?{' '}
        <Link to="/forgot-password" className="font-medium text-indigo-400 hover:text-indigo-300">
          Start over
        </Link>
      </p>
    </AuthLayout>
  )
}
