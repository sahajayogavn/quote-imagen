import { create } from 'zustand'

type Tool = 'select' | 'text' | 'rect' | 'circle' | 'image'

// Type for the save callback function
type SaveCallback = (() => Promise<void>) | null

interface EditorState {
  activeTool: Tool
  isDirty: boolean
  canUndo: boolean
  canRedo: boolean
  saveCallback: SaveCallback
  setActiveTool: (tool: Tool) => void
  setDirty: (dirty: boolean) => void
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setSaveCallback: (callback: SaveCallback) => void
  triggerSave: () => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  isDirty: false,
  canUndo: false,
  canRedo: false,
  saveCallback: null,
  setActiveTool: (activeTool) => set({ activeTool }),
  setDirty: (isDirty) => set({ isDirty }),
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
  setSaveCallback: (saveCallback) => set({ saveCallback }),
  triggerSave: async () => {
    const { saveCallback, isDirty } = get()
    if (saveCallback && isDirty) {
      try {
        await saveCallback()
      } catch (error) {
        console.error('Save failed:', error)
      }
    }
  },
}))
