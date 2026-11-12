import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useTheme } from '../context/ThemeContext'

// Round sun/moon button that switches between light and dark mode.
export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-base text-subtle transition hover:border-coral/40 hover:text-highlight"
    >
      {isDark ? <SunOutlined /> : <MoonOutlined />}
    </button>
  )
}
