import { CheckCircleOutlined } from '@ant-design/icons'
import Logo from '../Logo'

const HIGHLIGHTS = ['Curated products, updated regularly', 'Secure sign-in with email verification', 'Fast, simple checkout experience']

// Shared split-screen shell for every auth page (Login/Register/VerifyOtp/
// ForgotPassword/ResetPassword) so they stay visually consistent without
// repeating markup.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-indigo-600 p-12 text-white lg:flex lg:w-1/2">
        {/* Soft decorative glow — purely visual. */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-400/40 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">Everything you need, in one place.</h2>
          <ul className="mt-8 space-y-3 text-indigo-100">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircleOutlined className="text-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-sm text-indigo-200">© {new Date().getFullYear()} ShopHub</div>
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
