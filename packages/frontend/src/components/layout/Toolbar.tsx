import { useNavigate, useParams } from 'react-router-dom'
import { useCanvasStore } from '../../stores/canvasStore'
import { useEditorStore } from '../../stores/editorStore'
import { useTemplateStore } from '../../stores/templateStore'
import { templateApi } from '../../lib/api'

interface ToolbarProps {
  templateName: string
  onNameChange: (name: string) => void
}

export function Toolbar({ templateName, onNameChange }: ToolbarProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { canvas, zoom, setZoom } = useCanvasStore()
  const { isDirty, setDirty } = useEditorStore()
  const { addTemplate, updateTemplate, setLoading } = useTemplateStore()

  const handleSave = async () => {
    if (!canvas) return

    setLoading(true)
    try {
      const fabricJson = canvas.toObject(['data'])

      // Generate preview snapshot from canvas
      const originalZoom = canvas.getZoom()
      canvas.setZoom(1)
      const previewDataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.5, // 50% size for thumbnail
      })
      canvas.setZoom(originalZoom)

      if (id) {
        // Update existing
        const updated = await templateApi.update(id, {
          name: templateName,
          fabricJson,
          previewDataUrl,
        })
        updateTemplate(id, updated)
      } else {
        // Create new
        const created = await templateApi.create({
          name: templateName || 'Untitled Template',
          width: canvas.width!,
          height: canvas.height!,
          fabricJson,
          previewDataUrl,
        })
        addTemplate(created)
        navigate(`/editor/${created.templateId}`, { replace: true })
      }
      setDirty(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.25))
  const handleZoomReset = () => {
    // If we have a centerCanvas function, use it to zoom to fit
    if (useCanvasStore.getState().centerCanvas) {
      useCanvasStore.getState().centerCanvas()
    } else {
      setZoom(1)
    }
  }

  const handleBack = () => {
    if (isDirty && !confirm('You have unsaved changes. Leave anyway?')) {
      return
    }
    navigate('/')
  }

  return (
    <div className="h-10 bg-white border-b border-gray-200 px-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900 px-1.5 py-0.5 rounded text-xs"
        >
          ← Back
        </button>
        <input
          type="text"
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Template name"
          className="px-2 py-1 border border-gray-300 rounded-md text-xs w-56"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded p-0.5">
          <button
            onClick={handleZoomOut}
            className="px-2 py-0.5 text-xs hover:bg-white rounded"
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-0.5 text-xs hover:bg-white rounded min-w-[48px]"
            title="Zoom to Fit"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="px-2 py-0.5 text-xs hover:bg-white rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {id ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  )
}
