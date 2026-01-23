import { useState, useRef, useEffect, useCallback } from 'react'
import type { FabricImage } from 'fabric'

interface CropData {
  top: number
  left: number
  width: number
  height: number
}

interface CropModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (cropData: CropData) => void
  imageObject: FabricImage | null
  currentCrop?: CropData
}

export function CropModal({ isOpen, onClose, onApply, imageObject, currentCrop }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 })
  const [displayScale, setDisplayScale] = useState(1)
  
  // Crop area state (in original image coordinates)
  const [cropArea, setCropArea] = useState<CropData>({
    top: 0,
    left: 0,
    width: 100,
    height: 100
  })
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialCrop, setInitialCrop] = useState<CropData | null>(null)

  // Load image and set up initial crop area
  useEffect(() => {
    if (!isOpen || !imageObject) return
    
    const element = imageObject.getElement() as HTMLImageElement
    if (!element) return
    
    // Check if we have original image data stored (from previous crop)
    const objData = (imageObject as any).data as { originalSrc?: string; originalWidth?: number; originalHeight?: number } | undefined
    
    // Use original source if available (for re-cropping already cropped images)
    const imgSrc = objData?.originalSrc || element.src
    const origWidth = objData?.originalWidth || element.naturalWidth || element.width
    const origHeight = objData?.originalHeight || element.naturalHeight || element.height
    
    setOriginalSize({ width: origWidth, height: origHeight })
    
    // Set image source (use original if available for re-cropping)
    if (imgSrc) {
      setImageSrc(imgSrc)
    }
    
    // Initialize crop area from current crop or full image
    if (currentCrop && currentCrop.width > 0 && currentCrop.height > 0) {
      setCropArea(currentCrop)
    } else {
      setCropArea({
        top: 0,
        left: 0,
        width: origWidth,
        height: origHeight
      })
    }
  }, [isOpen, imageObject, currentCrop])

  // Calculate display scale based on container size
  useEffect(() => {
    if (!containerRef.current || originalSize.width === 0) return
    
    const containerWidth = containerRef.current.clientWidth - 48 // padding
    const containerHeight = containerRef.current.clientHeight - 48
    
    const scaleX = containerWidth / originalSize.width
    const scaleY = containerHeight / originalSize.height
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up
    
    setDisplayScale(scale)
  }, [originalSize, isOpen])

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
    } else {
      setIsDragging(true)
    }
    
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialCrop({ ...cropArea })
  }, [cropArea])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return
    if (!initialCrop) return
    
    const deltaX = (e.clientX - dragStart.x) / displayScale
    const deltaY = (e.clientY - dragStart.y) / displayScale
    
    if (isDragging) {
      // Move the crop area
      let newLeft = initialCrop.left + deltaX
      let newTop = initialCrop.top + deltaY
      
      // Constrain to image bounds
      newLeft = Math.max(0, Math.min(newLeft, originalSize.width - cropArea.width))
      newTop = Math.max(0, Math.min(newTop, originalSize.height - cropArea.height))
      
      setCropArea(prev => ({
        ...prev,
        left: newLeft,
        top: newTop
      }))
    } else if (isResizing && resizeHandle) {
      let newCrop = { ...initialCrop }
      
      // Handle different resize handles
      if (resizeHandle.includes('n')) {
        const newTop = Math.max(0, initialCrop.top + deltaY)
        const heightDiff = initialCrop.top - newTop
        newCrop.top = newTop
        newCrop.height = Math.max(20, initialCrop.height + heightDiff)
      }
      if (resizeHandle.includes('s')) {
        newCrop.height = Math.max(20, Math.min(
          initialCrop.height + deltaY,
          originalSize.height - initialCrop.top
        ))
      }
      if (resizeHandle.includes('w')) {
        const newLeft = Math.max(0, initialCrop.left + deltaX)
        const widthDiff = initialCrop.left - newLeft
        newCrop.left = newLeft
        newCrop.width = Math.max(20, initialCrop.width + widthDiff)
      }
      if (resizeHandle.includes('e')) {
        newCrop.width = Math.max(20, Math.min(
          initialCrop.width + deltaX,
          originalSize.width - initialCrop.left
        ))
      }
      
      setCropArea(newCrop)
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, initialCrop, displayScale, originalSize, cropArea.width, cropArea.height])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setInitialCrop(null)
  }, [])

  const handleApply = () => {
    onApply(cropArea)
    onClose()
  }

  const handleReset = () => {
    setCropArea({
      top: 0,
      left: 0,
      width: originalSize.width,
      height: originalSize.height
    })
  }

  if (!isOpen) return null

  const displayWidth = originalSize.width * displayScale
  const displayHeight = originalSize.height * displayScale

  // Crop area in display coordinates
  const displayCrop = {
    left: cropArea.left * displayScale,
    top: cropArea.top * displayScale,
    width: cropArea.width * displayScale,
    height: cropArea.height * displayScale
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Crop Image</h2>
          <div className="text-sm text-gray-500">
            Drag to move, drag handles to resize
          </div>
        </div>
        
        {/* Image Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center min-h-[400px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="relative"
            style={{ width: displayWidth, height: displayHeight }}
          >
            {/* Full Image */}
            <img 
              src={imageSrc} 
              alt="Crop preview"
              className="block"
              style={{ 
                width: displayWidth, 
                height: displayHeight,
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
            
            {/* Darkened overlay for non-crop area */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              style={{
                clipPath: `polygon(
                  0 0, 
                  100% 0, 
                  100% 100%, 
                  0 100%, 
                  0 0,
                  ${displayCrop.left}px ${displayCrop.top}px,
                  ${displayCrop.left}px ${displayCrop.top + displayCrop.height}px,
                  ${displayCrop.left + displayCrop.width}px ${displayCrop.top + displayCrop.height}px,
                  ${displayCrop.left + displayCrop.width}px ${displayCrop.top}px,
                  ${displayCrop.left}px ${displayCrop.top}px
                )`
              }}
            />
            
            {/* Crop Area */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: displayCrop.left,
                top: displayCrop.top,
                width: displayCrop.width,
                height: displayCrop.height,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Resize Handles */}
              {/* Corners */}
              <div
                className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />
              
              {/* Edge handles */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-6 h-3 bg-white border border-gray-400 cursor-n-resize"
                onMouseDown={(e) => handleMouseDown(e, 'n')}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-6 h-3 bg-white border border-gray-400 cursor-s-resize"
                onMouseDown={(e) => handleMouseDown(e, 's')}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-6 bg-white border border-gray-400 cursor-w-resize"
                onMouseDown={(e) => handleMouseDown(e, 'w')}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-6 bg-white border border-gray-400 cursor-e-resize"
                onMouseDown={(e) => handleMouseDown(e, 'e')}
              />
              
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white bg-opacity-30" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white bg-opacity-30" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white bg-opacity-30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white bg-opacity-30" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with crop info and buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Crop:</span>{' '}
            {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
            <span className="mx-2">|</span>
            <span className="font-medium">Position:</span>{' '}
            ({Math.round(cropArea.left)}, {Math.round(cropArea.top)})
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
