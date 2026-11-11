import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'shophub-theme'
const ThemeContext = createContext(null)

// The saved choice, or light mode for first-time visitors. Storage can be
// blocked (private windows), so failures just fall back to light.
function readSavedMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Holds the light/dark choice in ONE place. Tailwind colors follow the
// `dark` class on <html>; antd follows `mode` (see main.jsx).
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readSavedMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Not saved — the theme still works for this visit.
    }
  }, [mode])

  function toggleMode() {
    setMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
