import { useState } from 'react'
import type { Template } from '../../stores/templateStore'

interface APIUsageModalProps {
  isOpen: boolean
  onClose: () => void
  template: Template
  apiBaseUrl: string
}

export function APIUsageModal({ isOpen, onClose, template, apiBaseUrl }: APIUsageModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen) return null

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  // Build variable placeholders from template variables
  const variableData: Record<string, string> = {}
  template.variables?.forEach((varName) => {
    variableData[varName] = `{YOUR_${varName.toUpperCase()}_VALUE}`
  })

  const jsonPayload = JSON.stringify({
    templateId: template.templateId,
    format: 'png',
    data: [variableData]
  }, null, 2)

  const curlCommand = `curl -X POST "${apiBaseUrl}/api/image-gen" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '${JSON.stringify({
    templateId: template.templateId,
    format: 'png',
    data: [variableData]
  })}'`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600 font-mono">&lt;/&gt;</span>
              API Usage
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Generate images for "{template.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Template Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Template ID:</span>
                <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-mono">
                  {template.templateId}
                </code>
              </div>
              <div>
                <span className="text-blue-600">Dimensions:</span>
                <span className="ml-2 text-blue-800">{template.width} × {template.height}px</span>
              </div>
            </div>
            {template.variables && template.variables.length > 0 && (
              <div className="mt-3">
                <span className="text-blue-600 text-sm">Variables:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {template.variables.map((varName) => (
                    <span
                      key={varName}
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800"
                    >
                      {varName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* API Endpoint */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-green-600">●</span>
              API Endpoint
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 relative group">
              <code className="text-green-400 text-sm">
                POST {apiBaseUrl}/api/image-gen
              </code>
              <button
                onClick={() => copyToClipboard(`${apiBaseUrl}/api/image-gen`, 'endpoint')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy endpoint"
              >
                {copiedField === 'endpoint' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* JSON Payload */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-yellow-500">●</span>
              Request Payload (JSON)
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 relative group">
              <pre className="text-gray-100 text-sm overflow-x-auto">
                <code>{jsonPayload}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(jsonPayload, 'json')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy JSON"
              >
                {copiedField === 'json' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The <code className="bg-gray-100 px-1 rounded">data</code> array can contain multiple objects to generate multiple images in one request.
            </p>
          </div>

          {/* cURL Example */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-purple-500">●</span>
              cURL Example
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 relative group">
              <pre className="text-gray-100 text-sm overflow-x-auto whitespace-pre-wrap">
                <code>{curlCommand}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(curlCommand, 'curl')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy cURL"
              >
                {copiedField === 'curl' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Response Format */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-cyan-500">●</span>
              Response Format
            </h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-gray-100 text-sm overflow-x-auto">
                <code>{JSON.stringify({
                  jobId: "job_xxxxxxxxxx",
                  status: "completed",
                  images: [
                    {
                      index: 0,
                      url: "/output/job_xxxxxxxxxx_0.png"
                    }
                  ]
                }, null, 2)}</code>
              </pre>
            </div>
          </div>

          {/* Headers */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-2">Required Headers</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>
                <code className="bg-amber-100 px-1.5 py-0.5 rounded">Content-Type: application/json</code>
              </li>
              <li>
                <code className="bg-amber-100 px-1.5 py-0.5 rounded">X-API-Key: YOUR_API_KEY</code>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
