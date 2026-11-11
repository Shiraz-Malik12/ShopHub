// Runs before the page paints (loaded in <head> of index.html), so a visitor
// who chose dark mode never sees a flash of the light theme while React
// loads. A separate file (not an inline <script>) because the server's
// Content-Security-Policy only allows scripts from our own files.
try {
  if (localStorage.getItem('shophub-theme') === 'dark') {
    document.documentElement.classList.add('dark')
  }
} catch {
  // Storage blocked: stay on the default light theme.
}
