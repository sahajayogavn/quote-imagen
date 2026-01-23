import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTemplateStore, type Template } from '../stores/templateStore'
import { templateApi } from '../lib/api'
import { APIUsageModal } from '../components/modals/APIUsageModal'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function TemplateListPage() {
  const { templates, setTemplates, setLoading, isLoading, removeTemplate } = useTemplateStore()
  const [apiModalTemplate, setApiModalTemplate] = useState<Template | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      try {
        const data = await templateApi.list()
        setTemplates(data)
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [setTemplates, setLoading])

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await templateApi.delete(templateId)
      removeTemplate(templateId)
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Quote Studio</h1>
          <Link
            to="/editor"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + New Template
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No templates yet</h2>
            <p className="text-gray-500 mb-6">Create your first template to get started</p>
            <Link
              to="/editor"
              className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Template
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.templateId}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="bg-gray-100 flex items-center justify-center"
                  style={{
                    aspectRatio: `${template.width} / ${template.height}`,
                  }}
                >
                  {template.previewUrl ? (
                    <img
                      src={template.previewUrl}
                      alt={template.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl text-gray-300">🖼️</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {template.width} × {template.height} • {template.variables?.length || 0} variables
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/editor/${template.templateId}`}
                      className="flex-1 px-3 py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setApiModalTemplate(template)}
                      className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="View API Usage"
                    >
                      <span className="font-mono">&lt;/&gt;</span>
                    </button>
                    <button
                      onClick={() => handleDelete(template.templateId)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* API Usage Modal */}
      {apiModalTemplate && (
        <APIUsageModal
          isOpen={true}
          onClose={() => setApiModalTemplate(null)}
          template={apiModalTemplate}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  )
}
