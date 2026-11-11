import { theme } from 'antd'

// antd's colors for each mode. antd can't read CSS variables (it calculates
// hover/active shades from real hex values), so these repeat the values in
// src/index.css — keep the two in sync when changing a color.
const COLORS = {
  light: {
    primary: '#2f5e9e',
    primaryHover: '#3a6ea5',
    link: '#2f5e9e',
    linkHover: '#1f4478',
    text: '#292d32',
    textSecondary: '#5f6b7a',
    page: '#f3f6fa',
    surface: '#ffffff',
    elevated: '#ffffff',
    muted: '#e9eff6',
    line: '#dfe6ef',
    lineStrong: '#c8d3e0',
    tableHeader: '#eef3f9',
  },
  dark: {
    primary: '#3f72b5',
    primaryHover: '#4d82c7',
    link: '#9dc1ec',
    linkHover: '#c4dbf5',
    text: '#f1f5fa',
    textSecondary: '#9b9b9b',
    page: '#1b1e23',
    surface: '#292d32',
    elevated: '#323840',
    muted: '#323840',
    line: '#3a414a',
    lineStrong: '#4a525c',
    tableHeader: '#2f343b',
  },
}

// The full antd theme for 'light' or 'dark' — passed to <ConfigProvider>.
export function antdTheme(mode) {
  const c = COLORS[mode]
  return {
    // darkAlgorithm / defaultAlgorithm derive every other antd color
    // (disabled states, shadows...) from the tokens below.
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorPrimaryHover: c.primaryHover,
      colorInfo: c.primary,
      colorLink: c.link,
      colorLinkHover: c.linkHover,
      colorText: c.text,
      colorTextSecondary: c.textSecondary,
      colorBgLayout: c.page,
      colorBgContainer: c.surface,
      colorBgElevated: c.elevated,
      colorBorder: c.lineStrong,
      colorBorderSecondary: c.line,
      borderRadius: 10,
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      // Pill-shaped buttons, like the reference card design.
      Button: {
        borderRadius: 999,
        borderRadiusLG: 999,
        borderRadiusSM: 999,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 500,
      },
      Table: { headerBg: c.tableHeader, headerColor: c.textSecondary, rowHoverBg: c.muted },
      Modal: { contentBg: c.surface, headerBg: c.surface },
    },
  }
}
