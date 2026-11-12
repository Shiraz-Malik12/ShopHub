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
// moment as a little pile, then fade away (~5s). On laptops the brand panel
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
let dropPlayed = false

function shouldPlay() {
  if (dropPlayed) return false
  const media = (query) => window.matchMedia?.(query).matches
  return !media('(min-width: 1024px)') && !media('(prefers-reduced-motion: reduce)')
}

const rand = (min, max) => min + Math.random() * (max - min)

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

    const layer = layerRef.current
    const { clientWidth: width, clientHeight: height } = layer
    const animations = [...layer.children].map((tile, index) =>
      tile.animate(dropKeyframes(index, width, height), { duration: 3600, delay: index * 120, fill: 'both' }),
    )

    Promise.all(animations.map((animation) => animation.finished))
      .then(() => setDone(true))
      .catch(() => {}) // cancelled (page left early) — nothing to do

    return () => animations.forEach((animation) => animation.cancel())
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
