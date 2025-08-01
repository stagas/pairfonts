import { createRoot } from 'react-dom/client'
import { PairFontsPage } from './PairFontsPage.tsx'
import { ThemeProvider } from './themeContext.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <PairFontsPage />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('app')!).render(<App />)
