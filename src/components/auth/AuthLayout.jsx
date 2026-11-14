import Logo from '../Logo'
import ThemeToggle from '../ThemeToggle'
import LogoReveal from './LogoReveal'
import MobileIconDrop from './MobileIconDrop'

// Shared split-screen shell for every auth page (Login/Register/VerifyOtp/
// ForgotPassword/ResetPassword) so they stay visually consistent without
// repeating markup. Left (large screens only): the navy brand panel with the
// animated logo in the middle; right: the page's form.
//
// Scrolling on large screens: the page is exactly one screen tall
// (lg:h-dvh + overflow-hidden) and ONLY the form side scrolls (its own
// overflow-y-auto), so the brand panel stays in place when a long form —
// like Create account — doesn't fit. Phones and tablets have no brand panel
// and simply scroll the whole page, as before.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-visible relative flex bg-page lg:h-dvh lg:overflow-hidden">
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

      {/* my-auto (not items-center) centers the form vertically: when the
          form is taller than the screen it starts at the top and scrolls,
          instead of its top being cut off. */}
      <div className="relative flex w-full justify-center p-6 sm:p-10 lg:w-1/2 lg:overflow-y-auto">
        <div className="my-auto w-full max-w-sm">
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
