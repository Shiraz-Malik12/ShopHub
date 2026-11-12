import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightOutlined, CarOutlined, GiftOutlined, HeartOutlined, SafetyCertificateOutlined } from '@ant-design/icons'

// Login-page brand intro. Plays ONCE:
//   1. "reveal"  — the ShopHub bag draws itself in the middle of the panel
//                  (outline → blue fill → hub lines → dots pop → coral burst),
//                  then "ShopHub" types in with "STORE" underneath (~4.5s).
//   2. "settled" — the logo glides up to the top, a short description fades
//                  in at the center, and feature cards + links rise in at the
//                  bottom (their icons keep a gentle animation going).
// The drawing keyframes live in index.css (`reveal-*`), the bottom icons use
// the `auth-icon-*` classes there too.
//
// It only plays on the first auth page you open: switching between Login,
// Register, Forgot password... shows the finished state straight away
// (`introPlayed` stays true until the page is reloaded). People who prefer
// reduced motion also get the finished state with no animation.

const WORD = 'ShopHub'
const REVEAL_MS = 4700
let introPlayed = false

const FEATURES = [
  { icon: CarOutlined, label: 'Cash on delivery', anim: 'auth-icon-drive' },
  { icon: SafetyCertificateOutlined, label: 'Secure sign-in', anim: 'auth-icon-bounce' },
  { icon: GiftOutlined, label: 'Coupons & deals', anim: 'auth-icon-wiggle' },
  { icon: HeartOutlined, label: 'Wishlist', anim: 'auth-icon-beat' },
]

function startsSettled() {
  return introPlayed || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function LogoReveal() {
  // Decided once, when the panel first appears: play the intro, or skip it.
  const [skipIntro] = useState(startsSettled)
  const [settled, setSettled] = useState(skipIntro)
  const logoRef = useRef(null)
  const startRect = useRef(null)

  useEffect(() => {
    if (settled) return undefined
    const timer = setTimeout(() => {
      // FLIP step 1 (First): remember where the big centered logo is.
      startRect.current = logoRef.current?.getBoundingClientRect() ?? null
      introPlayed = true
      setSettled(true)
    }, REVEAL_MS)
    return () => clearTimeout(timer)
  }, [settled])

  // FLIP steps 2–4: React has now drawn the logo small at the top (Last).
  // Before the browser paints, push it back to where it was (Invert), then
  // let it glide into place (Play). Only `transform` animates, so it's smooth.
  useLayoutEffect(() => {
    const first = startRect.current
    const element = logoRef.current
    if (!settled || !first || !element) return
    startRect.current = null

    const last = element.getBoundingClientRect()
    // The logo scales from its top-left corner (origin-top-left), so line up
    // the top-left corners of the "before" and "after" boxes.
    const scale = first.width / last.width
    const dx = first.left - last.left
    const dy = first.top - last.top
    element.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: 'translate(0, 0) scale(1)' }],
      { duration: 1100, easing: 'cubic-bezier(.22, 1, .36, 1)' },
    )
  }, [settled])

  return (
    // reveal-done: shows the finished logo with no drawing animation.
    <div className={`absolute inset-0 ${skipIntro ? 'reveal-done' : ''}`}>
      {/* Logo: big in the middle while it draws, then small at the top. */}
      <div className={`absolute left-1/2 -translate-x-1/2 ${settled ? 'top-10' : 'top-1/2 -translate-y-1/2'}`} aria-hidden="true">
        <div ref={logoRef} className="flex origin-top-left flex-col items-center">
          <svg
            viewBox="0 0 64 64"
            width={settled ? 92 : 170}
            height={settled ? 92 : 170}
            className="reveal-mark overflow-visible"
          >
            {/* handle + bag outline draw first, then the bag fills in */}
            <path className="reveal-outline" pathLength="100" d="M20 19V17.3a12 12 0 0 1 24 0V19" fill="none" stroke="#2457d6" strokeWidth="6" />
            <path
              className="reveal-outline reveal-fill"
              pathLength="100"
              d="M7.2 18.8h49.6l-3.2 40a4 4 0 0 1-4 4H14.4a4 4 0 0 1-4-4z"
              stroke="#5b8cff"
              strokeWidth="1.5"
            />
            {/* the hub: lines grow out, dots pop, the coral center bursts */}
            <g stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
              <line className="reveal-line" pathLength="100" x1="32" y1="41.4" x2="20" y2="32.7" />
              <line className="reveal-line" pathLength="100" x1="32" y1="41.4" x2="44" y2="32.7" />
              <line className="reveal-line" pathLength="100" x1="32" y1="41.4" x2="32" y2="54.9" />
            </g>
            <g fill="#ffffff">
              <circle className="reveal-node" cx="20" cy="32.7" r="3" />
              <circle className="reveal-node" cx="44" cy="32.7" r="3" />
              <circle className="reveal-node" cx="32" cy="54.9" r="3" />
            </g>
            <circle className="reveal-burst" cx="32" cy="41.4" r="6" fill="none" stroke="#ff6b4a" strokeWidth="1.5" />
            <circle className="reveal-core" cx="32" cy="41.4" r="5.3" fill="#ff6b4a" />
          </svg>

          <div
            className={`whitespace-nowrap font-brand font-bold leading-none tracking-tight ${
              settled ? 'mt-3 text-[22px]' : 'mt-5 text-[40px]'
            }`}
          >
            {[...WORD].map((letter, index) => (
              <span
                key={index}
                className={`reveal-letter ${index >= 4 ? 'text-[#e8502e]' : 'text-white'}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {letter}
              </span>
            ))}
          </div>
          <div className={`reveal-tag mt-1 font-semibold text-white/60 ${settled ? 'text-[9px] tracking-[0.45em]' : 'text-xs tracking-[0.5em]'}`}>
            STORE
          </div>
        </div>
      </div>

      {/* Description: fades in at the center once the logo has moved up. */}
      <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 text-center">
        <div
          className={`transition-all delay-500 duration-700 ease-out ${
            settled ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Many products.
            <br />
            <span className="text-[#ff8a6e]">One place to shop.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/75">
            Discover books, games and gadgets, save your favourites to a wishlist, and check out in minutes — all from
            one secure ShopHub account.
          </p>
        </div>
      </div>

      {/* Bottom: feature cards with gently animated icons, then quick links. */}
      <div className={`absolute inset-x-10 bottom-8 ${settled ? '' : 'pointer-events-none'}`}>
        <ul className="grid grid-cols-4 gap-3">
          {FEATURES.map(({ icon: Icon, label, anim }, index) => (
            <li
              key={label}
              className={`flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] px-2 py-3 text-center ring-1 ring-white/10 backdrop-blur transition-all duration-700 ease-out ${
                settled ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: settled && !skipIntro ? `${700 + index * 120}ms` : '0ms' }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6b4a]/15 text-lg text-[#ff8a6e]">
                <Icon className={anim} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-white/80">{label}</span>
            </li>
          ))}
        </ul>

        <div
          className={`mt-5 flex items-center justify-between text-sm transition-opacity delay-[1300ms] duration-700 ${
            settled ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Link to="/products" className="group inline-flex items-center gap-2 font-medium text-white/85 hover:text-white">
            Browse the shop
            <ArrowRightOutlined className="auth-icon-nudge text-[#ff8a6e]" />
          </Link>
          <div className="flex items-center gap-4 text-white/55">
            <Link to="/contact" className="text-white/55 hover:text-white">Contact us</Link>
            <span>© {new Date().getFullYear()} ShopHub</span>
          </div>
        </div>
      </div>
    </div>
  )
}
