import { Router, Request, Response } from 'express'
import { nanoid } from 'nanoid'
import { Template } from '../models/Template'

const router = Router()

// Helper to extract variables from fabricJson
function extractVariables(fabricJson: { objects?: Array<{ data?: { isDynamic?: boolean; variableName?: string } }> }): string[] {
  const variables: string[] = []
  
  if (fabricJson?.objects) {
    for (const obj of fabricJson.objects) {
      if (obj.data?.isDynamic && obj.data?.variableName) {
        variables.push(obj.data.variableName)
      }
    }
  }
  
  return [...new Set(variables)] // Remove duplicates
}

// GET /api/templates - List all templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await Template.find()
      .select('-fabricJson') // Exclude large JSON for list view
      .sort({ updatedAt: -1 })
    res.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
})

// GET /api/templates/:id - Get single template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id })
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }
    
    res.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    res.status(500).json({ error: 'Failed to fetch template' })
  }
})

// POST /api/templates - Create new template
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, width, height, fabricJson, previewDataUrl } = req.body

    if (!name || !fabricJson) {
      return res.status(400).json({ error: 'Name and fabricJson are required' })
    }

    const templateId = `tmpl_${nanoid(10)}`
    const variables = extractVariables(fabricJson)

    const template = new Template({
      templateId,
      name,
      width: width || 1080,
      height: height || 1080,
      fabricJson,
      variables,
      previewUrl: previewDataUrl || undefined,
    })

    await template.save()

    res.status(201).json({
      templateId: template.templateId,
      name: template.name,
      width: template.width,
      height: template.height,
      variables: template.variables,
      previewUrl: template.previewUrl,
      createdAt: template.createdAt,
    })
  } catch (error) {
    console.error('Error creating template:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
})

// PUT /api/templates/:id - Update template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, width, height, fabricJson, previewDataUrl } = req.body
    
    const template = await Template.findOne({ templateId: req.params.id })
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    if (name) template.name = name
    if (width) template.width = width
    if (height) template.height = height
    if (fabricJson) {
      template.fabricJson = fabricJson
      template.variables = extractVariables(fabricJson)
    }
    if (previewDataUrl) {
      template.previewUrl = previewDataUrl
    }

    await template.save()

    res.json({
      templateId: template.templateId,
      name: template.name,
      width: template.width,
      height: template.height,
      variables: template.variables,
      previewUrl: template.previewUrl,
      updatedAt: template.updatedAt,
    })
  } catch (error) {
    console.error('Error updating template:', error)
    res.status(500).json({ error: 'Failed to update template' })
  }
})

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await Template.deleteOne({ templateId: req.params.id })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting template:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
})

export default router
