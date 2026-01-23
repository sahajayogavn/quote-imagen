import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  GOOGLE_FONTS,
  FONT_CATEGORIES,
  type FontFamily,
  type FontCategoryId,
  loadGoogleFont,
  isFontLoaded,
  WEIGHT_LABELS,
} from '../../data/fonts'

interface FontPickerProps {
  isOpen: boolean
  onClose: () => void
  selectedFont: string
  selectedWeight: number
  onFontChange: (fontFamily: string) => void
  onWeightChange: (weight: number) => void
}

// Tab types
type TabType = 'font' | 'styles'

export function FontPicker({
  isOpen,
  onClose,
  selectedFont,
  selectedWeight,
  onFontChange,
  onWeightChange,
}: FontPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('font')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FontCategoryId>('all')
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set())
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = GOOGLE_FONTS

    // Filter by category
    if (categoryFilter !== 'all') {
      fonts = fonts.filter((font) => font.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      fonts = fonts.filter(
        (font) =>
          font.name.toLowerCase().includes(query) ||
          font.category.toLowerCase().includes(query)
      )
    }

    return fonts
  }, [searchQuery, categoryFilter])

  // Get the currently selected font object
  const selectedFontObj = useMemo(() => {
    return GOOGLE_FONTS.find((f) => f.name === selectedFont)
  }, [selectedFont])

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      // Delay to avoid immediate close
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCategoryDropdown(false)
      }
    }
    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryDropdown])

  // Load font for preview on hover or selection
  const handleLoadFont = useCallback(async (fontName: string) => {
    if (isFontLoaded(fontName) || loadingFonts.has(fontName)) {
      return
    }
    setLoadingFonts((prev) => new Set(prev).add(fontName))
    await loadGoogleFont(fontName)
    setLoadingFonts((prev) => {
      const next = new Set(prev)
      next.delete(fontName)
      return next
    })
  }, [loadingFonts])

  // Handle font selection
  const handleSelectFont = useCallback(
    async (font: FontFamily) => {
      await handleLoadFont(font.name)
      onFontChange(font.name)
      
      // If current weight is not available in new font, select closest available
      const availableWeights = font.weights.map((w) => w.value)
      if (!availableWeights.includes(selectedWeight)) {
        // Find closest weight
        const closestWeight = availableWeights.reduce((prev, curr) =>
          Math.abs(curr - selectedWeight) < Math.abs(prev - selectedWeight) ? curr : prev
        )
        onWeightChange(closestWeight)
      }
    },
    [handleLoadFont, onFontChange, onWeightChange, selectedWeight]
  )

  // Handle weight selection
  const handleSelectWeight = useCallback(
    (weight: number) => {
      onWeightChange(weight)
    },
    [onWeightChange]
  )

  // Preload visible fonts for preview
  useEffect(() => {
    // Load first 10 visible fonts for preview
    const fontsToLoad = filteredFonts.slice(0, 10)
    fontsToLoad.forEach((font) => {
      handleLoadFont(font.name)
    })
  }, [filteredFonts, handleLoadFont])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-[#2a2a2a] rounded-lg shadow-2xl w-[320px] max-h-[500px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-white text-sm font-medium">Font</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('font')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === 'font'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Font
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === 'styles'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Text styles
          </button>
        </div>

        {activeTab === 'font' ? (
          <>
            {/* Search Bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try 'Calligraphy' or 'Open Sans'"
                  className="w-full bg-[#3a3a3a] text-white text-xs px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Category Filter Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded transition-colors"
                  title="Filter by category"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-[#3a3a3a] border border-gray-600 rounded shadow-lg z-10 py-1 min-w-[140px]">
                    {FONT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategoryFilter(cat.id)
                          setShowCategoryDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          categoryFilter === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-[#4a4a4a]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category Badge (if filtered) */}
            {categoryFilter !== 'all' && (
              <div className="px-3 py-1.5 flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Showing:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-[10px]">
                  {FONT_CATEGORIES.find((c) => c.id === categoryFilter)?.label}
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            {/* Font List */}
            <div className="flex-1 overflow-y-auto max-h-[250px]">
              {filteredFonts.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-gray-500 text-xs">
                  No fonts found
                </div>
              ) : (
                <div className="py-1">
                  {filteredFonts.map((font) => {
                    const isSelected = font.name === selectedFont
                    const isLoading = loadingFonts.has(font.name)
                    const isLoaded = isFontLoaded(font.name)

                    return (
                      <button
                        key={font.name}
                        onClick={() => handleSelectFont(font)}
                        onMouseEnter={() => handleLoadFont(font.name)}
                        className={`w-full text-left px-4 py-2 transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-200 hover:bg-[#3a3a3a]'
                        }`}
                      >
                        <span
                          className="text-sm truncate"
                          style={{
                            fontFamily: isLoaded ? `"${font.name}", ${font.category}` : font.category,
                          }}
                        >
                          {font.name}
                        </span>
                        <span className="flex items-center gap-2">
                          {isLoading && (
                            <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          )}
                          <span
                            className={`text-[10px] ${
                              isSelected ? 'text-blue-200' : 'text-gray-500'
                            }`}
                          >
                            {font.category.replace('-', ' ')}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Weight Selection */}
            {selectedFontObj && (
              <div className="border-t border-gray-700">
                <div className="px-4 py-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Weight
                  </span>
                </div>
                <div className="px-3 pb-3 flex flex-wrap gap-1">
                  {selectedFontObj.weights.map((weight) => {
                    const isActive = weight.value === selectedWeight
                    return (
                      <button
                        key={weight.value}
                        onClick={() => handleSelectWeight(weight.value)}
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a] hover:text-white'
                        }`}
                        style={{
                          fontFamily: `"${selectedFont}", ${selectedFontObj.category}`,
                          fontWeight: weight.value,
                        }}
                      >
                        {weight.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          // Text Styles Tab (placeholder for future implementation)
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto mb-3 text-gray-500"
              >
                <path d="M4 7V4h16v3" />
                <path d="M9 20h6" />
                <path d="M12 4v16" />
              </svg>
              <p className="text-gray-400 text-xs">
                Text style presets coming soon
              </p>
              <p className="text-gray-500 text-[10px] mt-1">
                Save and apply text formatting combinations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Compact display component for the selected font (used in PropertiesPanel)
interface FontPickerButtonProps {
  fontFamily: string
  fontWeight: number
  onClick: () => void
}

export function FontPickerButton({
  fontFamily,
  fontWeight,
  onClick,
}: FontPickerButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load the font for display
  useEffect(() => {
    const load = async () => {
      await loadGoogleFont(fontFamily)
      setIsLoaded(isFontLoaded(fontFamily))
    }
    load()
  }, [fontFamily])

  const fontObj = GOOGLE_FONTS.find((f) => f.name === fontFamily)
  const weightLabel = WEIGHT_LABELS[fontWeight] || String(fontWeight)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded hover:border-gray-400 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <span
          className="block text-sm text-gray-800 truncate"
          style={{
            fontFamily: isLoaded
              ? `"${fontFamily}", ${fontObj?.category || 'sans-serif'}`
              : fontObj?.category || 'sans-serif',
            fontWeight: fontWeight,
          }}
        >
          {fontFamily}
        </span>
        <span className="text-[10px] text-gray-500">
          {weightLabel}
        </span>
      </div>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

export default FontPicker
