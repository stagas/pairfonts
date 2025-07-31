import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('fontpairs-theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    return 'dark'
  })

  // Initialize theme on mount
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    }
    else {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    }
    else {
      root.classList.remove('dark')
    }
    localStorage.setItem('fontpairs-theme', theme)

    // Update favicon based on theme
    const faviconColor = theme === 'dark' ? 'white' : 'black'
    const faviconSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90" fill="${faviconColor}">🗛</text></svg>`
    const faviconUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`

    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (faviconLink) {
      faviconLink.href = faviconUrl
    }
  }, [theme])

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
