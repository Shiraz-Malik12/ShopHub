import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* layer: puts antd's styles in the `antd` CSS layer (ordered in
        index.css) so Tailwind utility classes can override them. */}
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          // One place for the app's look — every antd component (buttons,
          // inputs, tables, modals) picks these up automatically.
          // darkAlgorithm derives dark versions of every antd color; the
          // tokens below pin surfaces to the same slate palette the Tailwind
          // classes use, so antd components and custom markup match exactly.
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#6366f1', // indigo-500 — reads better than 600 on dark
            colorInfo: '#6366f1',
            colorText: '#f1f5f9', // slate-100
            colorTextSecondary: '#94a3b8', // slate-400
            colorBgLayout: '#020617', // slate-950 — page background
            colorBgContainer: '#0f172a', // slate-900 — cards, inputs, tables
            colorBgElevated: '#1e293b', // slate-800 — dropdowns, modals, popovers
            colorBorder: '#334155', // slate-700
            colorBorderSecondary: '#1e293b', // slate-800
            borderRadius: 8,
            fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Button: { primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none', fontWeight: 500 },
            Table: { headerBg: '#131c31', headerColor: '#94a3b8', rowHoverBg: '#1e293b' },
            Modal: { contentBg: '#0f172a', headerBg: '#0f172a' },
          },
        }}
      >
        {/* antd's <App> provides the context that message/notification/modal
            hooks (AntdApp.useApp()) need to render on-theme — see the auth
            pages for the useApp() pattern. */}
        <AntdApp>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  </StrictMode>,
)
