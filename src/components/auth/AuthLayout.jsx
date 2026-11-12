import Logo from '../Logo'
import ThemeToggle from '../ThemeToggle'
import LogoReveal from './LogoReveal'
import MobileIconDrop from './MobileIconDrop'

// Shared split-screen shell for every auth page (Login/Register/VerifyOtp/
// ForgotPassword/ResetPassword) so they stay visually consistent without
// repeating markup. Left (large screens only): the navy brand panel with the
// animated logo in the middle; right: the page's form.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen bg-page">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative hidden overflow-hidden bg-brand-deep lg:block lg:w-1/2">
        {/* Soft decorative glow — purely visual (brand blue + coral). */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#2457d6]/55 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#ff6b4a]/25 blur-3xl" />

        <LogoReveal />
      </div>

      {/* Phones & tablets (no brand panel): soft brand-color glows drift
          slowly behind the form, over a faint dot pattern. Decorative only. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden" aria-hidden="true">
        <div className="auth-dots absolute inset-0" />
        <div className="auth-blob-a absolute -right-24 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="auth-blob-b absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-coral/25 blur-3xl" />
        <div className="auth-blob-c absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-[#5b8cff]/15 blur-3xl" />
      </div>

      {/* Phones & tablets: shop icons drop in and bounce once on page load. */}
      <MobileIconDrop />

      <div className="relative flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* On small screens the brand panel is hidden, so show the logo here. */}
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-subtle">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
