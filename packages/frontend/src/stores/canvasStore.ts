import { create } from 'zustand'
import type { Canvas, FabricObject } from 'fabric'

// Maximum number of states to keep in history
const MAX_HISTORY_SIZE = 50

// Frame edit mode state
interface FrameEditState {
  frame: FabricObject
  savedClipPath: any
  originalFrameCenter: { x: number; y: number }
  originalImageState: { left: number; top: number; scaleX: number; scaleY: number }
}

interface CanvasState {
  canvas: Canvas | null
  selectedObject: FabricObject | null
  zoom: number
  
  // History management for undo/redo
  historyStack: string[]  // Stack of canvas JSON states
  historyIndex: number    // Current position in history (-1 means no history)
  isRestoring: boolean    // Flag to prevent saving state during restoration
  
  // Frame edit mode state
  frameEditMode: FabricObject | null  // The frame currently in edit mode
  frameEditState: FrameEditState | null  // Additional edit state (clipPath, original position)
  
  // Canvas dimensions (for frame sizing)
  canvasWidth: number
  canvasHeight: number
  
  setCanvas: (canvas: Canvas | null) => void
  setSelectedObject: (obj: FabricObject | null) => void
  setZoom: (zoom: number) => void
  centerCanvas: () => void
  setCenterCanvas: (fn: () => void) => void
  
  // Frame edit mode actions
  setFrameEditMode: (frame: FabricObject | null) => void
  setFrameEditState: (state: FrameEditState | null) => void
  exitFrameEditMode: () => void
  
  // Canvas dimensions
  setCanvasDimensions: (width: number, height: number) => void
  
  // History actions
  saveState: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  selectedObject: null,
  zoom: 1,
  
  // History state
  historyStack: [],
  historyIndex: -1,
  isRestoring: false,
  
  // Frame edit mode state
  frameEditMode: null,
  frameEditState: null,
  
  // Canvas dimensions (default to 1080)
  canvasWidth: 1080,
  canvasHeight: 1080,
  
  // Placeholder for the function that will be registered by the component
  centerCanvas: () => {},
  setCanvas: (canvas) => set({ canvas }),
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  setZoom: (zoom) => set({ zoom }),
  setCenterCanvas: (fn) => set({ centerCanvas: fn }),
  
  // Frame edit mode actions
  setFrameEditMode: (frame) => set({ frameEditMode: frame }),
  setFrameEditState: (state) => set({ frameEditState: state }),
  exitFrameEditMode: () => {
    const { canvas, frameEditMode } = get()
    if (frameEditMode && canvas) {
      // Remove edit mode visual indicators
      frameEditMode.set({
        strokeWidth: 0,
        stroke: null,
      })
      canvas.requestRenderAll()
    }
    set({ frameEditMode: null, frameEditState: null })
  },
  
  // Canvas dimensions setter
  setCanvasDimensions: (width, height) => set({ canvasWidth: width, canvasHeight: height }),
  
  // Save current canvas state to history
  saveState: () => {
    const { canvas, historyStack, historyIndex, isRestoring } = get()
    
    // Don't save state if we're currently restoring (to prevent loops)
    if (!canvas || isRestoring) return
    
    try {
      // Get canvas JSON with custom data property included
      const state = JSON.stringify(canvas.toJSON())
      
      // If we're not at the end of history, remove future states
      const newStack = historyStack.slice(0, historyIndex + 1)
      
      // Add new state
      newStack.push(state)
      
      // Limit history size
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift()
      }
      
      set({
        historyStack: newStack,
        historyIndex: newStack.length - 1,
      })
    } catch (error) {
      console.error('Failed to save canvas state:', error)
    }
  },
  
  // Undo - restore previous state
  undo: () => {
    const { canvas, historyStack, historyIndex, isRestoring } = get()
    
    if (!canvas || isRestoring || historyIndex <= 0) return
    
    const newIndex = historyIndex - 1
    const previousState = historyStack[newIndex]
    
    if (!previousState) return
    
    set({ isRestoring: true })
    
    try {
      canvas.loadFromJSON(previousState).then(() => {
        canvas.requestRenderAll()
        set({
          historyIndex: newIndex,
          isRestoring: false,
          selectedObject: null,
        })
        canvas.discardActiveObject()
      }).catch((error: Error) => {
        console.error('Failed to restore canvas state:', error)
        set({ isRestoring: false })
      })
    } catch (error) {
      console.error('Failed to parse canvas state:', error)
      set({ isRestoring: false })
    }
  },
  
  // Redo - restore next state
  redo: () => {
    const { canvas, historyStack, historyIndex, isRestoring } = get()
    
    if (!canvas || isRestoring || historyIndex >= historyStack.length - 1) return
    
    const newIndex = historyIndex + 1
    const nextState = historyStack[newIndex]
    
    if (!nextState) return
    
    set({ isRestoring: true })
    
    try {
      canvas.loadFromJSON(nextState).then(() => {
        canvas.requestRenderAll()
        set({
          historyIndex: newIndex,
          isRestoring: false,
          selectedObject: null,
        })
        canvas.discardActiveObject()
      }).catch((error: Error) => {
        console.error('Failed to restore canvas state:', error)
        set({ isRestoring: false })
      })
    } catch (error) {
      console.error('Failed to parse canvas state:', error)
      set({ isRestoring: false })
    }
  },
  
  // Check if undo is possible
  canUndo: () => {
    const { historyIndex, isRestoring } = get()
    return !isRestoring && historyIndex > 0
  },
  
  // Check if redo is possible
  canRedo: () => {
    const { historyStack, historyIndex, isRestoring } = get()
    return !isRestoring && historyIndex < historyStack.length - 1
  },
  
  // Clear history (useful when loading a new project)
  clearHistory: () => {
    set({
      historyStack: [],
      historyIndex: -1,
      isRestoring: false,
    })
  },
}))
