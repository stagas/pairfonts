interface FontFile {
  [key: string]: string
}

interface WebFont {
  family: string
  variants: string[]
  subsets: string[]
  version: string
  lastModified: string
  files: FontFile
  category: string
  kind: string
  menu: string
}

interface WebFontsResponse {
  kind: string
  items: WebFont[]
}

interface FontCategory {
  name: string
  fonts: WebFont[]
}

async function fetchWebFonts(): Promise<WebFont[]> {
  try {
    const response = await fetch('/webfonts.json')
    const data: WebFontsResponse = await response.json()
    return data.items
  }
  catch (error) {
    console.error('Error fetching webfonts:', error)
    return []
  }
}

function groupFontsByCategory(fonts: WebFont[]): FontCategory[] {
  const categories: { [key: string]: WebFont[] } = {}

  fonts.forEach(font => {
    const category = font.category
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(font)
  })

  return Object.entries(categories)
    .map(([name, fonts]) => ({ name, fonts }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export { fetchWebFonts, groupFontsByCategory }
export type { FontCategory, WebFont }
