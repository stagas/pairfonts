import { createRoot } from 'react-dom/client'
import FontList from './FontList.tsx'
import { ThemeProvider } from './themeContext.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <FontList />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('app')!).render(<App />)
