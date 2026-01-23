import { Router, Request, Response } from 'express'
import { nanoid } from 'nanoid'
import * as path from 'path'
import { Template } from '../models/Template'
import { Job } from '../models/Job'
import { renderImage } from '../services/renderer'

const router = Router()

interface GenerateRequest {
  templateId: string
  format?: 'png' | 'jpeg'
  data: Record<string, string>[]
}

// POST /api/image-gen - Generate images from template
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { templateId, format = 'png', data } = req.body as GenerateRequest

    // Validate request
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' })
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'data array is required and must not be empty' })
    }

    // Find template
    const template = await Template.findOne({ templateId })
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Validate that data includes required variables
    const missingVars = template.variables.filter(
      (v) => !data.every((d) => d[v] !== undefined)
    )
    if (missingVars.length > 0) {
      return res.status(400).json({
        error: `Missing required variables: ${missingVars.join(', ')}`,
      })
    }

    // Create job record
    const jobId = `job_${nanoid(10)}`
    const outputDir = process.env.OUTPUT_DIR || '/app/output'

    const job = new Job({
      jobId,
      templateId,
      status: 'processing',
      format,
      totalItems: data.length,
      processedItems: 0,
      outputPaths: [],
    })
    await job.save()

    // Generate images synchronously
    const images: Array<{
      index: number
      url: string
      base64: string
    }> = []

    for (let i = 0; i < data.length; i++) {
      const outputFilename = `${jobId}_${i}.${format}`
      const outputPath = path.join(outputDir, outputFilename)

      try {
        const base64 = await renderImage({
          fabricJson: template.fabricJson,
          width: template.width,
          height: template.height,
          data: data[i],
          format,
          outputPath,
        })

        images.push({
          index: i,
          url: `/output/${outputFilename}`,
          base64,
        })

        // Update job progress
        job.processedItems = i + 1
        job.outputPaths.push(outputPath)
        await job.save()
      } catch (renderError) {
        console.error(`Error rendering image ${i}:`, renderError)
        job.errorMessages.push(`Image ${i}: ${(renderError as Error).message}`)
      }
    }

    // Mark job as completed
    job.status = job.errorMessages.length > 0 && images.length === 0 ? 'failed' : 'completed'
    job.completedAt = new Date()
    await job.save()

    const duration = Date.now() - startTime

    res.json({
      jobId,
      status: job.status,
      totalItems: data.length,
      processedItems: images.length,
      duration: `${duration}ms`,
      images,
      errors: job.errorMessages.length > 0 ? job.errorMessages : undefined,
    })
  } catch (error) {
    console.error('Error in image generation:', error)
    res.status(500).json({ error: 'Failed to generate images' })
  }
})

// GET /api/image-gen/:jobId - Get job status
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await Job.findOne({ jobId: req.params.jobId })
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    res.json({
      jobId: job.jobId,
      templateId: job.templateId,
      status: job.status,
      format: job.format,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      errors: job.errorMessages.length > 0 ? job.errorMessages : undefined,
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    res.status(500).json({ error: 'Failed to fetch job' })
  }
})

export default router
