import axios from 'axios'
import type { Template } from '../stores/templateStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
})

// Template API
export const templateApi = {
  list: async (): Promise<Template[]> => {
    const { data } = await api.get('/api/templates')
    return data
  },

  get: async (id: string): Promise<Template> => {
    const { data } = await api.get(`/api/templates/${id}`)
    return data
  },

  create: async (template: {
    name: string
    width: number
    height: number
    fabricJson: object
    previewDataUrl?: string
  }): Promise<Template> => {
    const { data } = await api.post('/api/templates', template)
    return data
  },

  update: async (
    id: string,
    updates: Partial<{
      name: string
      width: number
      height: number
      fabricJson: object
      previewDataUrl: string
    }>
  ): Promise<Template> => {
    const { data } = await api.put(`/api/templates/${id}`, updates)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/templates/${id}`)
  },
}

// Image Generation API
export interface GenerateRequest {
  templateId: string
  format?: 'png' | 'jpeg'
  data: Record<string, string>[]
}

export interface GeneratedImage {
  index: number
  url: string
  base64?: string
}

export interface GenerateResponse {
  jobId: string
  status: string
  images: GeneratedImage[]
}

export const imageGenApi = {
  generate: async (request: GenerateRequest): Promise<GenerateResponse> => {
    const { data } = await api.post('/api/image-gen', request)
    return data
  },
}

export default api
