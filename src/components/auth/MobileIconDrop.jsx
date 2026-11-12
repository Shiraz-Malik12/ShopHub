import { useEffect, useRef, useState } from 'react'
import {
  GiftOutlined,
  HeartOutlined,
  PercentageOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarOutlined,
  TagOutlined,
} from '@ant-design/icons'
import BrandMark from '../BrandMark'

// Phones & tablets only: when an auth page first opens, shop icons tumble
// out of the top-left corner, bounce twice on the bottom edge, rest for a
// moment as a little pile, then fade away (~3.5s). On laptops the brand panel
// with the logo animation plays instead.
//
// Plays ONCE per page load: moving between Login / Register / Forgot
// password doesn't replay it (`dropPlayed`). Skipped for people who prefer
// reduced motion. The tiles sit in front of the form but can never be
// clicked (pointer-events: none), and the layer removes itself when done.

const TILES = [
  { Icon: ShoppingCartOutlined, style: 'blue' },
  { Icon: TagOutlined, style: 'white' },
  { Icon: HeartOutlined, style: 'coral' },
  { Icon: StarOutlined, style: 'blue' },
  { Icon: GiftOutlined, style: 'coral' },
  { Icon: PercentageOutlined, style: 'white' },
  { Icon: null, style: 'white' }, // the ShopHub logo
  { Icon: ShoppingOutlined, style: 'coral' },
  { Icon: ShoppingCartOutlined, style: 'white' },
  { Icon: StarOutlined, style: 'coral' },
  { Icon: TagOutlined, style: 'blue' },
  { Icon: GiftOutlined, style: 'white' },
  { Icon: HeartOutlined, style: 'blue' },
  { Icon: null, style: 'white' },
]

const TILE_STYLES = {
  blue: 'bg-[#2457d6] text-white',
  coral: 'bg-[#ff6b4a] text-white',
  white: 'bg-white text-[#2457d6]',
}

const TILE_SIZE = 42
const DROP_MS = 2600 // one tile's whole journey
const STAGGER_MS = 70 // each tile starts this much after the previous one
// A gap between two painted frames longer than this is a "freeze" (iPhone
// Safari right after a refresh), not just a slow phone.
const FREEZE_MS = 150
const FRAME_MS = 16 // one normal frame
let dropPlayed = false

function shouldPlay() {
  if (dropPlayed) return false
  const media = (query) => window.matchMedia?.(query).matches
  return !media('(min-width: 1024px)') && !media('(prefers-reduced-motion: reduce)')
}

const rand = (min, max) => min + Math.random() * (max - min)

// Resolves when the page is actually on screen and settled:
//   1. fully loaded (after a refresh: scripts, styles, images)
//   2. web fonts ready (text won't jump around mid-animation)
//   3. the tab is visible (not still loading in the background)
//   4. two frames have been painted (the browser has really drawn the page)
// Capped at MAX_WAIT_MS, so the animation never waits forever.
const MAX_WAIT_MS = 2500

function waitUntilPageIsShown() {
  const loaded =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }))

  const visible =
    document.visibilityState === 'visible'
      ? Promise.resolve()
      : new Promise((resolve) => {
          const onChange = () => {
            if (document.visibilityState !== 'visible') return
            document.removeEventListener('visibilitychange', onChange)
            resolve()
          }
          document.addEventListener('visibilitychange', onChange)
        })

  const twoFrames = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const ready = loaded
    .then(() => document.fonts?.ready)
    .then(() => visible)
    .then(twoFrames)
    .then(() => new Promise((resolve) => setTimeout(resolve, 150))) // a short breath after the first paint

  // Even when giving up on "loaded", never start while the tab is hidden.
  const giveUp = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS))
    .then(() => visible)
    .then(twoFrames)
  return Promise.race([ready, giveUp])
}

// One tile's journey: out of the top-left corner → lands → bounces up →
// lands → small bounce → rests → shrinks away. Offsets are fractions of the
// whole animation; each landing uses an "ease-out" curve (slowing down like
// it hit the floor) and each fall an "ease-in" curve (speeding up, gravity).
function dropKeyframes(index, width, height) {
  const startX = rand(-60, -30)
  const startY = rand(-60, -40)
  const landX = rand(20, width - TILE_SIZE - 50)
  const spin = rand(180, 420)
  const floor = height - TILE_SIZE - 20 - (index % 3) * 10 // a slightly uneven pile

  const at = (x, y, rotate, extra = {}) => ({ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`, ...extra })
  return [
    at(startX, startY, 0, { opacity: 0, easing: 'cubic-bezier(.35,0,.9,.6)' }),
    at(startX + 20, startY + 20, 20, { opacity: 1, offset: 0.05, easing: 'cubic-bezier(.4,0,1,1)' }),
    at(landX, floor, spin, { offset: 0.38, easing: 'cubic-bezier(0,0,.4,1)' }),
    at(landX + 18, floor - 90, spin + 40, { offset: 0.5, easing: 'cubic-bezier(.6,0,1,1)' }),
    at(landX + 30, floor, spin + 70, { offset: 0.6, easing: 'cubic-bezier(0,0,.4,1)' }),
    at(landX + 36, floor - 30, spin + 80, { offset: 0.66, easing: 'cubic-bezier(.6,0,1,1)' }),
    at(landX + 40, floor, spin + 90, { opacity: 1, offset: 0.72 }),
    at(landX + 40, floor, spin + 90, { opacity: 1, offset: 0.88 }),
    { transform: `translate(${landX + 40}px, ${floor + 10}px) rotate(${spin + 90}deg) scale(0.6)`, opacity: 0 },
  ]
}

export default function MobileIconDrop() {
  // Decided once when the page opens; `done` removes the layer afterwards.
  const [active] = useState(shouldPlay)
  const [done, setDone] = useState(false)
  const layerRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    dropPlayed = true

    let cancelled = false
    let animations = []
    let frame = null

    // 1. Start only once the screen is really showing the page.
    waitUntilPageIsShown().then(() => {
      if (cancelled) return
      const layer = layerRef.current
      // Measured now (not earlier): Safari's toolbar can change the screen
      // height while the page is still loading.
      const { clientWidth: width, clientHeight: height } = layer
      // 2. Let the browser play it normally — at real speed, on the
      //    graphics hardware (only transform/opacity change), so it's smooth
      //    even on slow phones and in Low Power Mode.
      animations = [...layer.children].map((tile, index) =>
        tile.animate(dropKeyframes(index, width, height), {
          duration: DROP_MS,
          delay: index * STAGGER_MS,
          fill: 'both',
        }),
      )

      // 3. Freeze guard. If the screen stops drawing for a moment (iPhone
      //    Safari does this right after a refresh), the animation's clock
      //    keeps running and people would miss the start. So we watch the
      //    frames: after a freeze, wind the animation back by the frozen
      //    time — before that frame is painted — and it carries on from
      //    where people last saw it. Normal (even slow) frames are left
      //    alone, so the speed always stays real.
      let lastFrameAt = null
      const watch = (now) => {
        if (cancelled) return
        const gap = lastFrameAt === null ? 0 : now - lastFrameAt
        if (gap > FREEZE_MS) {
          const missed = gap - FRAME_MS
          animations.forEach((animation) => {
            animation.currentTime = Math.max(0, animation.currentTime - missed)
          })
        }
        lastFrameAt = now
        frame = requestAnimationFrame(watch)
      }
      frame = requestAnimationFrame(watch)

      Promise.all(animations.map((animation) => animation.finished))
        .then(() => {
          cancelAnimationFrame(frame)
          setDone(true)
        })
        .catch(() => {}) // cancelled (page left early) — nothing to do
    })

    return () => {
      cancelled = true
      if (frame) cancelAnimationFrame(frame)
      animations.forEach((animation) => animation.cancel())
    }
  }, [active])

  if (!active || done) return null

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-20 overflow-hidden lg:hidden" aria-hidden="true">
      {TILES.map(({ Icon, style }, index) => (
        <div
          key={index}
          className={`absolute left-0 top-0 flex items-center justify-center rounded-[14px] text-xl opacity-0 shadow-[0_8px_18px_-6px_rgb(26_32_51/0.35)] ${TILE_STYLES[style]}`}
          style={{ width: TILE_SIZE, height: TILE_SIZE }}
        >
          {Icon ? <Icon /> : <BrandMark size={24} />}
        </div>
      ))}
    </div>
  )
}
