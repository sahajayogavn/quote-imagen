import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CanvasEditor } from '../components/canvas/CanvasEditor'
import { AssetsPanel } from '../components/panels/AssetsPanel'
import { PropertiesPanel } from '../components/panels/PropertiesPanel'
import { Toolbar } from '../components/layout/Toolbar'
import { useCanvasStore } from '../stores/canvasStore'
import { useTemplateStore } from '../stores/templateStore'
import { useEditorStore } from '../stores/editorStore'
import { templateApi } from '../lib/api'

export function EditorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { canvas } = useCanvasStore()
  const { setCurrentTemplate, setLoading, addTemplate, updateTemplate } = useTemplateStore()
  const { setDirty, setSaveCallback } = useEditorStore()
  const [templateName, setTemplateName] = useState('Untitled Template')
  // Default to 1080x1920 (portrait) as per user request
  const [dimensions, setDimensions] = useState({ width: 1080, height: 1920 })
  const [isSaving, setIsSaving] = useState(false)

  // Auto-save handler for resolution changes - accepts new dimensions to avoid stale state
  const handleSaveRequest = useCallback(async (newWidth?: number, newHeight?: number) => {
    if (!canvas || isSaving) return
    
    // Use provided dimensions if available, otherwise fall back to state
    const saveWidth = newWidth ?? dimensions.width
    const saveHeight = newHeight ?? dimensions.height
    
    setIsSaving(true)
    try {
      const fabricJson = canvas.toObject(['data'])
      
      if (id) {
        // Update existing template
        const updated = await templateApi.update(id, {
          name: templateName,
          width: saveWidth,
          height: saveHeight,
          fabricJson,
        })
        updateTemplate(id, updated)
      } else {
        // Create new template
        const created = await templateApi.create({
          name: templateName || 'Untitled Template',
          width: saveWidth,
          height: saveHeight,
          fabricJson,
        })
        addTemplate(created)
        navigate(`/editor/${created.templateId}`, { replace: true })
      }
      setDirty(false)
    } catch (error) {
      console.error('Failed to auto-save template:', error)
    } finally {
      setIsSaving(false)
    }
  }, [canvas, id, templateName, dimensions, isSaving, updateTemplate, addTemplate, navigate, setDirty])

  // Register the save callback with the editor store for keyboard shortcut access
  useEffect(() => {
    const saveCallback = async () => {
      await handleSaveRequest()
    }
    setSaveCallback(saveCallback)
    
    // Clean up on unmount
    return () => {
      setSaveCallback(null)
    }
  }, [handleSaveRequest, setSaveCallback])

  // Load template if editing
  useEffect(() => {
    if (!id || !canvas) return

    const loadTemplate = async () => {
      setLoading(true)
      try {
        const template = await templateApi.get(id)
        setCurrentTemplate(template)
        setTemplateName(template.name)
        setDimensions({ width: template.width, height: template.height })

        // Load canvas JSON
        if (template.fabricJson && canvas && !canvas.disposed) {
          canvas.loadFromJSON(template.fabricJson).then(() => {
            canvas.requestRenderAll()
            // Center canvas after loading
            if (useCanvasStore.getState().centerCanvas) {
              useCanvasStore.getState().centerCanvas()
            }
          })
        }
      } catch (error) {
        console.error('Failed to load template:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [id, canvas, setCurrentTemplate, setLoading])

  const handleDimensionsChange = (width: number, height: number) => {
    setDimensions({ width, height })
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        templateName={templateName}
        onNameChange={setTemplateName}
      />
      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving...
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <AssetsPanel 
          dimensions={dimensions}
          onDimensionsChange={handleDimensionsChange}
          onSaveRequest={handleSaveRequest}
        />
        <CanvasEditor
          width={dimensions.width}
          height={dimensions.height}
        />
        <PropertiesPanel />
      </div>
    </div>
  )
}
