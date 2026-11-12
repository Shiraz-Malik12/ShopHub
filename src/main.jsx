import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { antdTheme } from './theme/palette.js'
import { showClickEffect } from './theme/clickEffect.js'

// Gives every antd component (buttons, inputs, tables, modals) the colors of
// the current light/dark mode. A separate component because it needs
// useTheme(), which only works inside <ThemeProvider>.
function ThemedApp() {
  const { mode } = useTheme()

  return (
    // wave: our own click animation (ripple + sparkles) instead of antd's default.
    <ConfigProvider theme={antdTheme(mode)} wave={{ showEffect: showClickEffect }}>
      {/* antd's <App> provides the context that message/notification/modal
          hooks (AntdApp.useApp()) need to render on-theme — see the auth
          pages for the useApp() pattern. */}
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            {/* Inside AuthProvider: the cart needs to know who is signed in. */}
            <CartProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* layer: puts antd's styles in the `antd` CSS layer (ordered in
        index.css) so Tailwind utility classes can override them. */}
    <StyleProvider layer>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </StyleProvider>
  </StrictMode>,
)
