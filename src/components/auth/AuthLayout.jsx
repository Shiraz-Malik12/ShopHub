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
        <div className="glow pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem]" style={{ '--glow': 'rgb(36 87 214 / 0.6)' }} />
        <div className="glow pointer-events-none absolute -bottom-48 -left-32 h-[34rem] w-[34rem]" style={{ '--glow': 'rgb(255 107 74 / 0.3)' }} />

        <LogoReveal />
      </div>

      {/* Phones & tablets (no brand panel): soft brand-color glows drift
          slowly behind the form, over a faint dot pattern. Decorative only. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden" aria-hidden="true">
        <div className="auth-dots absolute inset-0" />
        <div className="glow auth-blob-a absolute -right-36 -top-32 h-[26rem] w-[26rem]" style={{ '--glow': 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
        <div className="glow auth-blob-b absolute -bottom-36 -left-32 h-[26rem] w-[26rem]" style={{ '--glow': 'color-mix(in srgb, var(--coral) 30%, transparent)' }} />
        <div className="glow auth-blob-c absolute left-1/4 top-1/2 h-72 w-72" style={{ '--glow': 'rgb(91 140 255 / 0.18)' }} />
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
