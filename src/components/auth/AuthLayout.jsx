// Shared split-screen shell for every auth page (Login/Register/VerifyOtp/
// ForgotPassword/ResetPassword) so they stay visually consistent without
// repeating markup.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-800 p-12 text-white lg:flex lg:w-1/2">
        <div className="text-2xl font-bold tracking-tight">ShopHub</div>
        <div>
          <h2 className="text-3xl font-semibold leading-snug">
            Everything you need, in one place.
          </h2>
          <p className="mt-4 max-w-sm text-indigo-100">
            Sign in to track your orders, save favorites, and check out faster.
          </p>
        </div>
        <div className="text-sm text-indigo-200">© {new Date().getFullYear()} ShopHub</div>
      </div>

      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center text-2xl font-bold text-indigo-400 lg:hidden">
            ShopHub
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
