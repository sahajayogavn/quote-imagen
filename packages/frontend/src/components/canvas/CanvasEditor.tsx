import { useEffect, useRef, useCallback } from 'react'
import * as fabric from 'fabric'
import { Canvas, Textbox, Rect, Circle, FabricImage, FabricObject } from 'fabric'
import { useCanvasStore } from '../../stores/canvasStore'
import { useEditorStore } from '../../stores/editorStore'
import {
  isCircleFrame,
  circleFrameHasImage,
  findFrameAtPosition,
  dropImageOnFrame,
  addImageToFrame,
  enterFrameEditMode,
  exitFrameEditModeVisual,
  clearMaskOutline,
  type CircleFrame,
} from '../../utils/circleFrame'

interface CanvasEditorProps {
  width?: number
  height?: number
}

export function CanvasEditor({ width = 1080, height = 1080 }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    canvas,
    setCanvas,
    setSelectedObject,
    zoom,
    setZoom,
    setCenterCanvas,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    frameEditMode,
    frameEditState,
    setFrameEditMode,
    setFrameEditState,
    exitFrameEditMode,
    setCanvasDimensions,
  } = useCanvasStore()
  const { activeTool, setActiveTool, setDirty, triggerSave } = useEditorStore()
  
  // Track potential frame drop target while dragging
  const potentialDropFrameRef = useRef<FabricObject | null>(null)
  // Track if we're dragging an image
  const isDraggingImageRef = useRef(false)
  // Track scroll lock state for text editing (prevents unwanted scroll during textbox editing)
  const textEditScrollLockRef = useRef<{
    scrollX: number
    scrollY: number
    containerScrollTop: number
    containerScrollLeft: number
    handler: (() => void) | null
  } | null>(null)

  // Zoom to fit function
  const zoomToFit = () => {
    if (!canvasRef.current || !containerRef.current || !canvas) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const padding = 50

    const scaleX = (containerWidth - padding * 2) / width
    const scaleY = (containerHeight - padding * 2) / height
    const scale = Math.min(scaleX, scaleY, 1) // Don't zoom in more than 100% automatically

    setZoom(scale)
  }

  // Register zoomToFit to store
  useEffect(() => {
    setCenterCanvas(zoomToFit)
  }, [setCenterCanvas, width, height, canvas])

  // Calculate corner size based on zoom level
  // Corners should appear the same visual size regardless of zoom
  const getCornerSizeForZoom = useCallback((currentZoom: number) => {
    const baseCornerSize = 12 // Base size at 100% zoom (in canvas coordinates)
    // Inverse relationship: smaller zoom = larger corner size in canvas units
    // This makes corners appear consistent in screen pixels
    return Math.round(baseCornerSize / currentZoom)
  }, [])

  // Helper function to apply corner style settings to an object
  // This ensures large, visible resize handles on all canvas objects
  const applyCornerSettings = useCallback((obj: FabricObject, currentZoom: number) => {
    const cornerSize = getCornerSizeForZoom(currentZoom)
    obj.set({
      cornerSize,              // Dynamic corner size based on zoom
      cornerStyle: 'circle',    // Circle corners are easier to grab
      transparentCorners: false, // Solid corners are more visible
      cornerColor: '#4A90D9',   // Blue corner color
      borderColor: '#4A90D9',   // Blue border color
      borderScaleFactor: 2,     // Thicker border
    })
  }, [getCornerSizeForZoom])

  // Update corner sizes on all objects when zoom changes
  const updateCornerSizesForZoom = useCallback((fabricCanvas: Canvas, currentZoom: number) => {
    const cornerSize = getCornerSizeForZoom(currentZoom)
    fabricCanvas.forEachObject((obj) => {
      obj.set({ cornerSize })
    })
    fabricCanvas.requestRenderAll()
  }, [getCornerSizeForZoom])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Get initial corner size based on current zoom
    const initialCornerSize = getCornerSizeForZoom(zoom)

    // Configure global Fabric.js control styles for visible handles
    // Note: In fabric.js v6, prototype settings may not apply reliably,
    // so we also use object:added event as a backup
    fabric.FabricObject.prototype.cornerSize = initialCornerSize // Dynamic corner size
    fabric.FabricObject.prototype.cornerStyle = 'circle' // Circle corners are easier to grab
    fabric.FabricObject.prototype.transparentCorners = false // Solid corners are more visible
    fabric.FabricObject.prototype.cornerColor = '#4A90D9' // Blue corner color
    fabric.FabricObject.prototype.borderColor = '#4A90D9' // Blue border color
    fabric.FabricObject.prototype.borderScaleFactor = 2 // Thicker border

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      // uniformScaling: true means corner handles maintain aspect ratio by default
      // Side handles (middle of edges) still allow free resizing in one dimension
      // Hold Shift to toggle behavior (free resize for corners when Shift is held)
      uniformScaling: true,
    })

    // Selection events
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    // Track changes
    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target
      // Normalize Textbox after scaling to prevent text distortion
      if (obj && obj.type === 'textbox') {
        const textbox = obj as Textbox
        if (textbox.scaleX !== 1 || textbox.scaleY !== 1) {
          const newWidth = (textbox.width || 200) * (textbox.scaleX || 1)
          // Use the minimum scale to preserve aspect ratio for font size
          const scale = Math.min(textbox.scaleX || 1, textbox.scaleY || 1)
          const newFontSize = Math.round((textbox.fontSize || 40) * scale)
          
          textbox.set({
            width: Math.round(newWidth),
            fontSize: Math.max(8, newFontSize), // Minimum font size of 8
            scaleX: 1,
            scaleY: 1,
          })
          textbox.setCoords()
          fabricCanvas.requestRenderAll()
        }
      }
      setDirty(true)
      // Save state for undo/redo after modification
      saveState()
    })

    // Save state when objects are added AND apply corner settings
    fabricCanvas.on('object:added', (e) => {
      // Apply corner settings to ensure visible resize handles
      // This is critical because fabric.js v6 prototype settings may not apply reliably
      if (e.target) {
        const currentZoom = useCanvasStore.getState().zoom
        const cornerSize = getCornerSizeForZoom(currentZoom)
        e.target.set({
          cornerSize,              // Dynamic corner size based on zoom
          cornerStyle: 'circle',    // Circle corners are easier to grab
          transparentCorners: false, // Solid corners are more visible
          cornerColor: '#4A90D9',   // Blue corner color
          borderColor: '#4A90D9',   // Blue border color
          borderScaleFactor: 2,     // Thicker border
        })
      }
      
      // IMPORTANT: Check isRestoring at the time of the event, not in the setTimeout callback
      // This prevents saveState from being called during undo/redo operations
      const wasRestoring = useCanvasStore.getState().isRestoring
      if (wasRestoring) return
      setDirty(true)
      // Delay slightly to ensure object is fully added
      setTimeout(() => {
        // Double-check isRestoring in case another restore started
        if (!useCanvasStore.getState().isRestoring) {
          saveState()
        }
      }, 10)
    })

    // Save state when objects are removed
    fabricCanvas.on('object:removed', () => {
      // Check isRestoring to prevent saving during undo/redo
      if (useCanvasStore.getState().isRestoring) return
      setDirty(true)
      saveState()
    })

    // Handle scaling: Special handling for textbox to prevent text distortion during resize
    // Note: Corner resize uniform scaling is handled by Fabric.js via uniformScaling: true
    // Shift key toggles to free resize (built-in Fabric.js behavior)
    fabricCanvas.on('object:scaling', (e) => {
      const obj = e.target
      if (!obj) return
      
      // Special handling for textbox edge resize to prevent text distortion
      // Corner resize is handled by Fabric.js uniformScaling setting
      if (obj.type === 'textbox') {
        const textbox = obj as Textbox
        
        // Use the transform.corner property to reliably detect which handle is being used
        // This is much more reliable than comparing scale changes, which can be inconsistent
        // during Shift+resize and cause flickering
        // No special handling needed for textbox edge resizes during scaling.
        // The object:modified handler normalizes the textbox after scaling completes
        // by converting scale to width/fontSize adjustments.
        //
        // Edge handles in Fabric.js:
        // 'ml' = middle-left, 'mr' = middle-right (horizontal edge resize)
        // 'mt' = middle-top, 'mb' = middle-bottom (vertical edge resize)
        // Corner handles: 'tl', 'tr', 'bl', 'br'
        //
        // All resize handles are allowed to work naturally. The post-scaling
        // normalization in object:modified handles the conversion properly.
        void textbox // Reference to avoid unused variable warning
      }
    })

    // Detect {{variable}} in text
    fabricCanvas.on('text:changed', (e) => {
      const target = e.target as Textbox & { data?: Record<string, unknown> }
      if (target && target.text) {
        const match = target.text.match(/{{(.*?)}}/)
        if (match) {
          target.set('data', {
            ...(target.data || {}),
            variableName: match[1],
            isDynamic: true,
          })
        }
      }
      setDirty(true)
    })

    // Prevent page scroll during entire text editing session
    // When double-clicking a Textbox to edit, Fabric.js creates a hidden textarea and focuses it.
    // The hidden textarea grows as text is added (especially with Enter/newlines), causing the
    // browser to auto-scroll to keep the cursor visible. This creates jarring scroll jumps.
    //
    // Solution: Attach a scroll event listener that immediately restores scroll position
    // for the duration of the text editing session. This prevents ALL scroll jumps caused by:
    // 1. Double-clicking to enter edit mode
    // 2. Pressing Enter to add new lines
    // 3. Typing text that makes the textbox grow
    // 4. Any other textarea focus/resize events
    fabricCanvas.on('text:editing:entered', () => {
      // Capture scroll positions of all potentially scrollable elements at the moment editing starts
      const container = containerRef.current
      const scrollLockState = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        containerScrollTop: container?.scrollTop ?? 0,
        containerScrollLeft: container?.scrollLeft ?? 0,
        handler: null as (() => void) | null,
      }
      
      // Create a scroll handler that immediately restores the saved scroll position
      // This will fire every time the browser tries to scroll (due to textarea focus/growth)
      const restoreScroll = () => {
        // Restore window scroll
        window.scrollTo(scrollLockState.scrollX, scrollLockState.scrollY)
        
        // Restore container scroll
        if (container) {
          container.scrollTop = scrollLockState.containerScrollTop
          container.scrollLeft = scrollLockState.containerScrollLeft
        }
      }
      
      // Store the handler so we can remove it later
      scrollLockState.handler = restoreScroll
      
      // Add scroll listeners to window and container
      // Use { passive: true } for better performance - we're restoring position, not preventing default
      window.addEventListener('scroll', restoreScroll, { passive: true, capture: true })
      if (container) {
        container.addEventListener('scroll', restoreScroll, { passive: true })
      }
      
      // Also add listeners for body and documentElement for comprehensive coverage
      document.body.addEventListener('scroll', restoreScroll, { passive: true })
      document.documentElement.addEventListener('scroll', restoreScroll, { passive: true })
      
      // Store the state in the ref so text:editing:exited can clean up
      textEditScrollLockRef.current = scrollLockState
      
      // Do an immediate restore in case scroll already happened during the focus event
      requestAnimationFrame(restoreScroll)
    })
    
    // Clean up scroll prevention when text editing ends
    fabricCanvas.on('text:editing:exited', () => {
      const scrollLockState = textEditScrollLockRef.current
      if (scrollLockState?.handler) {
        const container = containerRef.current
        
        // Remove all scroll listeners
        window.removeEventListener('scroll', scrollLockState.handler, { capture: true })
        if (container) {
          container.removeEventListener('scroll', scrollLockState.handler)
        }
        document.body.removeEventListener('scroll', scrollLockState.handler)
        document.documentElement.removeEventListener('scroll', scrollLockState.handler)
        
        // Clear the ref
        textEditScrollLockRef.current = null
      }
    })

    // Double-click handler for circle frame edit mode
    fabricCanvas.on('mouse:dblclick', (e) => {
      const target = e.target as FabricImage
      if (target && (target as any).data?.type === 'circleFrame' && (target as any).data?.hasImage) {
        // Enter visual edit mode using the helper function
        const editState = enterFrameEditMode(fabricCanvas, target)
        
        if (editState) {
          // Store the frame and edit state
          useCanvasStore.getState().setFrameEditMode(target)
          
          // Calculate original frame center (where the mask outline should be)
          const data = (target as any).data
          const offsetX = data.imageOffsetX || 0
          const offsetY = data.imageOffsetY || 0
          const originalFrameCenter = {
            x: editState.originalState.left - offsetX,
            y: editState.originalState.top - offsetY,
          }
          
          useCanvasStore.getState().setFrameEditState({
            frame: target,
            savedClipPath: editState.savedClipPath,
            originalFrameCenter,
            originalImageState: editState.originalState,
          })
          
          // Keep the image selected for manipulation
          fabricCanvas.setActiveObject(target)
          fabricCanvas.requestRenderAll()
          console.log('Frame Edit Mode: Drag/scale the image to adjust. Click outside or press Escape to exit.')
        }
      }
    })
    
    // Helper function to properly exit frame edit mode with visual restoration
    const doExitFrameEditMode = () => {
      const state = useCanvasStore.getState()
      const editState = state.frameEditState
      const currentFrameEditMode = state.frameEditMode
      
      if (currentFrameEditMode && editState) {
        // Apply the visual exit with offset calculation
        exitFrameEditModeVisual(
          fabricCanvas,
          currentFrameEditMode as FabricImage,
          editState.savedClipPath,
          editState.originalFrameCenter
        )
        
        // Clear the state
        state.setFrameEditMode(null)
        state.setFrameEditState(null)
        
        fabricCanvas.requestRenderAll()
        console.log('Exited frame edit mode')
        return true
      } else if (currentFrameEditMode) {
        // Fallback: just clear mask outline and state
        clearMaskOutline(fabricCanvas)
        currentFrameEditMode.set({
          strokeWidth: 0,
          stroke: null,
        })
        state.setFrameEditMode(null)
        state.setFrameEditState(null)
        fabricCanvas.requestRenderAll()
        console.log('Exited frame edit mode (fallback)')
        return true
      }
      return false
    }
    
    // Click outside detection - exit frame edit mode when clicking on canvas background
    fabricCanvas.on('mouse:down', (e) => {
      const currentFrameEditMode = useCanvasStore.getState().frameEditMode
      if (currentFrameEditMode && !e.target) {
        // Clicked on canvas background - exit edit mode
        doExitFrameEditMode()
      }
    })
    
    // Exit frame edit mode when selecting a different object
    fabricCanvas.on('selection:created', (e) => {
      const currentFrameEditMode = useCanvasStore.getState().frameEditMode
      if (currentFrameEditMode && e.selected?.[0] !== currentFrameEditMode) {
        // Selected a different object - exit edit mode
        doExitFrameEditMode()
      }
    })
    
    // Also exit frame edit mode when selection is updated to a different object  
    fabricCanvas.on('selection:updated', (e) => {
      const currentFrameEditMode = useCanvasStore.getState().frameEditMode
      if (currentFrameEditMode && e.selected?.[0] !== currentFrameEditMode) {
        // Selected a different object - exit edit mode
        doExitFrameEditMode()
      }
    })
    
    // Also exit on selection cleared (though clicking background already handles this)
    fabricCanvas.on('selection:cleared', () => {
      const currentFrameEditMode = useCanvasStore.getState().frameEditMode
      if (currentFrameEditMode) {
        doExitFrameEditMode()
      }
    })
    
    // Helper function to set stroke on a frame (handles both Group and circle child)
    const setFrameHighlight = (frame: FabricObject, stroke: string, strokeWidth: number) => {
      // For Group frames, we need to set the stroke on the internal circle, not the group itself
      if (frame.type === 'group') {
        const group = frame as any
        const objects = group.getObjects ? group.getObjects() : []
        // Find the circle inside the group and update its stroke
        for (const obj of objects) {
          if (obj.type === 'circle') {
            obj.set({ stroke, strokeWidth })
            break
          }
        }
      } else {
        // For image frames with clipPath, stroke is on the image itself
        frame.set({ stroke, strokeWidth })
      }
    }

    // Track when images are being dragged for frame drop detection
    fabricCanvas.on('object:moving', (e) => {
      const movingObj = e.target
      if (!movingObj || movingObj.type !== 'image') {
        isDraggingImageRef.current = false
        return
      }
      
      // Skip if it's a circle frame image (has circleFrame data)
      if ((movingObj as any).data?.type === 'circleFrame') {
        isDraggingImageRef.current = false
        return
      }
      
      isDraggingImageRef.current = true
      
      // Get the center position of the moving object
      const objCenter = movingObj.getCenterPoint()
      
      // Check if it's over an empty frame
      const frameUnder = findFrameAtPosition(fabricCanvas, objCenter.x, objCenter.y)
      
      // Clear previous highlight
      if (potentialDropFrameRef.current && potentialDropFrameRef.current !== frameUnder) {
        setFrameHighlight(potentialDropFrameRef.current, '#999', 2)
      }
      
      // Highlight the frame if found
      if (frameUnder) {
        setFrameHighlight(frameUnder, '#22c55e', 4) // Green highlight
        potentialDropFrameRef.current = frameUnder
      } else {
        potentialDropFrameRef.current = null
      }
      
      fabricCanvas.requestRenderAll()
    })
    
    // Handle drop on frame when mouse is released
    fabricCanvas.on('mouse:up', async () => {
      if (!isDraggingImageRef.current) return
      isDraggingImageRef.current = false
      
      const droppedObj = fabricCanvas.getActiveObject()
      if (!droppedObj || droppedObj.type !== 'image') return
      
      // Skip if it's a circle frame image
      if ((droppedObj as any).data?.type === 'circleFrame') return
      
      // Check if we have a valid drop target
      if (potentialDropFrameRef.current) {
        const frame = potentialDropFrameRef.current
        
        // Reset frame highlight
        setFrameHighlight(frame, '#999', 2)
        
        // Drop the image onto the frame
        const success = await dropImageOnFrame(fabricCanvas, droppedObj as FabricImage, frame)
        
        if (success) {
          console.log('Image dropped onto frame successfully')
          setDirty(true)
          saveState()
        }
        
        potentialDropFrameRef.current = null
        fabricCanvas.requestRenderAll()
      }
    })

    setCanvas(fabricCanvas)
    
    // Save initial state for undo history
    setTimeout(() => saveState(), 50)

    // Handle keyboard shortcuts
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
      )

      if (isInputActive) return

      // Escape key - exit frame edit mode
      if (e.key === 'Escape') {
        const currentFrameEditMode = useCanvasStore.getState().frameEditMode
        if (currentFrameEditMode) {
          e.preventDefault()
          // Use the proper exit function
          doExitFrameEditMode()
          return
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = fabricCanvas.getActiveObject()
        if (activeObj && !(activeObj as Textbox).isEditing) {
          fabricCanvas.remove(activeObj)
          fabricCanvas.discardActiveObject()
          fabricCanvas.requestRenderAll()
          setDirty(true)
          // Note: saveState will be triggered by object:removed event
        }
      }

      // Clone: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        const activeObj = fabricCanvas.getActiveObject()
        if (activeObj) {
          const cloned = await activeObj.clone()
          fabricCanvas.discardActiveObject()
          
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
            evented: true,
          })
          
          if (cloned.type === 'activeSelection') {
            cloned.canvas = fabricCanvas
            ;(cloned as any).forEachObject((obj: any) => {
              fabricCanvas.add(obj)
            })
            cloned.setCoords()
          } else {
            fabricCanvas.add(cloned)
          }
          
          fabricCanvas.setActiveObject(cloned)
          fabricCanvas.requestRenderAll()
          setDirty(true)
          // Save state after clone
          saveState()
        }
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          undo()
        }
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo()) {
          redo()
        }
      }

      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        // Trigger save via the editor store callback
        useEditorStore.getState().triggerSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Clean up any active scroll lock listeners if component unmounts during text editing
      const scrollLockState = textEditScrollLockRef.current
      if (scrollLockState?.handler) {
        const container = containerRef.current
        window.removeEventListener('scroll', scrollLockState.handler, { capture: true })
        if (container) {
          container.removeEventListener('scroll', scrollLockState.handler)
        }
        document.body.removeEventListener('scroll', scrollLockState.handler)
        document.documentElement.removeEventListener('scroll', scrollLockState.handler)
        textEditScrollLockRef.current = null
      }
      
      fabricCanvas.dispose()
      setCanvas(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCanvas, setSelectedObject, setDirty])

  // Handle dimensions change
  useEffect(() => {
    if (canvas) {
      canvas.setDimensions({ width, height })
      canvas.requestRenderAll()
      // Use a timeout to allow the canvas to update its internal state/DOM
      setTimeout(zoomToFit, 10)
    }
    // Update store with canvas dimensions
    setCanvasDimensions(width, height)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, width, height, setCanvasDimensions])

  // Update corner sizes when zoom changes
  // This ensures corners remain visually consistent (same screen size) regardless of zoom level
  useEffect(() => {
    if (canvas) {
      updateCornerSizesForZoom(canvas, zoom)
    }
  }, [canvas, zoom, updateCornerSizesForZoom])

  // Handle tool clicks on canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvas || activeTool === 'select') return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    let newObject = null

    switch (activeTool) {
      case 'text':
        newObject = new Textbox('Enter text', {
          left: x,
          top: y,
          fontSize: 200, // 40 * 5
          fontFamily: 'Arial',
          fill: '#000000',
          width: 1500, // 300 * 5
          // Allow vertical scaling from top/bottom edge handles
          // By default, Fabric.js Textbox locks Y scaling (height is auto-calculated from content)
          // We unlock it to allow users to resize from top/bottom edges
          lockScalingY: false,
        })
        break
      case 'rect':
        newObject = new Rect({
          left: x,
          top: y,
          width: 1000, // 200 * 5
          height: 750, // 150 * 5
          fill: '#3b82f6',
          stroke: '#1d4ed8',
          strokeWidth: 10, // 2 * 5
        })
        break
      case 'circle':
        newObject = new Circle({
          left: x,
          top: y,
          radius: 375, // 75 * 5
          fill: '#10b981',
          stroke: '#047857',
          strokeWidth: 10, // 2 * 5
        })
        break
    }

    if (newObject) {
      canvas.add(newObject)
      canvas.setActiveObject(newObject)
      canvas.requestRenderAll()
      setActiveTool('select')
      setDirty(true)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-100 overflow-auto flex-1 flex items-center justify-center"
      onClick={handleCanvasClick}
    >
      <div
        className="shadow-lg"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
