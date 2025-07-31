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

function fuzzySearch(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true

  const normalizedText = text.toLowerCase()
  const normalizedSearch = searchTerm.toLowerCase()

  let searchIndex = 0
  for (let i = 0; i < normalizedText.length && searchIndex < normalizedSearch.length; i++) {
    if (normalizedText[i] === normalizedSearch[searchIndex]) {
      searchIndex++
    }
  }

  return searchIndex === normalizedSearch.length
}

function filterFontsBySearch(
  fonts: Array<
    { family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }
  >,
  searchTerm: string,
): Array<{ family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }> {
  if (!searchTerm.trim()) return fonts

  return fonts.filter(font => {
    // Search in font family name
    if (fuzzySearch(font.family, searchTerm)) return true

    // Search in category
    if (fuzzySearch(font.category, searchTerm)) return true

    // Search in variants
    if (font.variants.some(variant => fuzzySearch(variant, searchTerm))) return true

    // Search in subsets
    if (font.subsets.some(subset => fuzzySearch(subset, searchTerm))) return true

    return false
  })
}

export { fetchWebFonts, filterFontsBySearch, fuzzySearch, groupFontsByCategory }
export type { FontCategory, WebFont }
