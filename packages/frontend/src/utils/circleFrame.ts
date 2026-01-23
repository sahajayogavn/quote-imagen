import { Circle, Group, Text, FabricImage, Canvas, FabricObject, Rect, LayoutManager, FixedLayout } from 'fabric'

export interface CircleFrameData {
  type: 'circleFrame'
  hasImage: boolean
  imageDataUrl: string | null
  imageScale: number
  imageOffsetX: number
  imageOffsetY: number
  originalWidth?: number
  originalHeight?: number
  frameRadius?: number
}

export interface CircleFrame extends Group {
  data: CircleFrameData
}

/**
 * Calculate default frame radius based on canvas width (100% of canvas width as diameter)
 * Previously was 20%, now 5x larger (100%)
 */
export const getDefaultFrameRadius = (canvasWidth: number): number => {
  return (canvasWidth * 1.00) / 2
}

/**
 * Create a circle frame with a placeholder
 * @param canvas - The Fabric canvas
 * @param x - X position
 * @param y - Y position
 * @param radius - Radius of the frame (optional, defaults to 20% of canvas width)
 * @param canvasWidth - Canvas width for calculating default size
 */
export const createCircleFrame = (
  canvas: Canvas,
  x: number = 100,
  y: number = 100,
  radius?: number,
  canvasWidth?: number
): CircleFrame => {
  // Calculate radius: use provided radius, or 20% of canvas width, or fallback to 100
  const frameRadius = radius ?? (canvasWidth ? getDefaultFrameRadius(canvasWidth) : 100)
  const diameter = frameRadius * 2
  
  // Placeholder circle (dashed stroke, transparent fill)
  const frameCircle = new Circle({
    radius: frameRadius,
    fill: 'rgba(200, 200, 200, 0.3)',
    stroke: '#999',
    strokeDashArray: [5, 5],
    strokeWidth: 2,
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  })

  // Placeholder text
  const placeholder = new Text('Drop Image', {
    fontSize: 14,
    fill: '#666',
    originX: 'center',
    originY: 'center',
    fontFamily: 'Arial',
    left: 0,
    top: 0,
  })

  // Create a transparent bounding rectangle that defines the group size
  // This ensures the resize boundary tightly fits the circular frame
  const boundingRect = new Rect({
    width: diameter,
    height: diameter,
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    evented: false,
    selectable: false,
  })

  // Group them with boundingRect first to ensure proper bounding box calculation
  const frame = new Group([boundingRect, frameCircle, placeholder], {
    left: x,
    top: y,
  }) as CircleFrame

  // Set custom data
  frame.data = {
    type: 'circleFrame',
    hasImage: false,
    imageDataUrl: null,
    imageScale: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
  }

  canvas.add(frame)
  canvas.setActiveObject(frame)
  canvas.requestRenderAll()

  return frame
}

/**
 * Create a framed image Group with proper bounding box
 * This is the core function that creates a Group containing:
 * 1. The image scaled to cover the frame
 * 2. A transparent bounding rectangle that constrains the group's bounding box
 * The Group gets the circular clipPath so only the circular area is visible
 */
const createFramedImageGroup = (
  img: FabricImage,
  imageUrl: string,
  frameRadius: number,
  centerX: number,
  centerY: number
): Group => {
  const diameter = frameRadius * 2
  const imgWidth = img.width || 100
  const imgHeight = img.height || 100
  
  // Calculate the cover scale - image must cover the circle
  const coverScale = Math.max(
    diameter / imgWidth,
    diameter / imgHeight
  )
  
  // CRITICAL: Apply clipPath to the image BEFORE creating the group
  // This ensures the image's effective bounds are constrained to the circle
  // Without this, the image's scaled dimensions would extend beyond the frame
  const imageClipPath = new Circle({
    radius: frameRadius,
    originX: 'center',
    originY: 'center',
  })
  
  // Scale the image to cover the frame, centered at origin
  // Apply clipPath to constrain its effective bounds
  img.set({
    scaleX: coverScale,
    scaleY: coverScale,
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    clipPath: imageClipPath,
  })
  
  // Create a transparent bounding rectangle that defines the group size
  // This rectangle constrains the group's bounding box to exactly diameter × diameter
  const boundingRect = new Rect({
    width: diameter,
    height: diameter,
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    evented: false,
    selectable: false,
  })
  
  // Create circular clip path for the entire group
  const groupClipPath = new Circle({
    radius: frameRadius,
    originX: 'center',
    originY: 'center',
  })
  
  // Create group containing both bounding rect and image
  // IMPORTANT: boundingRect is first to establish the initial bounds,
  // then img (which is clipped and won't extend bounds)
  // Use FixedLayout strategy to prevent the group from recalculating bounds based on children
  const framedImage = new Group([boundingRect, img], {
    left: centerX,
    top: centerY,
    originX: 'center',
    originY: 'center',
    clipPath: groupClipPath,
    subTargetCheck: false, // Treat as single object
    interactive: false, // Prevent selecting children
    layoutManager: new LayoutManager(new FixedLayout()), // Use FixedLayout to prevent bounds recalculation
  })
  
  // CRITICAL FIX: Force the group's dimensions to exactly match the frame diameter
  // This must be done AFTER creation because Group() calculates initial bounds from children
  // The FixedLayout will prevent future recalculations
  framedImage.set({
    width: diameter,
    height: diameter,
  })
  
  // Recalculate the object's coordinates based on the new dimensions
  framedImage.setCoords()
  
  // Set data after creation (TypeScript doesn't allow it in constructor)
  ;(framedImage as any).data = {
    type: 'circleFrame',
    hasImage: true,
    imageDataUrl: imageUrl,
    imageScale: coverScale,
    imageOffsetX: 0,
    imageOffsetY: 0,
    originalWidth: imgWidth,
    originalHeight: imgHeight,
    frameRadius: frameRadius,
    coverScale: coverScale,
  }
  
  return framedImage
}

/**
 * Add an image to a circle frame
 * Uses Group-based approach to ensure bounding box matches frame dimensions exactly
 */
export const addImageToFrame = async (
  canvas: Canvas,
  frame: CircleFrame,
  imageUrl: string
): Promise<void> => {
  // Get current frame dimensions
  const frameWidth = frame.width || 200
  const frameHeight = frame.height || 200
  const frameScaleX = frame.scaleX || 1
  const frameScaleY = frame.scaleY || 1
  
  // Actual rendered dimensions
  const actualWidth = frameWidth * frameScaleX
  const actualHeight = frameHeight * frameScaleY
  const frameRadius = Math.min(actualWidth, actualHeight) / 2

  // Get frame position (center of the frame)
  const frameLeft = frame.left || 0
  const frameTop = frame.top || 0
  const centerX = frameLeft + actualWidth / 2
  const centerY = frameTop + actualHeight / 2

  // Load the image
  const img = await FabricImage.fromURL(imageUrl)

  // Remove the old frame
  canvas.remove(frame)

  // Create the framed image group
  const framedImage = createFramedImageGroup(img, imageUrl, frameRadius, centerX, centerY)

  canvas.add(framedImage)
  canvas.setActiveObject(framedImage)
  canvas.requestRenderAll()
}

/**
 * Check if an object is a circle frame
 */
export const isCircleFrame = (obj: FabricObject | null): boolean => {
  if (!obj) return false
  const data = (obj as any).data
  return data?.type === 'circleFrame'
}

/**
 * Check if a circle frame has an image
 */
export const circleFrameHasImage = (obj: FabricObject | null): boolean => {
  if (!isCircleFrame(obj)) return false
  const data = (obj as any).data
  return data?.hasImage === true
}

/**
 * Update image position within its circle frame (for edit mode)
 */
export const updateFrameImageOffset = (
  canvas: Canvas,
  img: FabricImage,
  offsetX: number,
  offsetY: number
): void => {
  const data = (img as any).data
  if (!data || data.type !== 'circleFrame' || !data.hasImage) return

  const radius = data.frameRadius || 100

  // Update the clip path position (moves the visible area)
  const clipCircle = new Circle({
    radius: radius,
    left: -offsetX,
    top: -offsetY,
    originX: 'center',
    originY: 'center',
  })

  img.set('clipPath', clipCircle)

  // Store offset in data
  data.imageOffsetX = offsetX
  data.imageOffsetY = offsetY
  img.set('data', data)

  canvas.requestRenderAll()
}

/**
 * Update image scale within its circle frame (for edit mode)
 */
export const updateFrameImageScale = (
  canvas: Canvas,
  img: FabricImage,
  scale: number
): void => {
  const data = (img as any).data
  if (!data || data.type !== 'circleFrame' || !data.hasImage) return

  // Minimum scale to cover the frame
  const radius = data.frameRadius || 100
  const imgWidth = data.originalWidth || 100
  const imgHeight = data.originalHeight || 100
  const diameter = radius * 2
  const scaleX = diameter / imgWidth
  const scaleY = diameter / imgHeight
  const minScale = Math.max(scaleX, scaleY)

  // Ensure scale doesn't go below minimum
  const finalScale = Math.max(scale, minScale)

  img.set({
    scaleX: finalScale,
    scaleY: finalScale,
  })

  // Store scale in data
  data.imageScale = finalScale
  img.set('data', data)

  canvas.requestRenderAll()
}

/**
 * Replace image in a circle frame - uses Group-based approach for proper bounding box
 */
export const replaceFrameImage = async (
  canvas: Canvas,
  framedGroup: FabricObject,
  newImageUrl: string
): Promise<void> => {
  const data = (framedGroup as any).data
  if (!data || data.type !== 'circleFrame') return

  const radius = data.frameRadius || 100
  const left = framedGroup.left || 0
  const top = framedGroup.top || 0

  // Load new image
  const newImg = await FabricImage.fromURL(newImageUrl)

  // Remove old group
  canvas.remove(framedGroup)

  // Create new framed image group at the same position
  const framedImage = createFramedImageGroup(newImg, newImageUrl, radius, left, top)

  canvas.add(framedImage)
  canvas.setActiveObject(framedImage)
  canvas.requestRenderAll()
}

/**
 * Remove image from circle frame, returning to placeholder
 * Now works with Group-based framed images
 */
export const removeFrameImage = (
  canvas: Canvas,
  framedGroup: FabricObject
): void => {
  const data = (framedGroup as any).data
  if (!data || data.type !== 'circleFrame') return

  const radius = data.frameRadius || 100
  const left = framedGroup.left || 0
  const top = framedGroup.top || 0

  // Remove the framed group
  canvas.remove(framedGroup)

  // Create new empty frame at the center position (since Group uses center origin)
  // Convert from center to top-left coordinates
  createCircleFrame(canvas, left - radius, top - radius, radius)
}

/**
 * Get the frame radius from a circle frame object
 */
export const getFrameRadius = (obj: FabricObject): number => {
  const data = (obj as any).data
  if (data?.frameRadius) return data.frameRadius
  
  // If it's a group (empty frame), calculate from dimensions
  if (obj.type === 'group') {
    const width = obj.width || 200
    const height = obj.height || 200
    return Math.min(width, height) / 2
  }
  
  return 100
}

/**
 * Resize a circle frame - recreates group with new dimensions for proper bounding box
 */
export const resizeCircleFrame = async (
  canvas: Canvas,
  frame: FabricObject,
  newRadius: number
): Promise<void> => {
  const data = (frame as any).data
  if (!data || data.type !== 'circleFrame') return

  const left = frame.left || 0
  const top = frame.top || 0

  if (data.hasImage) {
    // For framed images, need to recreate the group with new radius
    const imageUrl = data.imageDataUrl
    if (!imageUrl) return

    // Remove old group
    canvas.remove(frame)

    // Load image and create new group with new radius
    const img = await FabricImage.fromURL(imageUrl)
    const framedImage = createFramedImageGroup(img, imageUrl, newRadius, left, top)

    canvas.add(framedImage)
    canvas.setActiveObject(framedImage)
  } else {
    // For empty frames, recreate the placeholder group
    canvas.remove(frame)
    createCircleFrame(canvas, left - newRadius, top - newRadius, newRadius)
  }

  canvas.requestRenderAll()
}

/**
 * Detach image from a circle frame - creates a standalone image
 * and leaves an empty frame behind
 * Works with Group-based framed images
 */
export const detachImageFromFrame = async (
  canvas: Canvas,
  framedGroup: FabricObject
): Promise<FabricImage | null> => {
  const data = (framedGroup as any).data
  if (!data || data.type !== 'circleFrame' || !data.hasImage) return null

  const radius = data.frameRadius || 100
  const imageUrl = data.imageDataUrl
  const left = framedGroup.left || 0
  const top = framedGroup.top || 0

  if (!imageUrl) return null

  // Load the original image
  const newImg = await FabricImage.fromURL(imageUrl)

  // Position the detached image near the frame
  const originalWidth = data.originalWidth || newImg.width || 100
  const originalHeight = data.originalHeight || newImg.height || 100
  
  // Scale to a reasonable size (similar to when adding a new image)
  const maxSize = 400
  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1)

  newImg.set({
    left: left + radius * 2 + 20, // Place to the right of the frame (Group uses center origin)
    top: top - radius, // Align with top of frame
    scaleX: scale,
    scaleY: scale,
    originX: 'left',
    originY: 'top',
    // Clear circle frame data - this is now a regular image
  })
  ;(newImg as any).data = {}

  // Remove the framed group
  canvas.remove(framedGroup)

  // Create an empty frame at the original location (convert from center to top-left)
  createCircleFrame(canvas, left - radius, top - radius, radius)

  // Add the detached image
  canvas.add(newImg)
  canvas.setActiveObject(newImg)
  canvas.requestRenderAll()

  return newImg
}

/**
 * Check if a point is inside a circle frame
 */
export const isPointInFrame = (
  frame: FabricObject,
  x: number,
  y: number
): boolean => {
  if (!isCircleFrame(frame)) return false
  
  const data = (frame as any).data
  const frameLeft = frame.left || 0
  const frameTop = frame.top || 0
  
  let centerX: number
  let centerY: number
  let radius: number

  if (data?.hasImage) {
    // For images with frame (origin is center)
    centerX = frameLeft
    centerY = frameTop
    radius = data.frameRadius || 100
  } else {
    // For empty frame groups (origin is top-left by default)
    const width = frame.width || 200
    const height = frame.height || 200
    radius = Math.min(width, height) / 2
    centerX = frameLeft + width / 2
    centerY = frameTop + height / 2
  }

  // Check if point is within the circle
  const dx = x - centerX
  const dy = y - centerY
  return (dx * dx + dy * dy) <= (radius * radius)
}

/**
 * Find a frame at the given canvas coordinates
 */
export const findFrameAtPosition = (
  canvas: Canvas,
  x: number,
  y: number
): FabricObject | null => {
  const objects = canvas.getObjects()
  
  // Search in reverse order (top-most first)
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (isCircleFrame(obj) && !circleFrameHasImage(obj)) {
      if (isPointInFrame(obj, x, y)) {
        return obj
      }
    }
  }
  
  return null
}

/**
 * Drop an image onto a frame - preserves frame position and dimensions
 * CRITICAL: The frame's exact size and position must be preserved.
 *
 * KEY FIX: Uses Group-based approach to ensure bounding box matches frame dimensions exactly.
 * The Group contains:
 * 1. A transparent bounding rectangle that constrains the group's bounding box
 * 2. The image scaled to cover the frame
 * The Group gets the circular clipPath so only the circular area is visible.
 */
export const dropImageOnFrame = async (
  canvas: Canvas,
  image: FabricImage,
  frame: FabricObject
): Promise<boolean> => {
  if (!isCircleFrame(frame) || circleFrameHasImage(frame)) {
    return false
  }

  // Get image source
  const element = image.getElement() as HTMLImageElement
  const imageUrl = element?.src

  if (!imageUrl) return false

  // CRITICAL: Capture the ACTUAL rendered frame dimensions BEFORE any modifications
  // Frame dimensions must account for scaleX/scaleY (user may have resized the frame)
  const frameLeft = frame.left || 0
  const frameTop = frame.top || 0
  const frameScaleX = frame.scaleX || 1
  const frameScaleY = frame.scaleY || 1
  const frameUnscaledWidth = frame.width || 200
  const frameUnscaledHeight = frame.height || 200
  
  // The ACTUAL rendered size of the frame (what the user sees)
  const frameWidth = frameUnscaledWidth * frameScaleX
  const frameHeight = frameUnscaledHeight * frameScaleY
  
  // The frame radius is based on the ACTUAL rendered size
  const frameRadius = Math.min(frameWidth, frameHeight) / 2

  // Load the image fresh (don't reuse the dragged image as it may have transformations)
  const img = await FabricImage.fromURL(imageUrl)

  // Remove the old frame FIRST (before adding the new group)
  canvas.remove(frame)

  // Position at the original frame's center location
  // Frame's left/top is the top-left corner, so we add half the RENDERED width/height to get center
  const frameCenterX = frameLeft + frameWidth / 2
  const frameCenterY = frameTop + frameHeight / 2

  // Create the framed image group using the helper function
  const framedImage = createFramedImageGroup(img, imageUrl, frameRadius, frameCenterX, frameCenterY)

  canvas.add(framedImage)
  canvas.setActiveObject(framedImage)

  // Remove the original dragged image
  canvas.remove(image)
  canvas.requestRenderAll()

  return true
}

// Reference to store the mask outline while editing
let maskOutlineRef: Circle | null = null

/**
 * Enter frame edit mode - shows full image with mask boundary outline
 * @param canvas - The Fabric canvas
 * @param framedImage - The framed image object
 * @returns The original clipPath and state needed for restoration
 */
export const enterFrameEditMode = (
  canvas: Canvas,
  framedImage: FabricImage
): { savedClipPath: any; originalState: { left: number; top: number; scaleX: number; scaleY: number } } | null => {
  const data = (framedImage as any).data
  if (!data || data.type !== 'circleFrame' || !data.hasImage) return null

  const radius = data.frameRadius || 100
  const offsetX = data.imageOffsetX || 0
  const offsetY = data.imageOffsetY || 0
  
  // Save original state
  const originalState = {
    left: framedImage.left || 0,
    top: framedImage.top || 0,
    scaleX: framedImage.scaleX || 1,
    scaleY: framedImage.scaleY || 1,
  }
  
  // Save the current clipPath
  const savedClipPath = framedImage.clipPath

  // Temporarily remove clipPath to show full image
  framedImage.set('clipPath', undefined)

  // Create a visual overlay showing the mask boundary
  // Position it at the frame center (which is where the visible area should be)
  const frameCenter = {
    x: originalState.left - offsetX,
    y: originalState.top - offsetY,
  }
  
  maskOutlineRef = new Circle({
    radius: radius,
    left: frameCenter.x,
    top: frameCenter.y,
    originX: 'center',
    originY: 'center',
    fill: 'transparent',
    stroke: 'rgba(59, 130, 246, 0.8)', // Blue color
    strokeWidth: 3,
    strokeDashArray: [8, 4],
    evented: false,
    selectable: false,
    excludeFromExport: true,
  })
  
  // Add a semi-transparent overlay outside the mask
  // (We'll skip this for simplicity - the dashed circle provides good visual feedback)
  
  canvas.add(maskOutlineRef)
  canvas.bringObjectToFront(maskOutlineRef)
  
  // Unlock the image so it can be dragged/scaled
  framedImage.set({
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: true, // Keep rotation locked for now
    lockScalingX: false,
    lockScalingY: false,
    hasControls: true,
    hasBorders: true,
    strokeWidth: 2,
    stroke: 'rgba(59, 130, 246, 0.8)',
  })

  canvas.requestRenderAll()
  
  return { savedClipPath, originalState }
}

/**
 * Exit frame edit mode - restores clipPath and calculates new offsets
 * @param canvas - The Fabric canvas  
 * @param framedImage - The framed image object
 * @param savedClipPath - The original clipPath to restore
 * @param originalFrameCenter - The original frame center position
 */
export const exitFrameEditModeVisual = (
  canvas: Canvas,
  framedImage: FabricImage,
  savedClipPath: any,
  originalFrameCenter: { x: number; y: number }
): void => {
  const data = (framedImage as any).data
  if (!data || data.type !== 'circleFrame' || !data.hasImage) return

  const radius = data.frameRadius || 100
  
  // Calculate the new offset based on how the image was moved
  // The image's current position relative to the original frame center
  const currentLeft = framedImage.left || 0
  const currentTop = framedImage.top || 0
  const currentScaleX = framedImage.scaleX || 1
  
  // Calculate offset: how far the image center is from where it should be for the frame
  const newOffsetX = currentLeft - originalFrameCenter.x
  const newOffsetY = currentTop - originalFrameCenter.y
  
  // Check if we need to calculate scale constraint
  const imgWidth = data.originalWidth || 100
  const imgHeight = data.originalHeight || 100
  const diameter = radius * 2
  const minScaleX = diameter / imgWidth
  const minScaleY = diameter / imgHeight
  const minScale = Math.max(minScaleX, minScaleY)
  
  // Ensure the scale doesn't go below minimum (cover constraint)
  const finalScale = Math.max(currentScaleX, minScale)
  
  // Apply the scale
  framedImage.set({
    scaleX: finalScale,
    scaleY: finalScale,
  })
  
  // Create a new clipPath with the correct offset
  const newClipPath = new Circle({
    radius: radius,
    left: -newOffsetX / finalScale,  // Adjust offset for scale
    top: -newOffsetY / finalScale,
    originX: 'center',
    originY: 'center',
  })
  
  // Restore the clipPath
  framedImage.set('clipPath', newClipPath)
  
  // Update data with new offset and scale
  data.imageOffsetX = newOffsetX
  data.imageOffsetY = newOffsetY
  data.imageScale = finalScale
  framedImage.set('data', data)
  
  // Remove visual indicators
  framedImage.set({
    strokeWidth: 0,
    stroke: null,
  })
  
  // Lock movement again (the frame moves as a whole when not editing)
  framedImage.set({
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false, 
    lockScalingY: false,
  })
  
  // Remove the mask outline
  if (maskOutlineRef) {
    canvas.remove(maskOutlineRef)
    maskOutlineRef = null
  }
  
  canvas.requestRenderAll()
}

/**
 * Update mask outline position to match the frame center during edit
 * Called during image movement to show where the mask will be
 */
export const updateMaskOutlinePosition = (
  canvas: Canvas,
  framedImage: FabricImage,
  originalFrameCenter: { x: number; y: number }
): void => {
  // The mask outline should stay at the original frame center
  // while the image moves around
  if (maskOutlineRef) {
    maskOutlineRef.set({
      left: originalFrameCenter.x,
      top: originalFrameCenter.y,
    })
    canvas.bringObjectToFront(maskOutlineRef)
    canvas.requestRenderAll()
  }
}

/**
 * Get the current mask outline reference
 */
export const getMaskOutline = (): Circle | null => maskOutlineRef

/**
 * Clear the mask outline reference
 */
export const clearMaskOutline = (canvas: Canvas): void => {
  if (maskOutlineRef) {
    canvas.remove(maskOutlineRef)
    maskOutlineRef = null
  }
}
