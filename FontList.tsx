import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWebFonts, type FontCategory, groupFontsByCategory } from './fontUtils.ts'

// Reusable Font List Component
interface FontListComponentProps {
  title: string
  fonts: Array<
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
  lastFontRef: (node: HTMLDivElement | null) => void
  dataAttribute: string
}

function FontListComponent({
  title,
  fonts,
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
  lastFontRef,
  dataAttribute,
}: FontListComponentProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">{title}</h3>
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
          Showing {fonts.length} of {categories.find(cat => cat.name === selectedCategory)?.fonts.length || 0} fonts
        </div>
      </div>

      {/* Fonts Display - Scrollable */}
      <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
        {fonts.map((font, index) => {
          const isLastFont = index === fonts.length - 1
          const isFontLoaded = loadedFonts.has(font.family)
          const isSelected = font.family === selectedFont
          const isFocused = index === focusIndex

          return (
            <div
              key={`${title}-${font.family}`}
              ref={isLastFont ? lastFontRef : null}
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

        {/* Loading indicator - inside scrollable area */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm">Loading more fonts...</div>
          </div>
        )}

        {/* End of list indicator - inside scrollable area */}
        {!hasMore && fonts.length > 0 && (
          <div className="text-center text-neutral-600 dark:text-neutral-400 text-sm py-2">
            <p>You've reached the end of the {selectedCategory.replace('-', ' ')} fonts</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FontList() {
  const [categories, setCategories] = useState<FontCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHeadingCategory, setSelectedHeadingCategory] = useState<string>(() => {
    return localStorage.getItem('fontpairs-heading-category') || ''
  })
  const [selectedBodyCategory, setSelectedBodyCategory] = useState<string>(() => {
    return localStorage.getItem('fontpairs-body-category') || ''
  })
  const [displayedHeadingFonts, setDisplayedHeadingFonts] = useState<
    Array<{ family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }>
  >([])
  const [displayedBodyFonts, setDisplayedBodyFonts] = useState<
    Array<{ family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }>
  >([])
  const [hasMoreHeading, setHasMoreHeading] = useState(true)
  const [hasMoreBody, setHasMoreBody] = useState(true)
  const [isLoadingMoreHeading, setIsLoadingMoreHeading] = useState(false)
  const [isLoadingMoreBody, setIsLoadingMoreBody] = useState(false)
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [selectedHeadingFont, setSelectedHeadingFont] = useState<string>(() => {
    return localStorage.getItem('fontpairs-heading-font') || ''
  })
  const [selectedBodyFont, setSelectedBodyFont] = useState<string>(() => {
    return localStorage.getItem('fontpairs-body-font') || ''
  })
  const [headingFocusIndex, setHeadingFocusIndex] = useState<number>(-1)
  const [bodyFocusIndex, setBodyFocusIndex] = useState<number>(-1)
  const [hasRestoredHeading, setHasRestoredHeading] = useState(false)
  const [hasRestoredBody, setHasRestoredBody] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const fontsPerLoad = 20
  const headingObserverRef = useRef<IntersectionObserver | null>(null)
  const bodyObserverRef = useRef<IntersectionObserver | null>(null)

  // Function to load a Google Font
  const loadGoogleFont = useCallback(async (fontFamily: string, fontFiles: Record<string, string>) => {
    if (loadedFonts.has(fontFamily)) return

    try {
      // Use the regular variant if available, otherwise use the first available variant
      const fontUrl = fontFiles.regular || fontFiles['400'] || Object.values(fontFiles)[0]

      if (fontUrl) {
        // Create a style element with @font-face declaration
        const style = document.createElement('style')
        style.textContent = `
          @font-face {
            font-family: '${fontFamily}';
            src: url('${fontUrl}') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `
        document.head.appendChild(style)
        setLoadedFonts(prev => new Set([...prev, fontFamily]))
      }
    }
    catch (err) {
      console.error(`Failed to load font ${fontFamily}:`, err)
    }
  }, [loadedFonts])

  // Function to load multiple fonts
  const loadFonts = useCallback(async (fonts: Array<{ family: string; files: Record<string, string> }>) => {
    const loadPromises = fonts.map(font => loadGoogleFont(font.family, font.files))
    await Promise.allSettled(loadPromises)
  }, [loadGoogleFont])

  useEffect(() => {
    async function loadFonts() {
      try {
        setLoading(true)
        const fonts = await fetchWebFonts()
        const groupedFonts = groupFontsByCategory(fonts)
        setCategories(groupedFonts)
        // Set the first category as default for both lists only if no saved categories
        if (groupedFonts.length > 0) {
          const savedHeadingCategory = localStorage.getItem('fontpairs-heading-category')
          const savedBodyCategory = localStorage.getItem('fontpairs-body-category')

          if (!savedHeadingCategory) {
            setSelectedHeadingCategory(groupedFonts[0].name)
          }
          if (!savedBodyCategory) {
            setSelectedBodyCategory(groupedFonts[0].name)
          }
        }
      }
      catch (err) {
        setError('Failed to load fonts')
        console.error(err)
      }
      finally {
        setLoading(false)
      }
    }

    loadFonts()
  }, [])

  // Reset displayed heading fonts when heading category changes
  useEffect(() => {
    if (selectedHeadingCategory) {
      // Clear the current observer
      if (headingObserverRef.current) {
        headingObserverRef.current.disconnect()
        headingObserverRef.current = null
      }

      // Reset state for new category
      setDisplayedHeadingFonts([])
      setHasMoreHeading(true)
      setIsLoadingMoreHeading(false)
      setHasRestoredHeading(false)

      // Use setTimeout to ensure state is cleared before setting new fonts
      setTimeout(() => {
        const category = categories.find(cat => cat.name === selectedHeadingCategory)
        if (category) {
          const initialFonts = category.fonts.slice(0, fontsPerLoad)
          setDisplayedHeadingFonts(initialFonts)
          setHasMoreHeading(category.fonts.length > fontsPerLoad)

          // Load the initial fonts
          loadFonts(initialFonts)
        }
      }, 0)
    }
  }, [selectedHeadingCategory, categories])

  // Reset displayed body fonts when body category changes
  useEffect(() => {
    if (selectedBodyCategory) {
      // Clear the current observer
      if (bodyObserverRef.current) {
        bodyObserverRef.current.disconnect()
        bodyObserverRef.current = null
      }

      // Reset state for new category
      setDisplayedBodyFonts([])
      setHasMoreBody(true)
      setIsLoadingMoreBody(false)
      setHasRestoredBody(false)

      // Use setTimeout to ensure state is cleared before setting new fonts
      setTimeout(() => {
        const category = categories.find(cat => cat.name === selectedBodyCategory)
        if (category) {
          const initialFonts = category.fonts.slice(0, fontsPerLoad)
          setDisplayedBodyFonts(initialFonts)
          setHasMoreBody(category.fonts.length > fontsPerLoad)

          // Load the initial fonts
          loadFonts(initialFonts)
        }
      }, 0)
    }
  }, [selectedBodyCategory, categories])

  // Intersection Observer for heading fonts infinite scroll
  const lastHeadingFontRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMoreHeading) return

    if (headingObserverRef.current) headingObserverRef.current.disconnect()

    headingObserverRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreHeading) {
        loadMoreHeadingFonts()
      }
    })

    if (node) headingObserverRef.current.observe(node)
  }, [isLoadingMoreHeading, hasMoreHeading])

  // Intersection Observer for body fonts infinite scroll
  const lastBodyFontRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMoreBody) return

    if (bodyObserverRef.current) bodyObserverRef.current.disconnect()

    bodyObserverRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreBody) {
        loadMoreBodyFonts()
      }
    })

    if (node) bodyObserverRef.current.observe(node)
  }, [isLoadingMoreBody, hasMoreBody])

  const loadMoreHeadingFonts = useCallback(() => {
    if (isLoadingMoreHeading || !hasMoreHeading) return

    setIsLoadingMoreHeading(true)

    setTimeout(async () => {
      const category = categories.find(cat => cat.name === selectedHeadingCategory)
      if (category) {
        const currentCount = displayedHeadingFonts.length
        const newFonts = category.fonts.slice(currentCount, currentCount + fontsPerLoad)

        setDisplayedHeadingFonts(prev => [...prev, ...newFonts])
        setHasMoreHeading(currentCount + fontsPerLoad < category.fonts.length)

        // Load the new fonts
        await loadFonts(newFonts)
      }

      setIsLoadingMoreHeading(false)
    }, 300)
  }, [isLoadingMoreHeading, hasMoreHeading, categories, selectedHeadingCategory, displayedHeadingFonts.length,
    loadFonts])

  const loadMoreBodyFonts = useCallback(() => {
    if (isLoadingMoreBody || !hasMoreBody) return

    setIsLoadingMoreBody(true)

    setTimeout(async () => {
      const category = categories.find(cat => cat.name === selectedBodyCategory)
      if (category) {
        const currentCount = displayedBodyFonts.length
        const newFonts = category.fonts.slice(currentCount, currentCount + fontsPerLoad)

        setDisplayedBodyFonts(prev => [...prev, ...newFonts])
        setHasMoreBody(currentCount + fontsPerLoad < category.fonts.length)

        // Load the new fonts
        await loadFonts(newFonts)
      }

      setIsLoadingMoreBody(false)
    }, 300)
  }, [isLoadingMoreBody, hasMoreBody, categories, selectedBodyCategory, displayedBodyFonts.length, loadFonts])

  // Save selections to localStorage
  useEffect(() => {
    if (selectedHeadingCategory) {
      localStorage.setItem('fontpairs-heading-category', selectedHeadingCategory)
      console.log('Saved heading category:', selectedHeadingCategory)
    }
  }, [selectedHeadingCategory])

  useEffect(() => {
    if (selectedBodyCategory) {
      localStorage.setItem('fontpairs-body-category', selectedBodyCategory)
      console.log('Saved body category:', selectedBodyCategory)
    }
  }, [selectedBodyCategory])

  useEffect(() => {
    if (selectedHeadingFont) {
      localStorage.setItem('fontpairs-heading-font', selectedHeadingFont)
      console.log('Saved heading font:', selectedHeadingFont)
    }
  }, [selectedHeadingFont])

  useEffect(() => {
    if (selectedBodyFont) {
      localStorage.setItem('fontpairs-body-font', selectedBodyFont)
      console.log('Saved body font:', selectedBodyFont)
    }
  }, [selectedBodyFont])

  // Find which category contains a specific font
  const findFontCategory = useCallback((fontFamily: string) => {
    for (const category of categories) {
      const found = category.fonts.find(font => font.family === fontFamily)
      if (found) {
        return category.name
      }
    }
    return null
  }, [categories])

  // Restore saved selections and scroll to saved fonts
  useEffect(() => {
    if (categories.length > 0 && isInitialLoad) {
      const savedHeadingFont = localStorage.getItem('fontpairs-heading-font')
      const savedBodyFont = localStorage.getItem('fontpairs-body-font')

      // Only auto-switch categories on initial load, not on manual changes
      if (savedHeadingFont && !hasRestoredHeading) {
        const currentCategory = selectedHeadingCategory
        const fontCategory = findFontCategory(savedHeadingFont)

        if (fontCategory && fontCategory !== currentCategory) {
          setSelectedHeadingCategory(fontCategory)
        }
      }

      if (savedBodyFont && !hasRestoredBody) {
        const currentCategory = selectedBodyCategory
        const fontCategory = findFontCategory(savedBodyFont)

        if (fontCategory && fontCategory !== currentCategory) {
          setSelectedBodyCategory(fontCategory)
        }
      }

      // Mark initial load as complete
      setIsInitialLoad(false)
    }
  }, [categories, findFontCategory, selectedHeadingCategory, selectedBodyCategory, hasRestoredHeading, hasRestoredBody,
    isInitialLoad])

  // Scroll to saved fonts after fonts are loaded (only once)
  useEffect(() => {
    if (displayedHeadingFonts.length > 0 && !hasRestoredHeading) {
      const savedHeadingFont = localStorage.getItem('fontpairs-heading-font')

      if (savedHeadingFont) {
        const headingIndex = displayedHeadingFonts.findIndex(font => font.family === savedHeadingFont)
        if (headingIndex !== -1) {
          setHeadingFocusIndex(headingIndex)
          setHasRestoredHeading(true)
          setTimeout(() => {
            const headingFontElements = document.querySelectorAll('[data-list-type="heading"]')
            const targetElement = headingFontElements[headingIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
        else if (hasMoreHeading && !isLoadingMoreHeading) {
          // Font not found in current batch, load more fonts
          loadMoreHeadingFonts()
        }
        else if (!hasMoreHeading) {
          // No more fonts to load and font not found, give up
          setHasRestoredHeading(true)
        }
      }
      else {
        setHasRestoredHeading(true)
      }
    }
  }, [displayedHeadingFonts, hasRestoredHeading, hasMoreHeading, isLoadingMoreHeading])

  useEffect(() => {
    if (displayedBodyFonts.length > 0 && !hasRestoredBody) {
      const savedBodyFont = localStorage.getItem('fontpairs-body-font')

      if (savedBodyFont) {
        const bodyIndex = displayedBodyFonts.findIndex(font => font.family === savedBodyFont)
        if (bodyIndex !== -1) {
          setBodyFocusIndex(bodyIndex)
          setHasRestoredBody(true)
          setTimeout(() => {
            const bodyFontElements = document.querySelectorAll('[data-list-type="body"]')
            const targetElement = bodyFontElements[bodyIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
        else if (hasMoreBody && !isLoadingMoreBody) {
          // Font not found in current batch, load more fonts
          loadMoreBodyFonts()
        }
        else if (!hasMoreBody) {
          // No more fonts to load and font not found, give up
          setHasRestoredBody(true)
        }
      }
      else {
        setHasRestoredBody(true)
      }
    }
  }, [displayedBodyFonts, hasRestoredBody, hasMoreBody, isLoadingMoreBody])

  // Set up keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [bodyFocusIndex, headingFocusIndex, displayedBodyFonts, displayedHeadingFonts])

  const handleHeadingFontClick = (fontFamily: string, index: number) => {
    setSelectedHeadingFont(fontFamily)
    setHeadingFocusIndex(index)
  }

  const handleBodyFontClick = (fontFamily: string, index: number) => {
    setSelectedBodyFont(fontFamily)
    setBodyFocusIndex(index)
  }

  const handleHeadingCategoryChange = (category: string) => {
    setSelectedHeadingCategory(category)
  }

  const handleBodyCategoryChange = (category: string) => {
    setSelectedBodyCategory(category)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    // Body fonts navigation with arrow keys
    if (event.key === 'e' || event.key === 'd') {
      event.preventDefault()
      const currentIndex = bodyFocusIndex
      const maxIndex = displayedBodyFonts.length - 1

      if (event.key === 'e') {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
        if (newIndex !== currentIndex) {
          setBodyFocusIndex(newIndex)
          setSelectedBodyFont(displayedBodyFonts[newIndex]?.family || '')
          // Scroll the focused item into view
          setTimeout(() => {
            const bodyFontElements = document.querySelectorAll('[data-list-type="body"]')
            const targetElement = bodyFontElements[newIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 0)
        }
      }
      else {
        const newIndex = currentIndex < maxIndex ? currentIndex + 1 : currentIndex
        if (newIndex !== currentIndex) {
          setBodyFocusIndex(newIndex)
          setSelectedBodyFont(displayedBodyFonts[newIndex]?.family || '')
          // Scroll the focused item into view
          setTimeout(() => {
            const bodyFontElements = document.querySelectorAll('[data-list-type="body"]')
            const targetElement = bodyFontElements[newIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 0)
        }
      }
    }

    // Heading fonts navigation with W/S keys
    if (event.key === 'w' || event.key === 's') {
      event.preventDefault()
      const currentIndex = headingFocusIndex
      const maxIndex = displayedHeadingFonts.length - 1

      if (event.key === 'w') {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
        if (newIndex !== currentIndex) {
          setHeadingFocusIndex(newIndex)
          setSelectedHeadingFont(displayedHeadingFonts[newIndex]?.family || '')
          // Scroll the focused item into view
          setTimeout(() => {
            const headingFontElements = document.querySelectorAll('[data-list-type="heading"]')
            const targetElement = headingFontElements[newIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 0)
        }
      }
      else {
        const newIndex = currentIndex < maxIndex ? currentIndex + 1 : currentIndex
        if (newIndex !== currentIndex) {
          setHeadingFocusIndex(newIndex)
          setSelectedHeadingFont(displayedHeadingFonts[newIndex]?.family || '')
          // Scroll the focused item into view
          setTimeout(() => {
            const headingFontElements = document.querySelectorAll('[data-list-type="heading"]')
            const targetElement = headingFontElements[newIndex] as HTMLElement
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 0)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-xl text-neutral-900 dark:text-neutral-100">Loading fonts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full p-4 overflow-hidden">
        {/* Left Column - Sample Text */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start max-h-full overflow-y-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Sample Text</h2>

            {/* Font Selection Status */}
            <div className="mb-4 space-y-2">
              <div className="text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Heading Font:</span>
                <span className={selectedHeadingFont
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-neutral-500 dark:text-neutral-400'}
                >
                  {selectedHeadingFont || 'Not selected'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Body Font:</span>
                <span className={selectedBodyFont
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-neutral-500 dark:text-neutral-400'}
                >
                  {selectedBodyFont || 'Not selected'}
                </span>
              </div>
            </div>

            {/* Sample Heading */}
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                fontFamily: selectedHeadingFont ? `'${selectedHeadingFont}', sans-serif` : 'inherit',
              }}
            >
              The Quick Brown Fox Jumps Over The Lazy Dog
            </h3>

            {/* Sample Paragraph */}
            <p
              className="text-base leading-relaxed"
              style={{
                fontFamily: selectedBodyFont ? `'${selectedBodyFont}', sans-serif` : 'inherit',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">How to Use</h3>
            <ol className="text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
              <li>1. Click a font in the "Heading Fonts" list to select it</li>
              <li>2. Click a font in the "Body Fonts" list to select it</li>
              <li>3. Use W/S keys to navigate heading fonts</li>
              <li>4. Use E/D arrow keys to navigate body fonts</li>
              <li>5. See how they look together in the sample text</li>
            </ol>
          </div>
        </div>

        {/* Middle Column - Heading Fonts */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <FontListComponent
            title="Heading Fonts"
            fonts={displayedHeadingFonts}
            categories={categories}
            selectedCategory={selectedHeadingCategory}
            onCategoryChange={handleHeadingCategoryChange}
            selectedFont={selectedHeadingFont}
            onFontSelect={handleHeadingFontClick}
            focusIndex={headingFocusIndex}
            onFocusChange={setHeadingFocusIndex}
            loadedFonts={loadedFonts}
            isLoadingMore={isLoadingMoreHeading}
            hasMore={hasMoreHeading}
            lastFontRef={lastHeadingFontRef}
            dataAttribute="heading"
          />
        </div>

        {/* Right Column - Body Fonts */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <FontListComponent
            title="Body Fonts"
            fonts={displayedBodyFonts}
            categories={categories}
            selectedCategory={selectedBodyCategory}
            onCategoryChange={handleBodyCategoryChange}
            selectedFont={selectedBodyFont}
            onFontSelect={handleBodyFontClick}
            focusIndex={bodyFocusIndex}
            onFocusChange={setBodyFocusIndex}
            loadedFonts={loadedFonts}
            isLoadingMore={isLoadingMoreBody}
            hasMore={hasMoreBody}
            lastFontRef={lastBodyFontRef}
            dataAttribute="body"
          />
        </div>
      </div>
    </div>
  )
}

export default FontList
