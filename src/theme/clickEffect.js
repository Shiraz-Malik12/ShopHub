// Custom click animation for antd buttons (plugged in through
// <ConfigProvider wave={{ showEffect }}> in main.jsx, which replaces antd's
// default "wave"). antd calls it on every click with the button element and
// the mouse event, so the effect starts exactly where the user clicked:
//   • every button  → a soft ripple spreading from the click point
//   • main buttons  → plus a burst of coral/blue sparkles
//   • "Add to cart" → glow rings + icon pop + a flying "+1" instead
//   • checkboxes, switches, tags... → a quick glow ring
// Uses the Web Animations API (element.animate), so no CSS file is needed,
// and every piece removes itself when its animation ends.

const SPARK_COLORS = ['#ff6b4a', '#ff8a6e', '#2457d6', '#5b8cff', '#ffffff']

// How much longer every effect lasts than its quick base timing — one
// place to make all the click animations slower or faster.
const EXTRA_MS = 2000
const SPARK_COUNT = 12

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Where the click happened. Keyboard presses (Enter/Space) have no mouse
// position (detail === 0), so use the middle of the element instead.
function clickPoint(element, event) {
  const rect = element.getBoundingClientRect()
  if (!event || event.detail === 0) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect }
  }
  return { x: event.clientX, y: event.clientY, rect }
}

// A circle that grows from the click point, clipped to the button's shape.
function ripple(element, { x, y, rect }) {
  const clip = document.createElement('span')
  Object.assign(clip.style, {
    position: 'absolute',
    inset: '0',
    borderRadius: 'inherit',
    overflow: 'hidden',
    pointerEvents: 'none',
  })

  const size = Math.max(rect.width, rect.height) * 2.2
  const isSolid = element.matches('.ant-btn-variant-solid, .ant-btn-primary')
  const circle = document.createElement('span')
  Object.assign(circle.style, {
    position: 'absolute',
    left: `${x - rect.left - size / 2}px`,
    top: `${y - rect.top - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: isSolid ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 107, 74, 0.25)',
  })

  clip.appendChild(circle)
  element.appendChild(clip)
  circle
    .animate(
      [
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration: 600 + EXTRA_MS, easing: 'cubic-bezier(.2,.7,.3,1)' },
    )
    .finished.finally(() => clip.remove())
}

// Little dots that fly out from the click point and fade away.
function sparkBurst({ x, y }) {
  for (let i = 0; i < SPARK_COUNT; i += 1) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.4
    const distance = 40 + Math.random() * 40
    const size = 4 + Math.random() * 4

    const spark = document.createElement('span')
    Object.assign(spark.style, {
      position: 'fixed',
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: i % 3 === 0 ? '2px' : '50%',
      background: SPARK_COLORS[i % SPARK_COLORS.length],
      pointerEvents: 'none',
      zIndex: '9999',
    })
    document.body.appendChild(spark)

    spark
      .animate(
        [
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.2) rotate(${Math.random() * 180}deg)`,
            opacity: 0,
          },
        ],
        { duration: 550 + EXTRA_MS + Math.random() * 250, easing: 'cubic-bezier(.15,.8,.3,1)' },
      )
      .finished.finally(() => spark.remove())
  }
}

// A quick coral ring for small controls (checkbox, radio, switch, tag).
function glowRing(element) {
  element
    .animate(
      [{ boxShadow: '0 0 0 0 rgba(255, 107, 74, 0.5)' }, { boxShadow: '0 0 0 8px rgba(255, 107, 74, 0)' }],
      { duration: 500 + EXTRA_MS, easing: 'ease-out' },
    )
}

// "Add to cart" buttons (marked with data-effect="add-to-cart"): glowing
// rings spread out from the button's edge, the button glows, the cart icon
// pops, and a coral "+1" flies up out of it.
function addToCartPop(element) {
  const rect = element.getBoundingClientRect()
  const blue = '91, 140, 255'

  ;[0, 140].forEach((delay) => {
    const ring = document.createElement('span')
    Object.assign(ring.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: '999px',
      border: `2px solid rgba(${blue}, 0.9)`,
      pointerEvents: 'none',
      zIndex: '9999',
    })
    document.body.appendChild(ring)
    ring
      .animate(
        [
          { transform: 'scale(1)', opacity: 0.9 },
          { transform: 'scale(1.18, 1.6)', opacity: 0 },
        ],
        { duration: 650 + EXTRA_MS, delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
      )
      .finished.finally(() => ring.remove())
  })

  element.animate(
    [
      { boxShadow: `0 0 0 0 rgba(${blue}, 0.5)` },
      { boxShadow: `0 0 24px 4px rgba(${blue}, 0.35)`, offset: 0.3 },
      { boxShadow: `0 0 0 0 rgba(${blue}, 0)` },
    ],
    { duration: 700 + EXTRA_MS },
  )

  element.querySelector('.anticon')?.animate(
    [
      { transform: 'scale(1) rotate(0)' },
      { transform: 'scale(1.6) rotate(-12deg)', offset: 0.35 },
      { transform: 'scale(0.9) rotate(6deg)', offset: 0.7 },
      { transform: 'scale(1) rotate(0)' },
    ],
    { duration: 520 + EXTRA_MS, easing: 'ease-out' },
  )

  const plusOne = document.createElement('span')
  plusOne.textContent = '+1'
  Object.assign(plusOne.style, {
    position: 'fixed',
    left: `${rect.left + rect.width / 2 - 16}px`,
    top: `${rect.top - 6}px`,
    width: '32px',
    padding: '3px 0',
    textAlign: 'center',
    font: "700 13px 'Inter', sans-serif",
    color: '#ffffff',
    background: '#ff6b4a',
    borderRadius: '999px',
    pointerEvents: 'none',
    zIndex: '9999',
  })
  document.body.appendChild(plusOne)
  plusOne
    .animate(
      [
        { transform: 'translateY(0) scale(0.6)', opacity: 0 },
        { transform: 'translateY(-14px) scale(1.05)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(-36px) scale(1)', opacity: 0 },
      ],
      { duration: 900 + EXTRA_MS, easing: 'ease-out' },
    )
    .finished.finally(() => plusOne.remove())
}

export function showClickEffect(element, { component, event }) {
  if (prefersReducedMotion()) return

  if (component !== 'Button') {
    glowRing(element)
    return
  }

  if (element.dataset.effect === 'add-to-cart') {
    addToCartPop(element)
    return
  }

  const point = clickPoint(element, event)
  ripple(element, point)
  if (element.matches('.ant-btn-variant-solid, .ant-btn-primary')) {
    sparkBurst(point)
  }
}
