import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'

let browser: Browser | null = null

export async function initBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
  }
  return browser
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

interface RenderOptions {
  fabricJson: unknown
  width: number
  height: number
  data: Record<string, string>
  format: 'png' | 'jpeg'
  outputPath: string
}

export async function renderImage(options: RenderOptions): Promise<string> {
  const { fabricJson, width, height, data, format, outputPath } = options

  const browserInstance = await initBrowser()
  let page: Page | null = null

  try {
    page = await browserInstance.newPage()
    
    // Set viewport to template size
    await page.setViewport({ width, height })

    // Load the render harness
    const harnessPath = path.join(__dirname, '../../assets/render.html')
    const harnessUrl = `file://${harnessPath}`
    await page.goto(harnessUrl, { waitUntil: 'networkidle0' })

    // Wait for fonts to be ready
    await page.evaluateHandle('document.fonts.ready')

    // Render the template with variable substitution
    await page.evaluate(
      (json, variables, w, h) => {
        return new Promise<void>((resolve, reject) => {
          try {
            // @ts-expect-error fabric is loaded in the page
            const canvas = new fabric.Canvas('canvas', {
              width: w,
              height: h,
              backgroundColor: '#ffffff',
            })

            // Load the JSON
            canvas.loadFromJSON(json, () => {
              // Replace variables in text objects
              const objects = canvas.getObjects()
              for (const obj of objects) {
                if (obj.type === 'textbox' && obj.data?.isDynamic && obj.data?.variableName) {
                  const varName = obj.data.variableName
                  if (variables[varName] !== undefined) {
                    obj.set('text', variables[varName])
                  }
                }
              }

              canvas.renderAll()
              resolve()
            })
          } catch (err) {
            reject(err)
          }
        })
      },
      fabricJson,
      data,
      width,
      height
    )

    // Small delay to ensure rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Take screenshot of the canvas
    const canvasElement = await page.$('#canvas')
    if (!canvasElement) {
      throw new Error('Canvas element not found')
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Screenshot the canvas
    await canvasElement.screenshot({
      path: outputPath,
      type: format,
      ...(format === 'jpeg' ? { quality: 90 } : {}),
    })

    // Read the file and return base64
    const imageBuffer = fs.readFileSync(outputPath)
    const base64 = imageBuffer.toString('base64')

    return base64
  } finally {
    if (page) {
      await page.close()
    }
  }
}
