import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { FabricImage, Textbox, loadSVGFromString, util } from 'fabric'
import { CanvasSettings } from './CanvasSettings'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { createCircleFrame, getDefaultFrameRadius } from '../../utils/circleFrame'
import { SVG_GRAPHICS, SVG_CATEGORIES, type SvgGraphic } from '../../data/svgGraphics'
import {
  ICONIFY_CATEGORIES,
  fetchIconifySvg,
  searchIconify,
  type IconifyIconDef,
  type IconifySearchResult,
} from '../../data/iconifyIcons'
import { Icon } from '@iconify/react'

const tools = [
  { id: 'select', label: 'Select', icon: '↖️' },
  { id: 'rect', label: 'Rectangle', icon: '⬜' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'image', label: 'Image', icon: '🖼️' },
] as const

const frames = [
  { id: 'circleFrame', label: 'Circle Frame', icon: '⬤' },
] as const

// Text element type definitions
interface TextTypeConfig {
  id: string
  label: string
  icon: string
  defaults: {
    text: string
    fontSize: number
    fontWeight: string
    fontStyle?: string
    fontFamily: string
    width: number
    textAlign?: string
  }
}

// Text sizes increased by 5x from original values
const TEXT_TYPES: TextTypeConfig[] = [
  {
    id: 'heading',
    label: 'Add Heading',
    icon: 'H1',
    defaults: {
      text: 'Heading',
      fontSize: 360, // 72 * 5
      fontWeight: 'bold',
      fontFamily: 'Arial',
      width: 1000, // 200 * 5
    },
  },
  {
    id: 'subheading',
    label: 'Add Subheading',
    icon: 'H2',
    defaults: {
      text: 'Subheading',
      fontSize: 240, // 48 * 5
      fontWeight: 'bold',
      fontFamily: 'Arial',
      width: 750, // 150 * 5
    },
  },
  {
    id: 'body',
    label: 'Add Body Text',
    icon: 'P',
    defaults: {
      text: 'Body text',
      fontSize: 120, // 24 * 5
      fontWeight: 'normal',
      fontFamily: 'Arial',
      width: 500, // 100 * 5
    },
  },
  {
    id: 'caption',
    label: 'Add Caption',
    icon: 'C',
    defaults: {
      text: 'Caption',
      fontSize: 80, // 16 * 5
      fontWeight: 'normal',
      fontStyle: 'italic',
      fontFamily: 'Arial',
      width: 500, // 100 * 5
    },
  },
  {
    id: 'multiline',
    label: 'Multi-line Text',
    icon: '¶',
    defaults: {
      text: 'Add your multi-line text here.\nLine 2\nLine 3',
      fontSize: 120, // 24 * 5
      fontWeight: 'normal',
      fontFamily: 'Arial',
      width: 1500, // 300 * 5
      textAlign: 'left',
    },
  },
]

interface AssetsPanelProps {
  dimensions: { width: number; height: number }
  onDimensionsChange: (width: number, height: number) => void
  onSaveRequest?: (newWidth: number, newHeight: number) => void
}

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function AssetsPanel({ dimensions, onDimensionsChange, onSaveRequest }: AssetsPanelProps) {
  const { activeTool, setActiveTool } = useEditorStore()
  const { canvas, setSelectedObject } = useCanvasStore()
  const { setDirty } = useEditorStore()
  
  // SVG category state (for custom SVGs)
  const [selectedSvgCategory, setSelectedSvgCategory] = useState<string>('shapes')
  
  // Iconify state
  const [selectedIconifyCategory, setSelectedIconifyCategory] = useState<string>('decorative')
  const [iconSearchQuery, setIconSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingIcons, setLoadingIcons] = useState<Set<string>>(new Set())
  
  const debouncedSearchQuery = useDebounce(iconSearchQuery, 300)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([])
        setSearchError(null)
        return
      }

      setIsSearching(true)
      setSearchError(null)

      try {
        const result: IconifySearchResult = await searchIconify(debouncedSearchQuery, 48)
        setSearchResults(result.icons)
      } catch (error) {
        console.error('Icon search failed:', error)
        setSearchError('Search failed. Please try again.')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearchQuery])

  // Handler for adding SVG graphics to the canvas (custom SVGs)
  const handleAddSvg = async (svgGraphic: SvgGraphic) => {
    if (!canvas) return

    try {
      // Load SVG from string
      const result = await loadSVGFromString(svgGraphic.svg)
      
      // Filter out null values from objects array
      const validObjects = result.objects.filter((obj): obj is NonNullable<typeof obj> => obj !== null)
      
      if (validObjects.length > 0) {
        // Create a group from all SVG objects
        const group = util.groupSVGElements(validObjects, result.options)
        
        // Scale the SVG to a reasonable default size (200px)
        const targetSize = 200
        const currentWidth = group.width || 100
        const currentHeight = group.height || 100
        const scale = Math.min(targetSize / currentWidth, targetSize / currentHeight)
        group.scale(scale)
        
        // Position the SVG on canvas
        group.set({
          left: 100,
          top: 100,
          data: {
            svgId: svgGraphic.id,
            svgName: svgGraphic.name,
            type: 'svg-graphic',
          },
        })
        
        canvas.add(group)
        canvas.setActiveObject(group)
        setSelectedObject(group)
        canvas.requestRenderAll()
        setDirty(true)
      }
    } catch (error) {
      console.error('Failed to add SVG:', error)
    }
  }

  // Handler for adding Iconify icons to the canvas
  const handleAddIconifyIcon = useCallback(async (iconName: string) => {
    if (!canvas) return

    // Mark icon as loading
    setLoadingIcons(prev => new Set(prev).add(iconName))

    try {
      // Fetch SVG from Iconify API
      const svgString = await fetchIconifySvg(iconName)
      
      // Load SVG from string
      const result = await loadSVGFromString(svgString)
      
      // Filter out null values from objects array
      const validObjects = result.objects.filter((obj): obj is NonNullable<typeof obj> => obj !== null)
      
      if (validObjects.length > 0) {
        // Create a group from all SVG objects
        const group = util.groupSVGElements(validObjects, result.options)
        
        // Scale the SVG to a reasonable default size (200px)
        const targetSize = 200
        const currentWidth = group.width || 100
        const currentHeight = group.height || 100
        const scale = Math.min(targetSize / currentWidth, targetSize / currentHeight)
        group.scale(scale)
        
        // Position the SVG on canvas
        group.set({
          left: 100,
          top: 100,
          data: {
            iconifyName: iconName,
            type: 'iconify-icon',
          },
        })
        
        canvas.add(group)
        canvas.setActiveObject(group)
        setSelectedObject(group)
        canvas.requestRenderAll()
        setDirty(true)
      }
    } catch (error) {
      console.error('Failed to add Iconify icon:', error)
    } finally {
      // Remove from loading set
      setLoadingIcons(prev => {
        const next = new Set(prev)
        next.delete(iconName)
        return next
      })
    }
  }, [canvas, setSelectedObject, setDirty])

  // Get SVGs for the selected category (custom)
  const filteredSvgs = SVG_GRAPHICS.filter(svg => svg.category === selectedSvgCategory)

  // Get icons for the selected Iconify category
  const currentIconifyCategory = ICONIFY_CATEGORIES.find(cat => cat.id === selectedIconifyCategory)
  const curatedIcons = currentIconifyCategory?.icons || []

  // Handler for adding text with specific type configuration
  const handleAddText = (textType: TextTypeConfig) => {
    if (!canvas) return

    const textbox = new Textbox(textType.defaults.text, {
      left: 100,
      top: 100,
      fontSize: textType.defaults.fontSize,
      fontWeight: textType.defaults.fontWeight,
      fontStyle: textType.defaults.fontStyle || 'normal',
      fontFamily: textType.defaults.fontFamily,
      fill: '#000000',
      width: textType.defaults.width,
      textAlign: textType.defaults.textAlign || 'left',
      data: {
        textType: textType.id,
      },
    })

    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    setSelectedObject(textbox)
    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !canvas) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string
        const img = await FabricImage.fromURL(dataUrl)
        
        // Scale image to fit within canvas while maintaining aspect ratio
        const maxSize = 400
        const scale = Math.min(maxSize / img.width!, maxSize / img.height!)
        img.scale(scale)
        
        img.set({
          left: 100,
          top: 100,
        })
        
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.requestRenderAll()
        setDirty(true)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleToolClick = (toolId: string) => {
    if (toolId === 'image') {
      handleImageUpload()
    } else {
      setActiveTool(toolId as typeof activeTool)
    }
  }

  const handleAddCircleFrame = () => {
    if (!canvas) return
    // Use 20% of canvas width as the frame diameter
    const frameRadius = getDefaultFrameRadius(dimensions.width)
    // Center the frame in the visible canvas area
    const x = 100
    const y = 100
    const frame = createCircleFrame(canvas, x, y, frameRadius, dimensions.width)
    setSelectedObject(frame)
    setDirty(true)
  }

  // Check if we're showing search results
  const isShowingSearchResults = iconSearchQuery.trim().length > 0

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Canvas Settings at top */}
      <CanvasSettings
        width={dimensions.width}
        height={dimensions.height}
        onDimensionsChange={onDimensionsChange}
        onSaveRequest={onSaveRequest}
      />
      
      {/* Text Section */}
      <CollapsibleSection
        title="Text"
        storageKey="panelSection_text"
        defaultExpanded={true}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {TEXT_TYPES.map((textType) => (
            <button
              key={textType.id}
              onClick={() => handleAddText(textType)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700"
            >
              <span
                className="font-bold"
                style={{
                  fontStyle: textType.defaults.fontStyle || 'normal',
                  fontSize: textType.id === 'heading' ? '14px' :
                           textType.id === 'subheading' ? '12px' :
                           textType.id === 'body' ? '11px' : '10px',
                }}
              >
                {textType.icon}
              </span>
              <span className="text-[10px] text-center whitespace-nowrap">
                {textType.label.replace('Add ', '')}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Frames Section */}
      <CollapsibleSection
        title="Frames"
        storageKey="panelSection_frames"
        defaultExpanded={true}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {frames.map((frame) => (
            <button
              key={frame.id}
              onClick={handleAddCircleFrame}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700"
            >
              <span className="text-xl" style={{ color: '#999' }}>
                {frame.icon}
              </span>
              <span className="text-[10px] text-center whitespace-nowrap">
                {frame.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          Add a frame, then drop an image into it
        </p>
      </CollapsibleSection>
      
      {/* Iconify Icons Section */}
      <CollapsibleSection
        title="Icons Library (200+)"
        storageKey="panelSection_iconify"
        defaultExpanded={true}
      >
        {/* Search input */}
        <div className="mb-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={iconSearchQuery}
              onChange={(e) => setIconSearchQuery(e.target.value)}
              placeholder="Search 200,000+ icons..."
              className="w-full text-xs px-2 py-1.5 pr-8 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 placeholder-gray-400"
            />
            {iconSearchQuery && (
              <button
                onClick={() => {
                  setIconSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category selector (hidden when searching) */}
        {!isShowingSearchResults && (
          <div className="mb-2">
            <select
              value={selectedIconifyCategory}
              onChange={(e) => setSelectedIconifyCategory(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
            >
              {ICONIFY_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.icons.length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-4 text-gray-500">
            <Icon icon="mdi:loading" className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Searching...</span>
          </div>
        )}

        {/* Search error */}
        {searchError && (
          <div className="text-xs text-red-500 py-2 text-center">
            {searchError}
          </div>
        )}

        {/* Search results */}
        {isShowingSearchResults && !isSearching && (
          <>
            <div className="text-[10px] text-gray-500 mb-1">
              {searchResults.length} results for "{iconSearchQuery}"
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {searchResults.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => handleAddIconifyIcon(iconName)}
                    disabled={loadingIcons.has(iconName)}
                    className="aspect-square flex items-center justify-center p-1.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={iconName}
                  >
                    {loadingIcons.has(iconName) ? (
                      <Icon icon="mdi:loading" className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <Icon icon={iconName} className="w-6 h-6 text-gray-700" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-4 text-center">
                No icons found. Try a different search term.
              </div>
            )}
          </>
        )}

        {/* Curated icons grid (shown when not searching) */}
        {!isShowingSearchResults && !isSearching && (
          <div className="grid grid-cols-4 gap-1.5">
            {curatedIcons.map((icon: IconifyIconDef) => (
              <button
                key={icon.name}
                onClick={() => handleAddIconifyIcon(icon.name)}
                disabled={loadingIcons.has(icon.name)}
                className="aspect-square flex items-center justify-center p-1.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={icon.label}
              >
                {loadingIcons.has(icon.name) ? (
                  <Icon icon="mdi:loading" className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Icon icon={icon.name} className="w-6 h-6 text-gray-700" />
                )}
              </button>
            ))}
          </div>
        )}
        
        <p className="text-[10px] text-gray-400 mt-1.5">
          Click to add icon to canvas
        </p>
      </CollapsibleSection>
      
      {/* Custom SVG Graphics Section */}
      <CollapsibleSection
        title="Custom Graphics"
        storageKey="panelSection_svgGraphics"
        defaultExpanded={false}
      >
        {/* Category selector */}
        <div className="mb-2">
          <select
            value={selectedSvgCategory}
            onChange={(e) => setSelectedSvgCategory(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
          >
            {SVG_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* SVG grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {filteredSvgs.map((svg) => (
            <button
              key={svg.id}
              onClick={() => handleAddSvg(svg)}
              className="aspect-square flex items-center justify-center p-1.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title={svg.name}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svg.svg }}
              />
            </button>
          ))}
        </div>
        
        <p className="text-[10px] text-gray-400 mt-1.5">
          Click to add SVG to canvas
        </p>
      </CollapsibleSection>
      
      {/* Tools */}
      <CollapsibleSection
        title="Shapes & Tools"
        storageKey="panelSection_shapesTools"
        defaultExpanded={true}
        className="flex-1"
      >
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-base">{tool.icon}</span>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
