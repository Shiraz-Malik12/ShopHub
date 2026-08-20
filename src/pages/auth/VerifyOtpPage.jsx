import { useEffect, useState } from 'react'
import { Button, Input, App as AntdApp } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyOtpPage() {
  const { state } = useLocation()
  const email = state?.email
  const navigate = useNavigate()
  const { verifyOtp, resendOtp } = useAuth()
  const { message } = AntdApp.useApp()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  // No email in route state means someone landed here directly (refresh,
  // bookmark, back button) without going through Register first.
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function handleVerify() {
    if (code.length !== 6) {
      message.warning('Enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      await verifyOtp({ email, code })
      message.success('Email verified! Welcome to ShopHub.')
      navigate('/account', { replace: true })
    } catch (err) {
      message.error(err?.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await resendOtp({ email })
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
    <AuthLayout title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email}`}>
      <Input.OTP length={6} size="large" value={code} onChange={setCode} className="w-full [&>*]:flex-1" />

      <Button type="primary" size="large" block loading={loading} onClick={handleVerify} className="mt-6">
        Verify email
      </Button>

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
        <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
          Start over
        </Link>
      </p>
    </AuthLayout>
  )
}
