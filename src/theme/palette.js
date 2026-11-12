import { theme } from 'antd'

// antd's colors for each mode (the "Hub Bag" brand: blue, coral, navy, mist white).
// antd can't read CSS variables (it calculates hover/active shades from real
// hex values), so these repeat the values in src/index.css — keep the two in
// sync when changing a color.
const COLORS = {
  light: {
    primary: '#2457d6',
    primaryHover: '#3a6ae0',
    link: '#2457d6',
    linkHover: '#1a43a8',
    coral: '#c8401f',
    text: '#1a2033',
    textSecondary: '#5b6478',
    page: '#f4f6fb',
    surface: '#ffffff',
    elevated: '#ffffff',
    muted: '#ecf0f7',
    line: '#e3e8f1',
    lineStrong: '#cdd5e3',
    tableHeader: '#f7f9fc',
  },
  dark: {
    primary: '#3366e8',
    primaryHover: '#4a78ee',
    link: '#8db0ff',
    linkHover: '#b5ccff',
    coral: '#ff8a6e',
    text: '#f1f4fa',
    textSecondary: '#98a1b3',
    page: '#0f1420',
    surface: '#171d2c',
    elevated: '#212838',
    muted: '#212838',
    line: '#283043',
    lineStrong: '#39435a',
    tableHeader: '#1c2333',
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
      // Pill-shaped buttons. Secondary (outlined) buttons turn coral on
      // hover — part of the coral "30%" — while main buttons stay blue.
      Button: {
        borderRadius: 999,
        borderRadiusLG: 999,
        borderRadiusSM: 999,
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 500,
        defaultHoverColor: c.coral,
        defaultHoverBorderColor: c.coral,
        defaultActiveColor: c.coral,
        defaultActiveBorderColor: c.coral,
      },
      Table: { headerBg: c.tableHeader, headerColor: c.textSecondary, rowHoverBg: c.muted },
      Modal: { contentBg: c.surface, headerBg: c.surface },
    },
  }
}
