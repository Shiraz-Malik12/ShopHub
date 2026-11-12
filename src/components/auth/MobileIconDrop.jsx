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
//
// WHY THE ICONS ARE MOVED BY HAND (a requestAnimationFrame loop) instead of
// CSS / element.animate(): on iPhone, Safari runs those animations in a
// separate graphics process with its own clock. Right after a refresh Safari
// is busy for a moment and shows no new frames — but that clock keeps going,
// so when the screen caught up the icons were already at the bottom. Here
// each icon moves ONLY when a frame is actually drawn, so it can never skip
// ahead: a stall just pauses it, and it carries on from the same spot.

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
// Most the animation may move forward between two drawn frames. Normal frames
// (16–33 ms on phones) are well under it, so the speed is real; a stall of
// several seconds (phone busy after a refresh) moves it only this much.
const MAX_STEP_MS = 100
let dropPlayed = false

function shouldPlay() {
  if (dropPlayed) return false
  const media = (query) => window.matchMedia?.(query).matches
  return !media('(min-width: 1024px)') && !media('(prefers-reduced-motion: reduce)')
}

const rand = (min, max) => min + Math.random() * (max - min)
const lerp = (from, to, t) => from + (to - from) * t

// CSS-style cubic-bezier(x1, y1, x2, y2) easing as a function of 0..1 —
// the same curves the browser uses for `transition-timing-function`.
function cubicBezier(x1, y1, x2, y2) {
  const sample = (a1, a2, t) => ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t
  const slope = (a1, a2, t) => 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1
  return (x) => {
    if (x <= 0 || x >= 1) return x
    let t = x
    for (let i = 0; i < 8; i += 1) {
      // Newton's method: find t where the curve's x equals the input x
      const dx = sample(x1, x2, t) - x
      const d = slope(x1, x2, t)
      if (Math.abs(dx) < 1e-5 || d === 0) break
      t -= dx / d
    }
    return sample(y1, y2, Math.min(1, Math.max(0, t)))
  }
}

const FALL = cubicBezier(0.6, 0, 1, 1) // speeding up (gravity)
const LAND = cubicBezier(0, 0, 0.4, 1) // slowing down (hitting the floor)
const START = cubicBezier(0.35, 0, 0.9, 0.6)
const LINEAR = (t) => t

// One tile's journey as points in time (t = fraction of DROP_MS): out of the
// top-left corner → lands → bounces up → lands → small bounce → rests →
// shrinks away. `ease` shapes the movement from that point to the next.
function dropPath(index, width, height) {
  const startX = rand(-60, -30)
  const startY = rand(-60, -40)
  const landX = rand(20, width - TILE_SIZE - 50)
  const spin = rand(180, 420)
  const floor = height - TILE_SIZE - 20 - (index % 3) * 10 // a slightly uneven pile

  return [
    { t: 0, x: startX, y: startY, r: 0, s: 1, o: 0, ease: START },
    { t: 0.05, x: startX + 20, y: startY + 20, r: 20, s: 1, o: 1, ease: FALL },
    { t: 0.38, x: landX, y: floor, r: spin, s: 1, o: 1, ease: LAND }, // first landing
    { t: 0.5, x: landX + 18, y: floor - 90, r: spin + 40, s: 1, o: 1, ease: FALL }, // bounce up
    { t: 0.6, x: landX + 30, y: floor, r: spin + 70, s: 1, o: 1, ease: LAND }, // lands again
    { t: 0.66, x: landX + 36, y: floor - 30, r: spin + 80, s: 1, o: 1, ease: LINEAR }, // small bounce
    { t: 0.72, x: landX + 40, y: floor, r: spin + 90, s: 1, o: 1, ease: LINEAR }, // rests
    { t: 0.88, x: landX + 40, y: floor, r: spin + 90, s: 1, o: 1, ease: LINEAR },
    { t: 1, x: landX + 40, y: floor + 10, r: spin + 90, s: 0.6, o: 0, ease: LINEAR }, // shrinks away
  ]
}

// Where a tile is at `progress` (0..1) along its path.
function pointAt(path, progress) {
  let i = 0
  while (i < path.length - 2 && progress > path[i + 1].t) i += 1
  const from = path[i]
  const to = path[i + 1]
  const local = Math.min(1, Math.max(0, (progress - from.t) / (to.t - from.t)))
  const k = from.ease(local)
  return {
    x: lerp(from.x, to.x, k),
    y: lerp(from.y, to.y, k),
    r: lerp(from.r, to.r, k),
    s: lerp(from.s, to.s, k),
    o: lerp(from.o, to.o, local),
  }
}

// Resolves once the page has loaded, is visible and its fonts are ready —
// so the fall starts on a finished page. Capped, so it never waits forever.
const MAX_WAIT_MS = 3000

function waitForPage() {
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
  const ready = loaded.then(() => visible).then(() => document.fonts?.ready)
  return Promise.race([ready, new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS))])
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
    let frame = null

    waitForPage().then(() => {
      if (cancelled) return
      const layer = layerRef.current
      const tiles = [...layer.children]
      // Measured now (not earlier): Safari's toolbar can change the screen
      // height while the page is still loading.
      const paths = tiles.map((_, index) => dropPath(index, layer.clientWidth, layer.clientHeight))
      const total = DROP_MS + (tiles.length - 1) * STAGGER_MS

      let elapsed = 0
      let lastFrameAt = null
      const draw = (now) => {
        if (cancelled) return
        // Real time between drawn frames (so the speed is right even at
        // 20–30 fps), but never more than MAX_STEP_MS after a stall.
        const gap = lastFrameAt === null ? 0 : now - lastFrameAt
        lastFrameAt = now
        elapsed += Math.min(gap, MAX_STEP_MS)

        tiles.forEach((tile, index) => {
          const progress = (elapsed - index * STAGGER_MS) / DROP_MS
          const p = pointAt(paths[index], Math.min(1, Math.max(0, progress)))
          tile.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) scale(${p.s})`
          tile.style.opacity = progress < 0 ? '0' : String(p.o)
        })

        if (elapsed >= total) setDone(true)
        else frame = requestAnimationFrame(draw)
      }
      frame = requestAnimationFrame(draw)
    })

    return () => {
      cancelled = true
      if (frame) cancelAnimationFrame(frame)
    }
  }, [active])

  if (!active || done) return null

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-20 overflow-hidden lg:hidden" aria-hidden="true">
      {TILES.map(({ Icon, style }, index) => (
        <div
          key={index}
          className={`absolute left-0 top-0 flex items-center justify-center rounded-[14px] text-xl opacity-0 shadow-[0_8px_18px_-6px_rgb(26_32_51/0.35)] will-change-transform ${TILE_STYLES[style]}`}
          style={{ width: TILE_SIZE, height: TILE_SIZE }}
        >
          {Icon ? <Icon /> : <BrandMark size={24} />}
        </div>
      ))}
    </div>
  )
}
