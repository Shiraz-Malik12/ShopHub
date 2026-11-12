import { useEffect, useState } from 'react'
import { Form, Input, Button, App as AntdApp } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const RESEND_COOLDOWN_SECONDS = 60

// Forgot password, page 2 of 3: enter the 6-digit code from the email.
// The SERVER checks it (not the browser) and answers with a one-time
// resetToken, which is handed to the next page in router state — so the
// "new password" page can't be opened without a correct code.
export default function ResetCodePage() {
  const { state } = useLocation()
  const email = state?.email
  const navigate = useNavigate()
  const { verifyResetCode, forgotPassword } = useAuth()
  const { message } = AntdApp.useApp()

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  // No email in route state means someone landed here directly instead of
  // going through ForgotPasswordPage first.
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const id = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function onFinish(values) {
    setLoading(true)
    try {
      const { resetToken } = await verifyResetCode({ email, code: values.code })
      message.success('Code verified')
      // replace: the Back button shouldn't return to an already-used code.
      navigate('/reset-password/new', { replace: true, state: { email, resetToken } })
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
    <AuthLayout title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email}`}>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="code"
          label="Reset code"
          rules={[
            { required: true, message: 'Please enter the code' },
            { len: 6, message: 'Enter the 6-digit code' },
          ]}
        >
          <Input.OTP length={6} size="large" className="w-full [&>*]:flex-1" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          icon={<SafetyCertificateOutlined />}
          className="mt-2"
        >
          Verify code
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-subtle">
        Didn&apos;t get the code?{' '}
        {cooldown > 0 ? (
          <span className="text-faint">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-link hover:text-highlight disabled:opacity-50"
          >
            Resend code
          </button>
        )}
      </p>

      <p className="mt-2 text-center text-sm text-subtle">
        Wrong email?{' '}
        <Link to="/forgot-password" className="font-medium text-link hover:text-highlight">
          Start over
        </Link>
      </p>
    </AuthLayout>
  )
}
