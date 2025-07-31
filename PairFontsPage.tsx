import { useCallback, useEffect, useRef, useState } from 'react'
import { FontList } from './FontList.tsx'
import { fetchWebFonts, type FontCategory, groupFontsByCategory } from './fontUtils.ts'

export function PairFontsPage() {
  const [categories, setCategories] = useState<FontCategory[]>([])
  const [allFonts, setAllFonts] = useState<
    Array<{ family: string; variants: string[]; subsets: string[]; category: string; files: Record<string, string> }>
  >([])
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
  const [isUserScrollingHeading, setIsUserScrollingHeading] = useState(false)
  const [isUserScrollingBody, setIsUserScrollingBody] = useState(false)
  const fontsPerLoad = 20
  const headingScrollContainerRef = useRef<HTMLDivElement>(null)
  const bodyScrollContainerRef = useRef<HTMLDivElement>(null)
  const headingScrollTimeoutRef = useRef<number | null>(null)
  const bodyScrollTimeoutRef = useRef<number | null>(null)

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
        setAllFonts(fonts) // Store all fonts for cross-category search
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
      const category = categories.find(cat => cat.name === selectedHeadingCategory)
      if (category) {
        const initialFonts = category.fonts.slice(0, fontsPerLoad)
        setDisplayedHeadingFonts(initialFonts)
        setHasMoreHeading(category.fonts.length > fontsPerLoad)
        setHasRestoredHeading(false)
        loadFonts(initialFonts)
      }
    }
  }, [selectedHeadingCategory, categories])

  // Reset displayed body fonts when body category changes
  useEffect(() => {
    if (selectedBodyCategory) {
      const category = categories.find(cat => cat.name === selectedBodyCategory)
      if (category) {
        const initialFonts = category.fonts.slice(0, fontsPerLoad)
        setDisplayedBodyFonts(initialFonts)
        setHasMoreBody(category.fonts.length > fontsPerLoad)
        setHasRestoredBody(false)
        loadFonts(initialFonts)
      }
    }
  }, [selectedBodyCategory, categories])

  const loadMoreHeadingFonts = useCallback(() => {
    if (isLoadingMoreHeading || !hasMoreHeading) return

    setIsLoadingMoreHeading(true)

    // Preserve scroll position before loading
    const scrollContainer = headingScrollContainerRef.current
    const scrollTop = scrollContainer?.scrollTop || 0

    setTimeout(async () => {
      const category = categories.find(cat => cat.name === selectedHeadingCategory)
      if (category) {
        const currentCount = displayedHeadingFonts.length
        const newFonts = category.fonts.slice(currentCount, currentCount + fontsPerLoad)

        setDisplayedHeadingFonts(prev => [...prev, ...newFonts])
        setHasMoreHeading(currentCount + fontsPerLoad < category.fonts.length)

        // Load the new fonts
        await loadFonts(newFonts)

        // Restore scroll position after fonts are loaded
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop
        }
      }

      setIsLoadingMoreHeading(false)
    }, 300)
  }, [isLoadingMoreHeading, hasMoreHeading, categories, selectedHeadingCategory, displayedHeadingFonts.length,
    loadFonts])

  const loadMoreBodyFonts = useCallback(() => {
    if (isLoadingMoreBody || !hasMoreBody) return

    setIsLoadingMoreBody(true)

    // Preserve scroll position before loading
    const scrollContainer = bodyScrollContainerRef.current
    const scrollTop = scrollContainer?.scrollTop || 0

    setTimeout(async () => {
      const category = categories.find(cat => cat.name === selectedBodyCategory)
      if (category) {
        const currentCount = displayedBodyFonts.length
        const newFonts = category.fonts.slice(currentCount, currentCount + fontsPerLoad)

        setDisplayedBodyFonts(prev => [...prev, ...newFonts])
        setHasMoreBody(currentCount + fontsPerLoad < category.fonts.length)

        // Load the new fonts
        await loadFonts(newFonts)

        // Restore scroll position after fonts are loaded
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop
        }
      }

      setIsLoadingMoreBody(false)
    }, 300)
  }, [isLoadingMoreBody, hasMoreBody, categories, selectedBodyCategory, displayedBodyFonts.length, loadFonts])

  // Simple scroll handler for heading fonts
  const handleHeadingScroll = useCallback(() => {
    if (!headingScrollContainerRef.current) return

    // Mark that user is actively scrolling
    setIsUserScrollingHeading(true)

    // Clear existing timeout
    if (headingScrollTimeoutRef.current) {
      clearTimeout(headingScrollTimeoutRef.current)
    }

    // Set timeout to mark scrolling as stopped after 150ms
    headingScrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrollingHeading(false)
    }, 150)

    // Check for lazy loading
    if (isLoadingMoreHeading || !hasMoreHeading) return

    const container = headingScrollContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container

    // Load more when user scrolls to within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreHeadingFonts()
    }
  }, [isLoadingMoreHeading, hasMoreHeading, loadMoreHeadingFonts])

  // Simple scroll handler for body fonts
  const handleBodyScroll = useCallback(() => {
    if (!bodyScrollContainerRef.current) return

    // Mark that user is actively scrolling
    setIsUserScrollingBody(true)

    // Clear existing timeout
    if (bodyScrollTimeoutRef.current) {
      clearTimeout(bodyScrollTimeoutRef.current)
    }

    // Set timeout to mark scrolling as stopped after 150ms
    bodyScrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrollingBody(false)
    }, 150)

    // Check for lazy loading
    if (isLoadingMoreBody || !hasMoreBody) return

    const container = bodyScrollContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container

    // Load more when user scrolls to within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreBodyFonts()
    }
  }, [isLoadingMoreBody, hasMoreBody, loadMoreBodyFonts])

  // Save selections to localStorage
  useEffect(() => {
    if (selectedHeadingCategory) {
      localStorage.setItem('fontpairs-heading-category', selectedHeadingCategory)
    }
  }, [selectedHeadingCategory])

  useEffect(() => {
    if (selectedBodyCategory) {
      localStorage.setItem('fontpairs-body-category', selectedBodyCategory)
    }
  }, [selectedBodyCategory])

  useEffect(() => {
    if (selectedHeadingFont) {
      localStorage.setItem('fontpairs-heading-font', selectedHeadingFont)
    }
  }, [selectedHeadingFont])

  useEffect(() => {
    if (selectedBodyFont) {
      localStorage.setItem('fontpairs-body-font', selectedBodyFont)
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

      // Don't mark initial load as complete here - wait until fonts are actually restored
    }
  }, [categories, findFontCategory, selectedHeadingCategory, selectedBodyCategory, hasRestoredHeading, hasRestoredBody,
    isInitialLoad])

  // Scroll to saved fonts after fonts are loaded (only once)
  useEffect(() => {
    if (displayedHeadingFonts.length > 0 && !hasRestoredHeading && isInitialLoad) {
      const savedHeadingFont = localStorage.getItem('fontpairs-heading-font')

      if (savedHeadingFont) {
        const headingIndex = displayedHeadingFonts.findIndex(font => font.family === savedHeadingFont)
        if (headingIndex !== -1) {
          setHeadingFocusIndex(headingIndex)
          setHasRestoredHeading(true)
          // Use a longer timeout to ensure DOM is fully rendered
          setTimeout(() => {
            // Only scroll into view if user is not actively scrolling
            if (!isUserScrollingHeading) {
              const headingFontElements = document.querySelectorAll('[data-list-type="heading"]')
              const targetElement = headingFontElements[headingIndex] as HTMLElement
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              else {
                // Fallback: try to find by font family name
                const fallbackElement = document.querySelector(
                  `[data-list-type="heading"][data-font-index="${headingIndex}"]`,
                ) as HTMLElement
                if (fallbackElement) {
                  fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }
            }
          }, 300)
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
  }, [displayedHeadingFonts, hasRestoredHeading, hasMoreHeading, isLoadingMoreHeading, isInitialLoad,
    isUserScrollingHeading, loadMoreHeadingFonts])

  useEffect(() => {
    if (displayedBodyFonts.length > 0 && !hasRestoredBody && isInitialLoad) {
      const savedBodyFont = localStorage.getItem('fontpairs-body-font')

      if (savedBodyFont) {
        const bodyIndex = displayedBodyFonts.findIndex(font => font.family === savedBodyFont)
        if (bodyIndex !== -1) {
          setBodyFocusIndex(bodyIndex)
          setHasRestoredBody(true)
          // Use a longer timeout to ensure DOM is fully rendered
          setTimeout(() => {
            // Only scroll into view if user is not actively scrolling
            if (!isUserScrollingBody) {
              const bodyFontElements = document.querySelectorAll('[data-list-type="body"]')
              const targetElement = bodyFontElements[bodyIndex] as HTMLElement
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              else {
                // Fallback: try to find by font family name
                const fallbackElement = document.querySelector(
                  `[data-list-type="body"][data-font-index="${bodyIndex}"]`,
                ) as HTMLElement
                if (fallbackElement) {
                  fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }
            }
          }, 300)
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
  }, [displayedBodyFonts, hasRestoredBody, hasMoreBody, isLoadingMoreBody, isInitialLoad, isUserScrollingBody,
    loadMoreBodyFonts])

  // Mark initial load as complete only after both fonts have been restored
  useEffect(() => {
    if (isInitialLoad && hasRestoredHeading && hasRestoredBody) {
      setIsInitialLoad(false)
    }
    // Also mark as complete if there are no saved fonts to restore
    else if (isInitialLoad && categories.length > 0) {
      const savedHeadingFont = localStorage.getItem('fontpairs-heading-font')
      const savedBodyFont = localStorage.getItem('fontpairs-body-font')
      if (!savedHeadingFont && !savedBodyFont) {
        setIsInitialLoad(false)
      }
    }
  }, [isInitialLoad, hasRestoredHeading, hasRestoredBody, categories.length])

  // Set up keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [bodyFocusIndex, headingFocusIndex, displayedBodyFonts, displayedHeadingFonts])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (headingScrollTimeoutRef.current) {
        clearTimeout(headingScrollTimeoutRef.current)
      }
      if (bodyScrollTimeoutRef.current) {
        clearTimeout(bodyScrollTimeoutRef.current)
      }
    }
  }, [])

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
                <span className="text-neutral-600 dark:text-neutral-400">Heading Font:{' '}</span>
                <span className={selectedHeadingFont
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-neutral-500 dark:text-neutral-400'}
                >
                  {selectedHeadingFont || 'Not selected'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Body Font:{' '}</span>
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
            </ol>
          </div>
        </div>

        {/* Middle Column - Heading Fonts */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <FontList
            title="Heading Fonts"
            fonts={displayedHeadingFonts}
            allFonts={allFonts}
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
            dataAttribute="heading"
            onLoadFonts={loadFonts}
            onScroll={handleHeadingScroll}
            scrollContainerRef={headingScrollContainerRef}
          />
        </div>

        {/* Right Column - Body Fonts */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <FontList
            title="Body Fonts"
            fonts={displayedBodyFonts}
            allFonts={allFonts}
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
            dataAttribute="body"
            onLoadFonts={loadFonts}
            onScroll={handleBodyScroll}
            scrollContainerRef={bodyScrollContainerRef}
          />
        </div>
      </div>
    </div>
  )
}
