import { create } from 'zustand'

export interface Template {
  templateId: string
  name: string
  width: number
  height: number
  fabricJson: object
  variables: string[]
  previewUrl?: string
  createdAt: string
  updatedAt: string
}

interface TemplateState {
  templates: Template[]
  currentTemplate: Template | null
  isLoading: boolean
  error: string | null
  setTemplates: (templates: Template[]) => void
  setCurrentTemplate: (template: Template | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTemplate: (template: Template) => void
  updateTemplate: (templateId: string, updates: Partial<Template>) => void
  removeTemplate: (templateId: string) => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,
  setTemplates: (templates) => set({ templates }),
  setCurrentTemplate: (currentTemplate) => set({ currentTemplate }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (templateId, updates) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.templateId === templateId ? { ...t, ...updates } : t
      ),
    })),
  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.templateId !== templateId),
    })),
}))
