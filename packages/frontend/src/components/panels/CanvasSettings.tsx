import { useState, useRef, useEffect } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useEditorStore } from '../../stores/editorStore'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import type { FabricObject, Textbox } from 'fabric'

const PRESETS = [
  { label: 'Portrait (1080×1920)', width: 1080, height: 1920 },
  { label: 'Square (1080×1080)', width: 1080, height: 1080 },
  { label: 'Landscape (1920×1080)', width: 1920, height: 1080 },
  { label: 'Instagram Post (1080×1350)', width: 1080, height: 1350 },
  { label: 'Facebook Cover (820×312)', width: 820, height: 312 },
  { label: 'Custom', width: 0, height: 0 },
]

// Aspect ratio icons as inline SVG components
// All icons fit within a 24x20 viewBox for consistent sizing
const AspectRatioIcon = ({ preset }: { preset: typeof PRESETS[0] }) => {
  const containerHeight = 16
  const containerWidth = 24
  const strokeColor = '#6b7280' // gray-500
  const strokeWidth = 1.5

  // Calculate dimensions based on aspect ratio
  const getIconDimensions = () => {
    if (preset.label.includes('Custom')) {
      // Dashed rectangle for custom
      return { width: 14, height: 12, isDashed: true }
    }
    
    const aspectRatio = preset.width / preset.height
    
    if (aspectRatio > 1) {
      // Landscape orientation (wider than tall)
      const width = containerWidth - 4
      const height = Math.max(6, Math.round(width / aspectRatio))
      return { width: Math.min(width, containerWidth - 4), height: Math.min(height, containerHeight - 2), isDashed: false }
    } else if (aspectRatio < 1) {
      // Portrait orientation (taller than wide)
      const height = containerHeight - 2
      const width = Math.max(6, Math.round(height * aspectRatio))
      return { width: Math.min(width, containerWidth - 4), height: Math.min(height, containerHeight - 2), isDashed: false }
    } else {
      // Square (1:1)
      const size = containerHeight - 4
      return { width: size, height: size, isDashed: false }
    }
  }

  const { width, height, isDashed } = getIconDimensions()
  const x = (containerWidth - width) / 2
  const y = (containerHeight - height) / 2

  return (
    <svg
      width={containerWidth}
      height={containerHeight}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      className="flex-shrink-0"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? '2,2' : 'none'}
        rx={1}
      />
    </svg>
  )
}

interface CanvasSettingsProps {
  width: number
  height: number
  onDimensionsChange: (width: number, height: number) => void
  onSaveRequest?: (newWidth: number, newHeight: number) => void
}

export function CanvasSettings({ width, height, onDimensionsChange, onSaveRequest }: CanvasSettingsProps) {
  const { canvas } = useCanvasStore()
  const { setDirty } = useEditorStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentPreset = () => {
    const match = PRESETS.find((p) => p.width === width && p.height === height)
    return match || PRESETS[PRESETS.length - 1] // Custom
  }

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    if (preset.width > 0) {
      handleDimensionsChange(preset.width, preset.height)
    }
    setIsDropdownOpen(false)
  }

  const handleDimensionsChange = (newWidth: number, newHeight: number) => {
    if (!canvas) {
      onDimensionsChange(newWidth, newHeight)
      setDirty(true)
      return
    }

    // Feature 3: Proportional scaling of all elements
    const oldWidth = width
    const oldHeight = height
    
    // Calculate scale factors
    const scaleX = newWidth / oldWidth
    const scaleY = newHeight / oldHeight
    // Use uniform scale to maintain aspect ratio of elements
    const uniformScale = Math.min(scaleX, scaleY)
    
    // Scale all objects proportionally
    const objects = canvas.getObjects()
    objects.forEach((obj: FabricObject) => {
      // Scale position (use per-axis scaling for position to maintain relative placement)
      // Scale object size uniformly to maintain aspect ratio
      obj.set({
        left: (obj.left || 0) * scaleX,
        top: (obj.top || 0) * scaleY,
        scaleX: (obj.scaleX || 1) * uniformScale,
        scaleY: (obj.scaleY || 1) * uniformScale,
      })
      
      // For text objects, also scale fontSize proportionally
      if ((obj as Textbox).text !== undefined) {
        const textObj = obj as Textbox
        const currentFontSize = textObj.fontSize || 40
        textObj.set({
          fontSize: Math.round(currentFontSize * uniformScale),
          // Reset scaleX/Y for text since we adjusted fontSize directly
          scaleX: 1,
          scaleY: 1,
          // Scale width uniformly for text wrapping area to maintain proportions
          width: (textObj.width || 300) * uniformScale,
        })
      }
      
      // Update object coordinates
      obj.setCoords()
    })
    
    // Update canvas dimensions via parent
    onDimensionsChange(newWidth, newHeight)
    canvas.requestRenderAll()
    setDirty(true)
    
    // Feature 2: Auto-save after resolution change with new dimensions
    if (onSaveRequest) {
      // Brief delay to allow canvas to update
      setTimeout(() => {
        onSaveRequest(newWidth, newHeight)
      }, 100)
    }
  }

  const handleBackgroundChange = (color: string) => {
    if (!canvas) return
    canvas.backgroundColor = color
    canvas.requestRenderAll()
    setDirty(true)
  }

  const currentBg = (canvas?.backgroundColor as string) || '#ffffff'

  return (
    <CollapsibleSection
      title="Canvas Settings"
      storageKey="panelSection_canvasSettings"
      defaultExpanded={true}
    >
      {/* Resolution Preset - Custom Dropdown with Aspect Ratio Icons */}
      <div className="mb-3">
        <label className="block text-[10px] text-gray-500 mb-0.5">Resolution</label>
        <div className="relative" ref={dropdownRef}>
          {/* Selected value button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <div className="flex items-center gap-2">
              <AspectRatioIcon preset={getCurrentPreset()} />
              <span className="truncate">{getCurrentPreset().label}</span>
            </div>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                    getCurrentPreset().label === preset.label ? 'bg-blue-100' : ''
                  }`}
                >
                  <AspectRatioIcon preset={preset} />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Dimensions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Width</label>
          <input
            type="number"
            value={width}
            onChange={(e) => handleDimensionsChange(Number(e.target.value), height)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Height</label>
          <input
            type="number"
            value={height}
            onChange={(e) => handleDimensionsChange(width, Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
          />
        </div>
      </div>

      {/* Background Color - only show color picker, no hex value text */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Background</label>
        <input
          type="color"
          value={currentBg}
          onChange={(e) => handleBackgroundChange(e.target.value)}
          className="w-8 h-8 min-w-[32px] rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
          title={currentBg}
        />
      </div>
    </CollapsibleSection>
  )
}
