import { useCallback, useEffect, useMemo, useState } from 'react'
import { filterFontsBySearch, type FontCategory } from './fontUtils.ts'

// Reusable Font List Component
interface FontListProps {
  title: string
  fonts: Array<
    { family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }
  >
  allFonts: Array<
    { family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }
  >
  categories: FontCategory[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedFont: string
  onFontSelect: (fontFamily: string, index: number) => void
  focusIndex: number
  onFocusChange: (index: number) => void
  loadedFonts: Set<string>
  isLoadingMore: boolean
  hasMore: boolean
  dataAttribute: string
  onLoadFonts?: (fonts: Array<{ family: string; files: Record<string, string> }>) => void
  onScroll?: () => void
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

export function FontList({
  title,
  fonts,
  allFonts,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedFont,
  onFontSelect,
  focusIndex,
  onFocusChange,
  loadedFonts,
  isLoadingMore,
  hasMore,
  dataAttribute,
  onLoadFonts,
  onScroll,
  scrollContainerRef,
}: FontListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFonts = useMemo(() => {
    // Only search if we have 3 or more characters
    if (searchTerm.length < 3) {
      return fonts
    }

    // Search across all fonts, not just the current category
    return filterFontsBySearch(allFonts, searchTerm)
  }, [fonts, allFonts, searchTerm])

  // Debounced font loading to prevent excessive requests
  const debouncedLoadFonts = useCallback(() => {
    if (searchTerm.length >= 3 && onLoadFonts) {
      const unloadedFonts = filteredFonts.filter(font => !loadedFonts.has(font.family))
      if (unloadedFonts.length > 0) {
        onLoadFonts(unloadedFonts)
      }
    }
  }, [filteredFonts, loadedFonts, searchTerm, onLoadFonts])

  // Load fonts that appear in search results but aren't loaded yet
  useEffect(() => {
    const timeoutId = setTimeout(debouncedLoadFonts, 300) // 300ms debounce
    return () => clearTimeout(timeoutId)
  }, [debouncedLoadFonts])

  const isSearching = searchTerm.length >= 3
  const totalFontsInCategory = categories.find(cat => cat.name === selectedCategory)?.fonts.length || 0

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">{title}</h3>

        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search fonts... (min 3 chars)"
            value={searchTerm}
            spellCheck="false"
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              // Prevent keyboard shortcuts from bubbling up when input is focused
              e.stopPropagation()
            }}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200 dark:placeholder-neutral-400"
          />
        </div>

        {/* Category Selector */}
        <div className="flex flex-wrap gap-1 mb-2">
          {categories.map(category => (
            <button
              key={`${title}-${category.name}`}
              onClick={() => onCategoryChange(category.name)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              {category.name.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {isSearching
            ? (
              <>
                Found {filteredFonts.length} fonts matching "{searchTerm}" across all categories
              </>
            )
            : (
              <>
                Showing {filteredFonts.length} of {totalFontsInCategory} fonts
              </>
            )}
        </div>
      </div>

      {/* Fonts Display - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-1 overflow-y-auto min-h-0"
        onScroll={onScroll}
      >
        {filteredFonts.map((font, index) => {
          const isFontLoaded = loadedFonts.has(font.family)
          const isSelected = font.family === selectedFont
          const isFocused = index === focusIndex

          return (
            <div
              key={`${title}-${font.family}`}
              data-font-index={index}
              data-list-type={dataAttribute}
              className={`rounded p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-500'
                  : isFocused
                  ? 'bg-neutral-200 border-neutral-400 dark:bg-neutral-700 dark:border-neutral-500'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600'
              }`}
              onClick={() => onFontSelect(font.family, index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div
                    className={`text-base font-medium ${isFontLoaded ? `font-['${font.family}']` : ''}`}
                    style={{
                      fontFamily: isFontLoaded ? `'${font.family}', sans-serif` : 'inherit',
                    }}
                  >
                    {font.family}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    {font.variants.length} variants • {font.subsets.slice(0, 2).join(', ')}
                    {font.subsets.length > 2 && '...'}
                    {isSearching && font.category !== selectedCategory && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        • {font.category}
                      </span>
                    )}
                  </div>
                </div>
                {!isFontLoaded && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                    Loading...
                  </div>
                )}
                {isSelected && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                    Selected
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* No results message */}
        {filteredFonts.length === 0 && isSearching && (
          <div className="text-center text-neutral-600 dark:text-neutral-400 text-sm py-8">
            <p>No fonts found matching "{searchTerm}"</p>
          </div>
        )}

        {/* Loading indicator - only show when not searching */}
        {isLoadingMore && !isSearching && (
          <div className="flex justify-center py-2">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Loading more fonts...</div>
          </div>
        )}

        {/* End of list indicator - only show when not searching */}
        {!hasMore && filteredFonts.length > 0 && !isSearching && (
          <div className="text-center text-neutral-600 dark:text-neutral-400 text-sm py-2">
            <p>You've reached the end of the {selectedCategory.replace('-', ' ')} fonts</p>
          </div>
        )}
      </div>
    </div>
  )
}
