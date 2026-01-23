import { useEffect, useState, useCallback } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useEditorStore } from '../../stores/editorStore'
import type { Textbox, FabricObject, FabricImage, Shadow, Group } from 'fabric'
import { Shadow as FabricShadow, Rect, Circle } from 'fabric'
import * as fabric from 'fabric'
import { CropModal } from '../modals/CropModal'
import { FontPicker, FontPickerButton } from '../ui/FontPicker'
import { loadGoogleFont, GOOGLE_FONTS, findFont } from '../../data/fonts'
import {
  isCircleFrame,
  circleFrameHasImage,
  addImageToFrame,
  replaceFrameImage,
  removeFrameImage,
  getFrameRadius,
  detachImageFromFrame,
  type CircleFrame,
} from '../../utils/circleFrame'

type ExtendedFabricObject = FabricObject & { data?: ObjectData }

interface CropData {
  top: number
  left: number
  width: number
  height: number
}

interface ObjectData {
  variableName?: string
  isDynamic?: boolean
  borderId?: string
  id?: string
  textEffect?: string
  cropData?: CropData
  originalWidth?: number
  originalHeight?: number
  originalSrc?: string
  // SVG/Icon specific data
  type?: 'iconify-icon' | 'svg-graphic' | 'circleFrame'
  iconifyName?: string
  svgId?: string
  svgName?: string
}

// Preset color swatches for quick color selection
const COLOR_SWATCHES = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF8800', // Orange
  '#8800FF', // Purple
  '#888888', // Gray
  '#334455', // Dark Blue Gray
]

// Stroke style options
const STROKE_STYLES = [
  { id: 'solid', label: 'Solid', dashArray: null },
  { id: 'dashed', label: 'Dashed', dashArray: [10, 5] },
  { id: 'dotted', label: 'Dotted', dashArray: [2, 4] },
]

// Text Effect Presets
interface TextEffectConfig {
  id: string
  name: string
  apply: (obj: Textbox, currentFill: string) => void
}

const TEXT_EFFECTS: TextEffectConfig[] = [
  {
    id: 'none',
    name: 'No Effect',
    apply: (obj: Textbox) => {
      obj.set({
        shadow: null,
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'basic-shadow',
    name: 'Basic Shadow',
    apply: (obj: Textbox) => {
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 5,
          offsetX: 2,
          offsetY: 2,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'long-shadow',
    name: 'Long Shadow',
    apply: (obj: Textbox) => {
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(0,0,0,0.2)',
          blur: 0,
          offsetX: 8,
          offsetY: 8,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    apply: (obj: Textbox) => {
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(255,255,255,0.8)',
          blur: 15,
          offsetX: 0,
          offsetY: 0,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    apply: (obj: Textbox, currentFill: string) => {
      // Use current text color for neon effect
      const color = currentFill || '#00ff00'
      obj.set({
        shadow: new FabricShadow({
          color: color,
          blur: 20,
          offsetX: 0,
          offsetY: 0,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'outline',
    name: 'Outline',
    apply: (obj: Textbox) => {
      obj.set({
        shadow: null,
        stroke: '#000000',
        strokeWidth: 2,
      })
    },
  },
  {
    id: '3d-effect',
    name: '3D Effect',
    apply: (obj: Textbox) => {
      // Multiple layered shadow effect for 3D depth
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(0,0,0,0.4)',
          blur: 0,
          offsetX: 4,
          offsetY: 4,
        }),
        stroke: 'rgba(0,0,0,0.2)',
        strokeWidth: 1,
      })
    },
  },
  {
    id: 'emboss',
    name: 'Emboss',
    apply: (obj: Textbox) => {
      // Emboss/raised effect with light shadow on top-left
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(255,255,255,0.5)',
          blur: 1,
          offsetX: -1,
          offsetY: -1,
        }),
        stroke: 'rgba(0,0,0,0.2)',
        strokeWidth: 0.5,
      })
    },
  },
  {
    id: 'retro',
    name: 'Retro',
    apply: (obj: Textbox) => {
      // Warm tinted shadow for vintage look
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(139,69,19,0.6)',
          blur: 3,
          offsetX: 3,
          offsetY: 3,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
  {
    id: 'echo',
    name: 'Echo',
    apply: (obj: Textbox) => {
      // Repeated offset shadow effect
      obj.set({
        shadow: new FabricShadow({
          color: 'rgba(0,0,0,0.15)',
          blur: 0,
          offsetX: 6,
          offsetY: 6,
        }),
        stroke: null,
        strokeWidth: 0,
      })
    },
  },
]

const ALIGNMENTS = [
  { value: 'left', label: 'Left', icon: '⬛⬜⬜' },
  { value: 'center', label: 'Center', icon: '⬜⬛⬜' },
  { value: 'right', label: 'Right', icon: '⬜⬜⬛' },
  { value: 'justify', label: 'Justify', icon: '⬛⬛⬛' },
]

export function PropertiesPanel() {
  const { selectedObject, canvas } = useCanvasStore()
  const { setDirty } = useEditorStore()

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [variableName, setVariableName] = useState('')
  
  // Text properties
  const [fontSize, setFontSize] = useState(40)
  const [fontColor, setFontColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Roboto')
  const [textAlign, setTextAlign] = useState('left')
  
  // Font Picker Modal State
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false)
  
  // New Text Effects State
  // Store font weight as number for font picker, map to CSS values
  const [fontWeightNum, setFontWeightNum] = useState(400)
  const [fontWeight, setFontWeight] = useState('normal')
  const [fontStyle, setFontStyle] = useState('normal')
  const [underline, setUnderline] = useState(false)
  const [linethrough, setLinethrough] = useState(false)
  const [charSpacing, setCharSpacing] = useState(0)
  const [lineHeight, setLineHeight] = useState(1.16)
  const [opacity, setOpacity] = useState(1)
  
  // Background Color
  const [hasBackgroundColor, setHasBackgroundColor] = useState(false)
  const [textBackgroundColor, setTextBackgroundColor] = useState('#ffffff')

  // Stroke/Outline
  const [hasStroke, setHasStroke] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(1)

  // Shadow properties
  const [hasShadow, setHasShadow] = useState(false)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowBlur, setShadowBlur] = useState(5)
  const [shadowOffsetX, setShadowOffsetX] = useState(2)
  const [shadowOffsetY, setShadowOffsetY] = useState(2)
  
  // Text Effect Preset
  const [currentTextEffect, setCurrentTextEffect] = useState('none')
  
  // Image properties
  const [isCircleCrop, setIsCircleCrop] = useState(false)
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 })
  const [currentCropData, setCurrentCropData] = useState<CropData | undefined>(undefined)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)

  // Border properties for Circle Crop
  const [hasBorder, setHasBorder] = useState(false)
  const [borderColor, setBorderColor] = useState('#000000')
  const [borderWidth, setBorderWidth] = useState(5)

  // Circle Frame state
  const [frameRadius, setFrameRadius] = useState(100)
  const [frameHasImage, setFrameHasImage] = useState(false)
  const [isFrameEditMode, setIsFrameEditMode] = useState(false)
  const [frameImageScale, setFrameImageScale] = useState(1)
  const [frameImageOffsetX, setFrameImageOffsetX] = useState(0)
  const [frameImageOffsetY, setFrameImageOffsetY] = useState(0)

  // SVG/Icon styling state
  const [svgFillColor, setSvgFillColor] = useState('#000000')
  const [svgStrokeColor, setSvgStrokeColor] = useState('#000000')
  const [svgStrokeWidth, setSvgStrokeWidth] = useState(0)
  const [svgStrokeStyle, setSvgStrokeStyle] = useState('solid')
  
  // Color grading/filter state
  const [svgBrightness, setSvgBrightness] = useState(0)
  const [svgContrast, setSvgContrast] = useState(0)
  const [svgSaturation, setSvgSaturation] = useState(0)
  const [svgHueRotation, setSvgHueRotation] = useState(0)

  // Update local state when selection changes
  useEffect(() => {
    if (!selectedObject) {
      setPosition({ x: 0, y: 0 })
      setSize({ width: 0, height: 0 })
      setVariableName('')
      return
    }

    setPosition({
      x: Math.round(selectedObject.left || 0),
      y: Math.round(selectedObject.top || 0),
    })
    setSize({
      width: Math.round(selectedObject.width! * (selectedObject.scaleX || 1)),
      height: Math.round(selectedObject.height! * (selectedObject.scaleY || 1)),
    })
    setOpacity(selectedObject.opacity !== undefined ? selectedObject.opacity : 1)

    const obj = selectedObject as ExtendedFabricObject
    const data = obj.data
    setVariableName(data?.variableName || '')

    // Text properties
    if (isTextObject) {
      const textObj = selectedObject as Textbox
      setFontSize(textObj.fontSize || 40)
      setFontColor(textObj.fill as string || '#000000')
      const objFontFamily = textObj.fontFamily || 'Roboto'
      setFontFamily(objFontFamily)
      setTextAlign(textObj.textAlign || 'left')
      
      // Load the font if it's a Google font
      loadGoogleFont(objFontFamily)
      
      // New Text Effects Sync - handle numeric weight
      const objFontWeight = textObj.fontWeight
      if (typeof objFontWeight === 'number') {
        setFontWeightNum(objFontWeight)
        setFontWeight(objFontWeight >= 700 ? 'bold' : 'normal')
      } else {
        const weightStr = objFontWeight as string || 'normal'
        setFontWeight(weightStr)
        setFontWeightNum(weightStr === 'bold' ? 700 : 400)
      }
      setFontStyle(textObj.fontStyle as string || 'normal')
      setUnderline(!!textObj.underline)
      setLinethrough(!!textObj.linethrough)
      setCharSpacing(textObj.charSpacing || 0)
      setLineHeight(textObj.lineHeight || 1.16)
      
      // Background Color
      if (textObj.textBackgroundColor) {
        setHasBackgroundColor(true)
        setTextBackgroundColor(textObj.textBackgroundColor)
      } else {
        setHasBackgroundColor(false)
        setTextBackgroundColor('#ffffff')
      }

      // Stroke
      if (textObj.stroke) {
        setHasStroke(true)
        setStrokeColor(textObj.stroke as string)
        setStrokeWidth(textObj.strokeWidth || 1)
      } else {
        setHasStroke(false)
        setStrokeColor('#000000')
        setStrokeWidth(1)
      }
      
      const shadow = textObj.shadow as Shadow | null
      if (shadow) {
        setHasShadow(true)
        setShadowColor(shadow.color || '#000000')
        setShadowBlur(shadow.blur || 5)
        setShadowOffsetX(shadow.offsetX || 2)
        setShadowOffsetY(shadow.offsetY || 2)
      } else {
        setHasShadow(false)
      }
      
      // Sync text effect preset
      const objData = (textObj as ExtendedFabricObject).data
      setCurrentTextEffect(objData?.textEffect || 'none')
    }

    // Image properties
    if (isImageObject) {
      const imgObj = selectedObject as FabricImage
      const extObj = imgObj as ExtendedFabricObject
      
      // Check if clipPath is a circle (for circle crop detection)
      const clipPath = imgObj.clipPath as any
      setIsCircleCrop(clipPath && clipPath.type === 'circle')
      
      // Initialize original size values
      const el = imgObj.getElement() as HTMLImageElement
      const origW = extObj.data?.originalWidth || (el ? el.naturalWidth : imgObj.width || 0)
      const origH = extObj.data?.originalHeight || (el ? el.naturalHeight : imgObj.height || 0)
      setOriginalSize({ width: origW, height: origH })
      
      // Load current crop data from object data if exists
      if (extObj.data?.cropData) {
        setCurrentCropData(extObj.data.cropData)
      } else {
        setCurrentCropData(undefined)
      }

      // Check for border
      if (extObj.data?.borderId && canvas) {
        const borderObj = canvas.getObjects().find((o: any) => o.data?.id === extObj.data?.borderId)
        if (borderObj) {
          setHasBorder(true)
          setBorderColor(borderObj.stroke as string || '#000000')
          setBorderWidth(borderObj.strokeWidth || 5)
        } else {
          setHasBorder(false)
        }
      } else {
        setHasBorder(false)
      }
    }

    // Circle Frame properties
    if (isCircleFrame(selectedObject)) {
      const data = (selectedObject as any).data
      setFrameRadius(getFrameRadius(selectedObject))
      setFrameHasImage(circleFrameHasImage(selectedObject))
      if (data) {
        setFrameImageScale(data.imageScale || 1)
        setFrameImageOffsetX(data.imageOffsetX || 0)
        setFrameImageOffsetY(data.imageOffsetY || 0)
      }
    }

    // SVG/Icon properties
    if (isSvgOrIcon(selectedObject)) {
      const children = getSvgChildren(selectedObject)
      
      // Get fill color from first child that has fill
      const firstFilledChild = children.find((child: FabricObject) => {
        const fill = (child as any).fill
        return fill && fill !== 'none' && fill !== 'transparent'
      })
      if (firstFilledChild) {
        const fill = (firstFilledChild as any).fill
        if (typeof fill === 'string') {
          setSvgFillColor(fill)
        }
      }
      
      // Get stroke properties from first child that has stroke
      const firstStrokedChild = children.find((child: FabricObject) => {
        const stroke = (child as any).stroke
        return stroke && stroke !== 'none' && stroke !== 'transparent'
      })
      if (firstStrokedChild) {
        const stroke = (firstStrokedChild as any).stroke
        const strokeW = (firstStrokedChild as any).strokeWidth || 0
        const dashArray = (firstStrokedChild as any).strokeDashArray
        if (typeof stroke === 'string') {
          setSvgStrokeColor(stroke)
        }
        setSvgStrokeWidth(strokeW)
        // Determine stroke style from dash array
        if (dashArray) {
          if (dashArray[0] <= 3) {
            setSvgStrokeStyle('dotted')
          } else {
            setSvgStrokeStyle('dashed')
          }
        } else {
          setSvgStrokeStyle('solid')
        }
      } else {
        setSvgStrokeWidth(0)
        setSvgStrokeStyle('solid')
      }

      // Get filter values - reset to defaults
      // Fabric.js filters are stored on the group
      setSvgBrightness(0)
      setSvgContrast(0)
      setSvgSaturation(0)
      setSvgHueRotation(0)
    }
  }, [selectedObject, canvas])

  // Helper function to detect if object is an SVG/Icon group or path
  // Note: Fabric.js returns a 'path' for single-element SVGs, or a 'group' for multi-element SVGs
  const isSvgOrIcon = (obj: FabricObject | null): boolean => {
    if (!obj) return false
    // Check for both 'group' (multi-element SVG) and 'path' (single-element SVG)
    if (obj.type !== 'group' && obj.type !== 'path') return false
    const data = (obj as ExtendedFabricObject).data
    return data?.type === 'iconify-icon' || data?.type === 'svg-graphic'
  }

  // Helper function to get child objects from an SVG (works for both group and path)
  const getSvgChildren = (obj: FabricObject): FabricObject[] => {
    if (obj.type === 'group') {
      return (obj as Group).getObjects()
    }
    // For 'path' type, return the object itself as an array
    return [obj]
  }

  const updateObject = (updates: Partial<FabricObject>) => {
    if (!selectedObject || !canvas) return
    selectedObject.set(updates)
    canvas.requestRenderAll()
    setDirty(true)
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    setPosition((prev) => ({ ...prev, [axis]: value }))
    updateObject({ [axis === 'x' ? 'left' : 'top']: value })
    
    // Move border if exists
    if (isImageObject && hasBorder && canvas) {
       const imgObj = selectedObject as ExtendedFabricObject
       if (imgObj.data?.borderId) {
          const borderObj = canvas.getObjects().find((o: any) => o.data?.id === imgObj.data?.borderId)
          if (borderObj) {
             // We need to account for offset if any, but usually we center them
             // Just match the position for now. 
             // Note: This only works if dragged via properties panel. 
             // Dragging on canvas handles its own movement, so we'd need event listeners there.
             borderObj.set({ [axis === 'x' ? 'left' : 'top']: value })
          }
       }
    }
  }

  const handleVariableChange = (name: string) => {
    setVariableName(name)
    if (!selectedObject) return
    const obj = selectedObject as ExtendedFabricObject
    selectedObject.set('data', {
      ...(obj.data || {}),
      variableName: name,
      isDynamic: !!name,
    })
    setDirty(true)
  }

  // Text handlers
  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    updateObject({ fontSize: size } as Partial<Textbox>)
  }

  const handleFontColorChange = (color: string) => {
    setFontColor(color)
    updateObject({ fill: color })
  }

  const handleFontFamilyChange = async (family: string) => {
    // Load the Google font first
    await loadGoogleFont(family)
    setFontFamily(family)
    updateObject({ fontFamily: family } as Partial<Textbox>)
  }

  // Handler for font weight change from FontPicker (accepts numeric weight)
  const handleFontWeightNumChange = (weight: number) => {
    setFontWeightNum(weight)
    // Update the CSS weight state
    const weightStyle = weight >= 700 ? 'bold' : 'normal'
    setFontWeight(weightStyle)
    // Apply numeric weight to Fabric.js object
    updateObject({ fontWeight: weight } as Partial<Textbox>)
  }

  const handleTextAlignChange = (align: string) => {
    setTextAlign(align)
    updateObject({ textAlign: align } as Partial<Textbox>)
  }

  // New Text Effect Handlers
  const handleToggleBold = () => {
    // Toggle between regular (400) and bold (700)
    const newWeightNum = fontWeightNum >= 700 ? 400 : 700
    const newWeight = newWeightNum >= 700 ? 'bold' : 'normal'
    setFontWeightNum(newWeightNum)
    setFontWeight(newWeight)
    // Apply numeric weight to Fabric.js object for consistency
    updateObject({ fontWeight: newWeightNum } as Partial<Textbox>)
  }

  const handleToggleItalic = () => {
    const newStyle = fontStyle === 'italic' ? 'normal' : 'italic'
    setFontStyle(newStyle)
    updateObject({ fontStyle: newStyle } as Partial<Textbox>)
  }

  const handleToggleUnderline = () => {
    const newValue = !underline
    setUnderline(newValue)
    updateObject({ underline: newValue } as Partial<Textbox>)
  }

  const handleToggleLinethrough = () => {
    const newValue = !linethrough
    setLinethrough(newValue)
    updateObject({ linethrough: newValue } as Partial<Textbox>)
  }

  const handleTransformUppercase = () => {
    if (!selectedObject || !isTextObject) return
    const textObj = selectedObject as Textbox
    if (textObj.text) {
      updateObject({ text: textObj.text.toUpperCase() } as Partial<Textbox>)
    }
  }

  const handleBackgroundColorToggle = (enabled: boolean) => {
    setHasBackgroundColor(enabled)
    const color = enabled ? textBackgroundColor : ''
    updateObject({ textBackgroundColor: color } as Partial<Textbox>)
  }

  const handleBackgroundColorChange = (color: string) => {
    setTextBackgroundColor(color)
    if (hasBackgroundColor) {
      updateObject({ textBackgroundColor: color } as Partial<Textbox>)
    }
  }

  const handleStrokeToggle = (enabled: boolean) => {
    setHasStroke(enabled)
    if (enabled) {
      updateObject({ stroke: strokeColor, strokeWidth } as Partial<Textbox>)
    } else {
      updateObject({ stroke: null, strokeWidth: 0 } as Partial<Textbox>)
    }
  }

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color)
    if (hasStroke) {
      updateObject({ stroke: color } as Partial<Textbox>)
    }
  }

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width)
    if (hasStroke) {
      updateObject({ strokeWidth: width } as Partial<Textbox>)
    }
  }

  const handleCharSpacingChange = (value: number) => {
    setCharSpacing(value)
    updateObject({ charSpacing: value } as Partial<Textbox>)
  }

  const handleLineHeightChange = (value: number) => {
    setLineHeight(value)
    updateObject({ lineHeight: value } as Partial<Textbox>)
  }

  // Text Effect Preset Handler
  const handleApplyTextEffect = (effectId: string) => {
    if (!selectedObject || !canvas || !isTextObject) return
    
    const textObj = selectedObject as Textbox
    const effect = TEXT_EFFECTS.find((e) => e.id === effectId)
    if (!effect) return
    
    // Get current fill color for effects that use it
    const currentFill = textObj.fill as string || '#000000'
    
    // Apply the effect
    effect.apply(textObj, currentFill)
    
    // Store effect name in object's data
    const obj = selectedObject as ExtendedFabricObject
    obj.set('data', {
      ...(obj.data || {}),
      textEffect: effectId,
    })
    
    setCurrentTextEffect(effectId)
    canvas.requestRenderAll()
    setDirty(true)
    
    // Sync the individual shadow/stroke state with effects for UI consistency
    const shadow = textObj.shadow as Shadow | null
    if (shadow) {
      setHasShadow(true)
      setShadowColor(shadow.color || '#000000')
      setShadowBlur(shadow.blur || 0)
      setShadowOffsetX(shadow.offsetX || 0)
      setShadowOffsetY(shadow.offsetY || 0)
    } else {
      setHasShadow(false)
    }
    
    if (textObj.stroke) {
      setHasStroke(true)
      setStrokeColor(textObj.stroke as string)
      setStrokeWidth(textObj.strokeWidth || 1)
    } else {
      setHasStroke(false)
    }
  }

  // Size handler for text objects
  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (!selectedObject || !canvas || !isTextObject) return
    const textObj = selectedObject as Textbox
    
    if (dimension === 'width') {
      // For Textbox, setting width controls text wrapping area
      textObj.set({ width: value })
      setSize((prev) => ({ ...prev, width: value }))
    } else {
      // For height, we can set minHeight constraint (Textbox auto-calculates height based on text)
      // Calculate the scale needed to achieve desired height
      const currentHeight = textObj.height! * (textObj.scaleY || 1)
      if (currentHeight > 0) {
        const newScaleY = value / textObj.height!
        textObj.set({ scaleY: newScaleY })
        setSize((prev) => ({ ...prev, height: value }))
      }
    }
    
    textObj.setCoords()
    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    updateObject({ opacity: value })
  }

  const handleShadowToggle = (enabled: boolean) => {
    setHasShadow(enabled)
    if (!selectedObject || !canvas) return
    
    if (enabled) {
      selectedObject.set('shadow', {
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY,
      })
    } else {
      selectedObject.set('shadow', null)
    }
    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleShadowChange = (property: string, value: string | number) => {
    if (!selectedObject || !canvas) return
    
    const newShadow = {
      color: property === 'color' ? value : shadowColor,
      blur: property === 'blur' ? Number(value) : shadowBlur,
      offsetX: property === 'offsetX' ? Number(value) : shadowOffsetX,
      offsetY: property === 'offsetY' ? Number(value) : shadowOffsetY,
    }
    
    if (property === 'color') setShadowColor(value as string)
    if (property === 'blur') setShadowBlur(Number(value))
    if (property === 'offsetX') setShadowOffsetX(Number(value))
    if (property === 'offsetY') setShadowOffsetY(Number(value))
    
    selectedObject.set('shadow', newShadow)
    canvas.requestRenderAll()
    setDirty(true)
  }

  // Image handlers - Fixed circle crop with proper centering
  const handleCircleCrop = (enabled: boolean) => {
    setIsCircleCrop(enabled)
    if (!selectedObject || !canvas) return
    
    const imgObj = selectedObject as FabricImage
    const imgWidth = imgObj.width || 0
    const imgHeight = imgObj.height || 0
    
    if (enabled) {
      // Create a centered circle clip path
      // The clip path is positioned relative to the image's center
      const radius = Math.min(imgWidth, imgHeight) / 2
      const clipCircle = new Circle({
        radius,
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
      })
      imgObj.set('clipPath', clipCircle)
    } else {
      // Check if there's a rectangular crop to restore
      const extObj = imgObj as ExtendedFabricObject
      if (extObj.data?.cropData) {
        // Apply rectangular crop as clipPath
        applyRectCrop(imgObj, extObj.data.cropData)
      } else {
        imgObj.set('clipPath', undefined)
      }
    }
    
    canvas.requestRenderAll()
    setDirty(true)
  }

  // Apply rectangular crop using clipPath
  const applyRectCrop = (imgObj: FabricImage, cropData: CropData) => {
    if (!canvas) return
    
    const extObj = imgObj as ExtendedFabricObject
    const el = imgObj.getElement() as HTMLImageElement
    const origW = extObj.data?.originalWidth || (el ? el.naturalWidth : imgObj.width || 0)
    const origH = extObj.data?.originalHeight || (el ? el.naturalHeight : imgObj.height || 0)
    
    // Store original dimensions if not already stored
    if (!extObj.data?.originalWidth) {
      extObj.set('data', {
        ...(extObj.data || {}),
        originalWidth: origW,
        originalHeight: origH,
      })
    }
    
    // Calculate center-relative coordinates for the crop rectangle
    // ClipPath coordinates are relative to the image center
    const clipLeft = cropData.left - (origW / 2) + (cropData.width / 2)
    const clipTop = cropData.top - (origH / 2) + (cropData.height / 2)
    
    const clipRect = new Rect({
      left: clipLeft,
      top: clipTop,
      width: cropData.width,
      height: cropData.height,
      originX: 'center',
      originY: 'center',
    })
    
    imgObj.set('clipPath', clipRect)
  }

  // Handle crop modal apply - actually crop the image data
  const handleCropApply = async (cropData: CropData) => {
    if (!selectedObject || !canvas) return
    
    const imgObj = selectedObject as FabricImage
    const extObj = imgObj as ExtendedFabricObject
    const el = imgObj.getElement() as HTMLImageElement
    
    // Get original dimensions - use stored values if available (for re-cropping)
    const storedOrigW = extObj.data?.originalWidth
    const storedOrigH = extObj.data?.originalHeight
    const storedOrigSrc = extObj.data?.originalSrc
    
    // Determine the original dimensions to use
    const origW = storedOrigW || (el ? el.naturalWidth : imgObj.width || 0)
    const origH = storedOrigH || (el ? el.naturalHeight : imgObj.height || 0)
    const originalSrc = storedOrigSrc || el?.src
    
    // Check if full image (no crop needed)
    const isFullImage = cropData.left === 0 && cropData.top === 0 &&
                       cropData.width === origW && cropData.height === origH
    
    if (isFullImage) {
      // No crop needed - restore original if we have it, or just clear crop
      if (storedOrigSrc) {
        // Restore original image
        await handleResetCrop()
      } else {
        extObj.set('data', {
          ...(extObj.data || {}),
          originalWidth: origW,
          originalHeight: origH,
          cropData: undefined,
        })
        setCurrentCropData(undefined)
        
        if (!isCircleCrop) {
          imgObj.set('clipPath', undefined)
        }
      }
      canvas.requestRenderAll()
      setDirty(true)
      return
    }
    
    // Get current position and scale before cropping
    const currentLeft = imgObj.left || 0
    const currentTop = imgObj.top || 0
    const currentScaleX = imgObj.scaleX || 1
    const currentScaleY = imgObj.scaleY || 1
    const currentAngle = imgObj.angle || 0
    
    // For re-cropping: we need to calculate position relative to original image
    // If we have a previous crop, the current position is the cropped portion's position
    // We need to recalculate based on the new crop area from original
    let cropLeftOnCanvas: number
    let cropTopOnCanvas: number
    
    if (storedOrigSrc && extObj.data?.cropData) {
      // Re-cropping: calculate position based on original image location
      // The current cropped image is at position where the old crop was
      // Original image top-left would be at: current position - (old crop offset * scale)
      const oldCrop = extObj.data.cropData
      const originalImageLeft = currentLeft - (oldCrop.left * currentScaleX)
      const originalImageTop = currentTop - (oldCrop.top * currentScaleY)
      
      // New crop position on canvas
      cropLeftOnCanvas = originalImageLeft + (cropData.left * currentScaleX)
      cropTopOnCanvas = originalImageTop + (cropData.top * currentScaleY)
    } else {
      // First time cropping: calculate based on current position
      cropLeftOnCanvas = currentLeft + (cropData.left * currentScaleX)
      cropTopOnCanvas = currentTop + (cropData.top * currentScaleY)
    }
    
    // Create a temporary canvas to crop the image
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.round(cropData.width)
    tempCanvas.height = Math.round(cropData.height)
    const ctx = tempCanvas.getContext('2d')
    
    if (!ctx) {
      console.error('Could not create canvas context')
      return
    }
    
    // If we have original source, load it for cropping
    // Otherwise use current element
    let sourceImage: HTMLImageElement
    
    if (storedOrigSrc) {
      // Load original image for re-cropping
      sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = storedOrigSrc
      })
    } else {
      // First crop - use current element
      if (!el) {
        console.error('Could not get image element')
        return
      }
      sourceImage = el
    }
    
    // Draw the cropped portion onto the temp canvas
    ctx.drawImage(
      sourceImage,
      cropData.left,      // source x
      cropData.top,       // source y
      cropData.width,     // source width
      cropData.height,    // source height
      0,                  // dest x
      0,                  // dest y
      cropData.width,     // dest width
      cropData.height     // dest height
    )
    
    // Get the cropped image data URL
    const croppedDataUrl = tempCanvas.toDataURL('image/png')
    
    // Store original dimensions and crop data before updating source
    // Keep the original source for re-cropping capability
    const dataToStore = {
      ...(extObj.data || {}),
      originalWidth: origW,
      originalHeight: origH,
      originalSrc: originalSrc, // Keep original source for potential re-crop/restore
      cropData: cropData,
    }
    
    // Update the image source with cropped data
    // setSrc returns a Promise in Fabric.js v6
    await imgObj.setSrc(croppedDataUrl)
    
    // The cropped area should appear at the same visual size it was before
    // We keep the same scale factors
    
    imgObj.set({
      left: cropLeftOnCanvas,
      top: cropTopOnCanvas,
      scaleX: currentScaleX,
      scaleY: currentScaleY,
      angle: currentAngle,
      clipPath: undefined, // Remove clipPath since image is now truly cropped
    })
    
    // Apply circle crop if enabled (on the new cropped image)
    if (isCircleCrop) {
      const newWidth = imgObj.width || cropData.width
      const newHeight = imgObj.height || cropData.height
      const radius = Math.min(newWidth, newHeight) / 2
      const clipCircle = new Circle({
        radius,
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
      })
      imgObj.set('clipPath', clipCircle)
    }
    
    // Store data after image update
    extObj.set('data', dataToStore)
    
    // Update coordinates
    imgObj.setCoords()
    
    setCurrentCropData(cropData)
    canvas.requestRenderAll()
    setDirty(true)
  }

  // Reset crop - restore original image
  const handleResetCrop = async () => {
    if (!selectedObject || !canvas) return
    
    const imgObj = selectedObject as FabricImage
    const extObj = imgObj as ExtendedFabricObject
    
    // If we have an original source, restore it
    if (extObj.data?.originalSrc) {
      const originalSrc = extObj.data.originalSrc
      const originalWidth = extObj.data.originalWidth || 0
      const originalHeight = extObj.data.originalHeight || 0
      const cropData = extObj.data.cropData
      
      // Calculate the current position of the original image's top-left corner
      // The current cropped image is positioned at the crop area's location
      // We need to move it back to where the original image would be
      const currentLeft = imgObj.left || 0
      const currentTop = imgObj.top || 0
      const currentScaleX = imgObj.scaleX || 1
      const currentScaleY = imgObj.scaleY || 1
      
      // Calculate original image position based on where the crop was applied
      let restoredLeft = currentLeft
      let restoredTop = currentTop
      
      if (cropData) {
        // The cropped image is at the position where the crop region was
        // So the original image's top-left would be offset by the crop position
        restoredLeft = currentLeft - (cropData.left * currentScaleX)
        restoredTop = currentTop - (cropData.top * currentScaleY)
      }
      
      // Restore the original image source
      await imgObj.setSrc(originalSrc)
      
      // Restore position and scale
      imgObj.set({
        left: restoredLeft,
        top: restoredTop,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        clipPath: undefined,
      })
      
      // Clear crop-related data but keep other metadata
      const newData = { ...(extObj.data || {}) }
      delete newData.cropData
      delete newData.originalSrc
      // Keep originalWidth and originalHeight for reference
      extObj.set('data', newData)
      
      imgObj.setCoords()
      
      // Re-apply circle crop on full image if enabled
      if (isCircleCrop) {
        const radius = Math.min(originalWidth, originalHeight) / 2
        const clipCircle = new Circle({
          radius,
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
        })
        imgObj.set('clipPath', clipCircle)
      }
    } else {
      // No original source stored, just clear the crop data and clipPath
      const newData = { ...(extObj.data || {}) }
      delete newData.cropData
      extObj.set('data', newData)
      
      if (isCircleCrop) {
        // Re-apply circle crop on current image dimensions
        handleCircleCrop(true)
      } else {
        imgObj.set('clipPath', undefined)
      }
    }
    
    setCurrentCropData(undefined)
    canvas.requestRenderAll()
    setDirty(true)
  }

  // Clone handler
  const handleClone = async () => {
    if (!selectedObject || !canvas) return

    const cloned = await selectedObject.clone()
    
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
      evented: true,
    })
    
    if (cloned.type === 'activeSelection') {
      cloned.canvas = canvas
      ;(cloned as any).forEachObject((obj: any) => {
        canvas.add(obj)
      })
      cloned.setCoords()
    } else {
      canvas.add(cloned)
    }
    
    canvas.setActiveObject(cloned)
    canvas.requestRenderAll()
    setDirty(true)
  }

  // Border Handlers
  const handleBorderToggle = async (enabled: boolean) => {
    setHasBorder(enabled)
    if (!selectedObject || !canvas) return
    
    const imgObj = selectedObject as ExtendedFabricObject
    
    if (enabled) {
      // Create a circle border behind the image
      const { Circle } = await import('fabric')
      const radius = (Math.min(imgObj.width!, imgObj.height!) / 2) + (borderWidth / 2)
      
      // We need a unique ID for this border to link it
      const borderId = `border-${Date.now()}`
      
      const borderCircle = new Circle({
        radius,
        fill: 'transparent',
        stroke: borderColor,
        strokeWidth: borderWidth,
        left: imgObj.left,
        top: imgObj.top,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        data: { id: borderId } as ObjectData
      })
      
      // Link image to border
      imgObj.set('data', { ...imgObj.data, borderId })
      
      // Add behind image
      const imgIndex = canvas.getObjects().indexOf(imgObj)
      canvas.insertAt(imgIndex, borderCircle)
      
    } else {
      // Remove border if exists
      if (imgObj.data?.borderId) {
        const borderObj = canvas.getObjects().find((o: any) => o.data?.id === imgObj.data?.borderId)
        if (borderObj) {
          canvas.remove(borderObj)
        }
        // Remove link
        const newData = { ...imgObj.data }
        delete newData.borderId
        imgObj.set('data', newData)
      }
    }
    
    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleBorderColorChange = (color: string) => {
    setBorderColor(color)
    if (hasBorder && canvas && selectedObject) {
       const imgObj = selectedObject as ExtendedFabricObject
       if (imgObj.data?.borderId) {
          const borderObj = canvas.getObjects().find((o: any) => o.data?.id === imgObj.data?.borderId)
          if (borderObj) {
             borderObj.set('stroke', color)
             canvas.requestRenderAll()
             setDirty(true)
          }
       }
    }
  }

  const handleBorderWidthChange = (width: number) => {
    setBorderWidth(width)
    if (hasBorder && canvas && selectedObject) {
       const imgObj = selectedObject as ExtendedFabricObject
       if (imgObj.data?.borderId) {
          const borderObj = canvas.getObjects().find((o: any) => o.data?.id === imgObj.data?.borderId)
          if (borderObj) {
             borderObj.set('strokeWidth', width)
             // Update radius to keep it tight
             const radius = (Math.min(imgObj.width!, imgObj.height!) / 2) + (width / 2)
             ;(borderObj as any).set('radius', radius)
             
             canvas.requestRenderAll()
             setDirty(true)
          }
       }
    }
  }

  // Circle Frame handlers
  const handleAddImageToFrame = () => {
    if (!selectedObject || !canvas || !isCircleFrame(selectedObject)) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string
        await addImageToFrame(canvas, selectedObject as CircleFrame, dataUrl)
        setFrameHasImage(true)
        setDirty(true)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleReplaceFrameImage = () => {
    if (!selectedObject || !canvas || !circleFrameHasImage(selectedObject)) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string
        await replaceFrameImage(canvas, selectedObject as FabricImage, dataUrl)
        setDirty(true)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleRemoveFrameImage = () => {
    if (!selectedObject || !canvas || !circleFrameHasImage(selectedObject)) return
    removeFrameImage(canvas, selectedObject as FabricImage)
    setFrameHasImage(false)
    setDirty(true)
  }

  const handleDetachImageFromFrame = async () => {
    if (!selectedObject || !canvas || !circleFrameHasImage(selectedObject)) return
    const detachedImage = await detachImageFromFrame(canvas, selectedObject as FabricImage)
    if (detachedImage) {
      // Select the detached image
      canvas.setActiveObject(detachedImage)
      setFrameHasImage(false)
      setDirty(true)
    }
  }

  const handleFrameImageScaleChange = (scale: number) => {
    setFrameImageScale(scale)
    if (!selectedObject || !canvas) return
    
    const data = (selectedObject as any).data
    if (!data || data.type !== 'circleFrame' || !data.hasImage) return

    const radius = data.frameRadius || 100
    const imgWidth = data.originalWidth || 100
    const imgHeight = data.originalHeight || 100
    const diameter = radius * 2
    const scaleX = diameter / imgWidth
    const scaleY = diameter / imgHeight
    const minScale = Math.max(scaleX, scaleY)
    const finalScale = Math.max(scale, minScale)

    selectedObject.set({
      scaleX: finalScale,
      scaleY: finalScale,
    })

    data.imageScale = finalScale
    selectedObject.set('data', data)

    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleFrameImageOffsetChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') {
      setFrameImageOffsetX(value)
    } else {
      setFrameImageOffsetY(value)
    }

    if (!selectedObject || !canvas) return
    
    const data = (selectedObject as any).data
    if (!data || data.type !== 'circleFrame' || !data.hasImage) return

    const radius = data.frameRadius || 100
    const offsetX = axis === 'x' ? value : frameImageOffsetX
    const offsetY = axis === 'y' ? value : frameImageOffsetY

    // Update clip path position
    const clipCircle = new Circle({
      radius: radius,
      left: -offsetX,
      top: -offsetY,
      originX: 'center',
      originY: 'center',
    })

    selectedObject.set('clipPath', clipCircle)

    data.imageOffsetX = offsetX
    data.imageOffsetY = offsetY
    selectedObject.set('data', data)

    canvas.requestRenderAll()
    setDirty(true)
  }

  const handleResetFrameImagePosition = () => {
    if (!selectedObject || !canvas) return
    
    const data = (selectedObject as any).data
    if (!data || data.type !== 'circleFrame' || !data.hasImage) return

    const radius = data.frameRadius || 100
    const imgWidth = data.originalWidth || 100
    const imgHeight = data.originalHeight || 100
    const diameter = radius * 2
    const scaleX = diameter / imgWidth
    const scaleY = diameter / imgHeight
    const coverScale = Math.max(scaleX, scaleY)

    selectedObject.set({
      scaleX: coverScale,
      scaleY: coverScale,
    })

    const clipCircle = new Circle({
      radius: radius,
      originX: 'center',
      originY: 'center',
    })

    selectedObject.set('clipPath', clipCircle)

    data.imageScale = coverScale
    data.imageOffsetX = 0
    data.imageOffsetY = 0
    selectedObject.set('data', data)

    setFrameImageScale(coverScale)
    setFrameImageOffsetX(0)
    setFrameImageOffsetY(0)

    canvas.requestRenderAll()
    setDirty(true)
  }

  // SVG/Icon Fill Color Handler
  const handleSvgFillColorChange = useCallback((color: string) => {
    setSvgFillColor(color)
    if (!selectedObject || !canvas || !isSvgOrIcon(selectedObject)) return
    
    const children = getSvgChildren(selectedObject)
    
    // Apply fill to all children
    children.forEach((child: FabricObject) => {
      const currentFill = (child as any).fill
      // Only change fill if it's not 'none' or 'transparent' (to preserve transparent parts)
      if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
        child.set('fill', color)
      }
    })
    
    canvas.requestRenderAll()
    setDirty(true)
  }, [selectedObject, canvas, setDirty])

  // SVG/Icon Stroke Color Handler
  const handleSvgStrokeColorChange = useCallback((color: string) => {
    setSvgStrokeColor(color)
    if (!selectedObject || !canvas || !isSvgOrIcon(selectedObject)) return
    
    const children = getSvgChildren(selectedObject)
    
    // Apply stroke color to all children
    children.forEach((child: FabricObject) => {
      if (svgStrokeWidth > 0) {
        child.set('stroke', color)
      }
    })
    
    canvas.requestRenderAll()
    setDirty(true)
  }, [selectedObject, canvas, svgStrokeWidth, setDirty])

  // SVG/Icon Stroke Width Handler
  const handleSvgStrokeWidthChange = useCallback((width: number) => {
    setSvgStrokeWidth(width)
    if (!selectedObject || !canvas || !isSvgOrIcon(selectedObject)) return
    
    const children = getSvgChildren(selectedObject)
    
    // Get dash array based on current style
    const strokeStyle = STROKE_STYLES.find(s => s.id === svgStrokeStyle)
    const dashArray = strokeStyle?.dashArray || null
    
    // Apply stroke width to all children
    children.forEach((child: FabricObject) => {
      child.set({
        strokeWidth: width,
        stroke: width > 0 ? svgStrokeColor : null,
        strokeDashArray: width > 0 ? dashArray : null,
      })
    })
    
    canvas.requestRenderAll()
    setDirty(true)
  }, [selectedObject, canvas, svgStrokeColor, svgStrokeStyle, setDirty])

  // SVG/Icon Stroke Style Handler
  const handleSvgStrokeStyleChange = useCallback((styleId: string) => {
    setSvgStrokeStyle(styleId)
    if (!selectedObject || !canvas || !isSvgOrIcon(selectedObject)) return
    
    const children = getSvgChildren(selectedObject)
    
    // Get dash array for new style
    const strokeStyle = STROKE_STYLES.find(s => s.id === styleId)
    const dashArray = strokeStyle?.dashArray || null
    
    // Apply stroke style to all children
    children.forEach((child: FabricObject) => {
      if (svgStrokeWidth > 0) {
        child.set('strokeDashArray', dashArray)
      }
    })
    
    canvas.requestRenderAll()
    setDirty(true)
  }, [selectedObject, canvas, svgStrokeWidth, setDirty])

  // SVG/Icon Brightness Handler
  const handleSvgBrightnessChange = useCallback((value: number) => {
    setSvgBrightness(value)
    applyColorGradingFilters(value, svgContrast, svgSaturation, svgHueRotation)
  }, [svgContrast, svgSaturation, svgHueRotation])

  // SVG/Icon Contrast Handler
  const handleSvgContrastChange = useCallback((value: number) => {
    setSvgContrast(value)
    applyColorGradingFilters(svgBrightness, value, svgSaturation, svgHueRotation)
  }, [svgBrightness, svgSaturation, svgHueRotation])

  // SVG/Icon Saturation Handler
  const handleSvgSaturationChange = useCallback((value: number) => {
    setSvgSaturation(value)
    applyColorGradingFilters(svgBrightness, svgContrast, value, svgHueRotation)
  }, [svgBrightness, svgContrast, svgHueRotation])

  // SVG/Icon Hue Rotation Handler
  const handleSvgHueRotationChange = useCallback((value: number) => {
    setSvgHueRotation(value)
    applyColorGradingFilters(svgBrightness, svgContrast, svgSaturation, value)
  }, [svgBrightness, svgContrast, svgSaturation])

  // Apply color grading using CSS filter on the group
  const applyColorGradingFilters = useCallback((brightness: number, contrast: number, saturation: number, hueRotation: number) => {
    if (!selectedObject || !canvas || !isSvgOrIcon(selectedObject)) return
    
    const children = getSvgChildren(selectedObject)
    
    // For SVG groups, we modify the fill colors based on the adjustments
    // Since Fabric.js filters work best on images, we'll use a different approach
    // We'll adjust the fill colors directly based on the parameters
    
    // If all values are at default (0), remove the style adjustment
    if (brightness === 0 && contrast === 0 && saturation === 0 && hueRotation === 0) {
      // Reset to original colors if stored, otherwise leave as is
      canvas.requestRenderAll()
      setDirty(true)
      return
    }

    // Apply HSL adjustments to each child's fill color
    children.forEach((child: FabricObject) => {
      const currentFill = (child as any).fill
      if (currentFill && currentFill !== 'none' && currentFill !== 'transparent' && typeof currentFill === 'string') {
        try {
          // Convert current color to HSL, apply adjustments, convert back
          const adjustedColor = adjustColor(currentFill, brightness, contrast, saturation, hueRotation)
          child.set('fill', adjustedColor)
        } catch (e) {
          // If color parsing fails, skip this child
        }
      }
    })
    
    canvas.requestRenderAll()
    setDirty(true)
  }, [selectedObject, canvas, setDirty])

  // Helper function to adjust color based on brightness, contrast, saturation, hue
  const adjustColor = (hexColor: string, brightness: number, contrast: number, saturation: number, hueRotation: number): string => {
    // Parse hex color
    let r, g, b
    if (hexColor.startsWith('#')) {
      const hex = hexColor.slice(1)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
      }
    } else if (hexColor.startsWith('rgb')) {
      const match = hexColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        r = parseInt(match[1])
        g = parseInt(match[2])
        b = parseInt(match[3])
      } else {
        return hexColor
      }
    } else {
      return hexColor
    }

    // Apply brightness (-100 to +100) -> scale factor 0.0 to 2.0
    const brightnessFactor = 1 + (brightness / 100)
    r = Math.min(255, Math.max(0, r * brightnessFactor))
    g = Math.min(255, Math.max(0, g * brightnessFactor))
    b = Math.min(255, Math.max(0, b * brightnessFactor))

    // Apply contrast (-100 to +100)
    const contrastFactor = (100 + contrast) / 100
    r = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrastFactor + 0.5) * 255))
    g = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrastFactor + 0.5) * 255))
    b = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrastFactor + 0.5) * 255))

    // Convert to HSL for saturation and hue adjustments
    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255
    
    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const l = (max + min) / 2
    
    let h = 0, s = 0
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break
      }
    }

    // Apply hue rotation (0 to 360)
    h = (h + hueRotation / 360) % 1
    if (h < 0) h += 1

    // Apply saturation (-100 to +100)
    s = Math.min(1, Math.max(0, s * (1 + saturation / 100)))

    // Convert back to RGB
    let rOut, gOut, bOut
    
    if (s === 0) {
      rOut = gOut = bOut = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      
      rOut = hue2rgb(p, q, h + 1/3)
      gOut = hue2rgb(p, q, h)
      bOut = hue2rgb(p, q, h - 1/3)
    }

    // Convert to hex
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`
  }

  // Reset SVG color grading to defaults
  const handleResetSvgColorGrading = useCallback(() => {
    setSvgBrightness(0)
    setSvgContrast(0)
    setSvgSaturation(0)
    setSvgHueRotation(0)
    
    // Reset to original fill color
    if (selectedObject && canvas && isSvgOrIcon(selectedObject)) {
      const children = getSvgChildren(selectedObject)
      children.forEach((child: FabricObject) => {
        const currentFill = (child as any).fill
        if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
          child.set('fill', svgFillColor)
        }
      })
      canvas.requestRenderAll()
      setDirty(true)
    }
  }, [selectedObject, canvas, svgFillColor, setDirty])

  const isTextObject = selectedObject && (selectedObject as Textbox).text !== undefined
  const isImageObject = selectedObject && selectedObject.type === 'image'
  const isCircleFrameObject = selectedObject && isCircleFrame(selectedObject)
  const isSvgOrIconObject = selectedObject && isSvgOrIcon(selectedObject)

  if (!selectedObject) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-3">
        <p className="text-gray-400 text-xs">Select an object to edit its properties</p>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-3 space-y-4 overflow-y-auto h-full pb-20">
      {/* Position */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Position
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">X</label>
            <input
              type="number"
              value={position.x}
              onChange={(e) => handlePositionChange('x', Number(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Y</label>
            <input
              type="number"
              value={position.y}
              onChange={(e) => handlePositionChange('y', Number(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Size
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Width</label>
            <input
              type="number"
              value={size.width}
              onChange={(e) => handleSizeChange('width', Number(e.target.value))}
              disabled={!isTextObject}
              className={`w-full px-2 py-1 border rounded text-xs ${
                isTextObject 
                  ? 'border-gray-300' 
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">Height</label>
            <input
              type="number"
              value={size.height}
              onChange={(e) => handleSizeChange('height', Number(e.target.value))}
              disabled={!isTextObject}
              className={`w-full px-2 py-1 border rounded text-xs ${
                isTextObject 
                  ? 'border-gray-300' 
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            />
          </div>
        </div>
        {isTextObject && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Text wraps within width. Height adjusts automatically.
          </p>
        )}
      </div>
      
      {/* Opacity */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Opacity: {Math.round(opacity * 100)}%</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full h-1"
        />
      </div>

      {/* Text Properties */}
      {isTextObject && (
        <>
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Text Style
            </h3>
            <div className="space-y-2">
              {/* Font Family */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Font Family</label>
                <FontPickerButton
                  fontFamily={fontFamily}
                  fontWeight={fontWeightNum}
                  onClick={() => setIsFontPickerOpen(true)}
                />
              </div>

              {/* Font Weight Dropdown */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Font Weight</label>
                <select
                  value={fontWeightNum}
                  onChange={(e) => handleFontWeightNumChange(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer"
                  style={{ fontFamily: fontFamily }}
                >
                  {(() => {
                    // Get available weights for the selected font
                    const font = findFont(fontFamily)
                    const availableWeights = font
                      ? font.weights
                      : [{ value: 400, label: 'Regular' }, { value: 700, label: 'Bold' }]
                    
                    return availableWeights.map((weight) => (
                      <option
                        key={weight.value}
                        value={weight.value}
                        style={{ fontWeight: weight.value, fontFamily: fontFamily }}
                      >
                        {weight.label} ({weight.value})
                      </option>
                    ))
                  })()}
                </select>
              </div>

              {/* Font Picker Modal */}
              <FontPicker
                isOpen={isFontPickerOpen}
                onClose={() => setIsFontPickerOpen(false)}
                selectedFont={fontFamily}
                selectedWeight={fontWeightNum}
                onFontChange={handleFontFamilyChange}
                onWeightChange={handleFontWeightNumChange}
              />

              {/* Font Size & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Size</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                   <label className="block text-[10px] text-gray-500 mb-0.5">Color</label>
                   <input
                     type="color"
                     value={fontColor}
                     onChange={(e) => handleFontColorChange(e.target.value)}
                     className="h-7 w-full rounded border border-gray-300 cursor-pointer p-0"
                   />
                </div>
              </div>

               {/* Formatting Toggles */}
               <div className="flex flex-wrap gap-0.5 p-0.5 bg-gray-50 rounded border border-gray-200">
                  <button
                    onClick={handleToggleBold}
                    className={`flex-1 min-w-[24px] h-6 flex items-center justify-center rounded text-xs font-serif font-bold transition-colors ${
                      fontWeight === 'bold' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={handleToggleItalic}
                    className={`flex-1 min-w-[24px] h-6 flex items-center justify-center rounded text-xs font-serif italic transition-colors ${
                      fontStyle === 'italic' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onClick={handleToggleUnderline}
                    className={`flex-1 min-w-[24px] h-6 flex items-center justify-center rounded text-xs font-serif underline transition-colors ${
                      underline ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Underline"
                  >
                    U
                  </button>
                  <button
                    onClick={handleToggleLinethrough}
                    className={`flex-1 min-w-[24px] h-6 flex items-center justify-center rounded text-xs font-serif line-through transition-colors ${
                      linethrough ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Strikethrough"
                  >
                    S
                  </button>
                  <button
                    onClick={handleTransformUppercase}
                    className="flex-1 min-w-[24px] h-6 flex items-center justify-center rounded text-[10px] font-sans font-bold hover:bg-gray-200 text-gray-700 uppercase"
                    title="Uppercase"
                  >
                    AA
                  </button>
                </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Alignment</label>
                <div className="flex gap-0.5">
                  {ALIGNMENTS.map((align) => (
                    <button
                      key={align.value}
                      onClick={() => handleTextAlignChange(align.value)}
                      className={`flex-1 px-1 py-1 text-[10px] rounded border transition-colors ${
                        textAlign === align.value
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      title={align.label}
                    >
                      {align.icon}
                    </button>
                  ))}
                </div>
              </div>

               {/* Background Color */}
               <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] text-gray-500">Text Background</label>
                    <input
                      type="checkbox"
                      checked={hasBackgroundColor}
                      onChange={(e) => handleBackgroundColorToggle(e.target.checked)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
                  </div>
                  {hasBackgroundColor && (
                    <input
                      type="color"
                      value={textBackgroundColor}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  )}
              </div>

              {/* Spacing */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div>
                   <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                     <span>Letter Spacing</span>
                     <span>{charSpacing}</span>
                   </label>
                   <input
                     type="range"
                     min="-50"
                     max="500"
                     step="10"
                     value={charSpacing}
                     onChange={(e) => handleCharSpacingChange(Number(e.target.value))}
                     className="w-full h-1"
                   />
                </div>
                <div>
                   <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                     <span>Line Height</span>
                     <span>{lineHeight}</span>
                   </label>
                   <input
                     type="range"
                     min="0.5"
                     max="3"
                     step="0.1"
                     value={lineHeight}
                     onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                     className="w-full h-1"
                   />
                </div>
              </div>

              {/* Stroke / Outline */}
               <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase">Outline</span>
                    <input
                      type="checkbox"
                      checked={hasStroke}
                      onChange={(e) => handleStrokeToggle(e.target.checked)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
                  </div>
                  {hasStroke && (
                    <div className="space-y-1.5">
                       <div>
                         <label className="block text-[10px] text-gray-500 mb-0.5">Color</label>
                         <input
                           type="color"
                           value={strokeColor}
                           onChange={(e) => handleStrokeColorChange(e.target.value)}
                           className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                         />
                       </div>
                       <div>
                         <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>Width</span>
                            <span>{strokeWidth}px</span>
                         </label>
                         <input
                           type="range"
                           min="0"
                           max="10"
                           step="0.1"
                           value={strokeWidth}
                           onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                           className="w-full h-1"
                         />
                       </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Shadow */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Drop Shadow
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasShadow}
                  onChange={(e) => handleShadowToggle(e.target.checked)}
                  className="w-3 h-3 rounded border-gray-300"
                />
                <span className="text-xs text-gray-700">Enable Shadow</span>
              </label>
              
              {hasShadow && (
                <>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Shadow Color</label>
                    <input
                      type="color"
                      value={shadowColor}
                      onChange={(e) => handleShadowChange('color', e.target.value)}
                      className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Blur: {shadowBlur}</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={shadowBlur}
                      onChange={(e) => handleShadowChange('blur', e.target.value)}
                      className="w-full h-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Offset X</label>
                      <input
                        type="number"
                        value={shadowOffsetX}
                        onChange={(e) => handleShadowChange('offsetX', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Offset Y</label>
                      <input
                        type="number"
                        value={shadowOffsetY}
                        onChange={(e) => handleShadowChange('offsetY', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Text Effects Presets */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Text Effects
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {TEXT_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => handleApplyTextEffect(effect.id)}
                  className={`px-1.5 py-1 text-[10px] rounded border transition-all ${
                    currentTextEffect === effect.id
                      ? 'bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {effect.name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Click an effect to apply. Use manual controls above to customize.
            </p>
          </div>

          {/* Variable Binding */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Variable Binding
            </h3>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Variable Name</label>
              <input
                type="text"
                value={variableName}
                onChange={(e) => handleVariableChange(e.target.value)}
                placeholder="e.g., headline, author"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Use in API: {`{{${variableName || 'variable'}}}`}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Image Properties */}
      {isImageObject && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Image Options
          </h3>
          
          <div className="space-y-3">
            {/* Circle Crop */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCircleCrop}
                onChange={(e) => handleCircleCrop(e.target.checked)}
                className="w-3 h-3 rounded border-gray-300"
              />
              <span className="text-xs text-gray-700">Crop as Circle</span>
            </label>

            {/* Border Options (only when Circle Crop is active) */}
            {isCircleCrop && (
              <div className="pl-4 space-y-2 border-l-2 border-gray-100 ml-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBorder}
                    onChange={(e) => handleBorderToggle(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-700">Add Border</span>
                </label>
                
                {hasBorder && (
                  <div className="space-y-1.5">
                     <div>
                       <label className="block text-[10px] text-gray-500 mb-0.5">Color</label>
                       <input
                         type="color"
                         value={borderColor}
                         onChange={(e) => handleBorderColorChange(e.target.value)}
                         className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                       />
                     </div>
                     <div>
                       <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>Width</span>
                          <span>{borderWidth}px</span>
                       </label>
                       <input
                         type="range"
                         min="1"
                         max="20"
                         step="1"
                         value={borderWidth}
                         onChange={(e) => handleBorderWidthChange(Number(e.target.value))}
                         className="w-full h-1"
                       />
                     </div>
                  </div>
                )}
              </div>
            )}

            {/* Crop Image */}
            <div className="pt-2 border-t border-gray-100">
               <span className="text-[10px] font-semibold text-gray-600 uppercase mb-1.5 block">Crop Image</span>
               <div className="space-y-1.5">
                 <button
                   onClick={() => setIsCropModalOpen(true)}
                   className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-blue-200"
                 >
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
                     <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
                   </svg>
                   {currentCropData ? 'Edit Crop' : 'Crop Image'}
                 </button>
                 {currentCropData && (
                   <div className="flex items-center justify-between text-[10px] text-gray-500">
                     <span>
                       Cropped: {Math.round(currentCropData.width)} × {Math.round(currentCropData.height)}px
                     </span>
                     <button
                       onClick={handleResetCrop}
                       className="text-red-600 hover:text-red-700 underline"
                     >
                       Reset
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Crop Modal */}
      {isImageObject && (
        <CropModal
          isOpen={isCropModalOpen}
          onClose={() => setIsCropModalOpen(false)}
          onApply={handleCropApply}
          imageObject={selectedObject as FabricImage}
          currentCrop={currentCropData}
        />
      )}

      {/* Circle Frame Properties */}
      {isCircleFrameObject && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Circle Frame
          </h3>
          
          <div className="space-y-3">
            {/* Frame Size Display */}
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">
                Frame Size: {Math.round(frameRadius * 2)}px diameter
              </label>
            </div>

            {/* Add Image Button (when empty) */}
            {!frameHasImage && (
              <button
                onClick={handleAddImageToFrame}
                className="w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Add Image to Frame
              </button>
            )}

            {/* Image Controls (when has image) */}
            {frameHasImage && (
              <div className="space-y-3">
                {/* Replace/Remove/Detach buttons */}
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleReplaceFrameImage}
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition-colors border border-blue-200"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleRemoveFrameImage}
                      className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-medium transition-colors border border-red-200"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    onClick={handleDetachImageFromFrame}
                    className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-xs font-medium transition-colors border border-amber-200 flex items-center justify-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Detach Image
                  </button>
                  <p className="text-[10px] text-gray-400">
                    Detach removes the image from the frame.
                  </p>
                </div>

                {/* Image Position Controls */}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-600 uppercase mb-2 block">
                    Adjust Image Position
                  </span>
                  
                  {/* Scale */}
                  <div className="mb-2">
                    <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>Zoom</span>
                      <span>{Math.round(frameImageScale * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.01"
                      value={frameImageScale}
                      onChange={(e) => handleFrameImageScaleChange(Number(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>

                  {/* X Offset */}
                  <div className="mb-2">
                    <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>Horizontal Offset</span>
                      <span>{Math.round(frameImageOffsetX)}px</span>
                    </label>
                    <input
                      type="range"
                      min={-frameRadius}
                      max={frameRadius}
                      step="1"
                      value={frameImageOffsetX}
                      onChange={(e) => handleFrameImageOffsetChange('x', Number(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>

                  {/* Y Offset */}
                  <div className="mb-2">
                    <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>Vertical Offset</span>
                      <span>{Math.round(frameImageOffsetY)}px</span>
                    </label>
                    <input
                      type="range"
                      min={-frameRadius}
                      max={frameRadius}
                      step="1"
                      value={frameImageOffsetY}
                      onChange={(e) => handleFrameImageOffsetChange('y', Number(e.target.value))}
                      className="w-full h-1"
                    />
                  </div>

                  {/* Reset Position */}
                  <button
                    onClick={handleResetFrameImagePosition}
                    className="w-full py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-medium transition-colors"
                  >
                    Reset Position
                  </button>
                </div>

                <p className="text-[10px] text-gray-400">
                  Tip: Double-click on the frame to enter edit mode.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG/Icon Styling Properties */}
      {isSvgOrIconObject && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Icon Styling
          </h3>
          
          <div className="space-y-3">
            {/* Fill Color */}
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Fill Color</label>
              <div className="flex gap-1 mb-1.5">
                <input
                  type="color"
                  value={svgFillColor}
                  onChange={(e) => handleSvgFillColorChange(e.target.value)}
                  className="h-7 w-10 rounded border border-gray-300 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={svgFillColor}
                  onChange={(e) => handleSvgFillColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
              {/* Color Swatches */}
              <div className="grid grid-cols-6 gap-1">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleSvgFillColorChange(color)}
                    className={`w-full aspect-square rounded border transition-all ${
                      svgFillColor.toUpperCase() === color.toUpperCase()
                        ? 'ring-2 ring-blue-400 ring-offset-1'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Stroke/Border Section */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] font-semibold text-gray-600 uppercase mb-2 block">
                Stroke / Border
              </span>
              
              {/* Stroke Width */}
              <div className="mb-2">
                <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Width</span>
                  <span>{svgStrokeWidth}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={svgStrokeWidth}
                  onChange={(e) => handleSvgStrokeWidthChange(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>

              {/* Stroke Color (only visible when stroke width > 0) */}
              {svgStrokeWidth > 0 && (
                <>
                  <div className="mb-2">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Color</label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={svgStrokeColor}
                        onChange={(e) => handleSvgStrokeColorChange(e.target.value)}
                        className="h-6 w-10 rounded border border-gray-300 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={svgStrokeColor}
                        onChange={(e) => handleSvgStrokeColorChange(e.target.value)}
                        className="flex-1 px-2 py-0.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  {/* Stroke Style */}
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Style</label>
                    <div className="flex gap-1">
                      {STROKE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleSvgStrokeStyleChange(style.id)}
                          className={`flex-1 px-2 py-1 text-[10px] rounded border transition-colors ${
                            svgStrokeStyle === style.id
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Color Grading / Effects Section */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-600 uppercase">
                  Color Grading
                </span>
                <button
                  onClick={handleResetSvgColorGrading}
                  className="text-[10px] text-gray-500 hover:text-gray-700 underline"
                >
                  Reset
                </button>
              </div>

              {/* Brightness */}
              <div className="mb-2">
                <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Brightness</span>
                  <span>{svgBrightness > 0 ? '+' : ''}{svgBrightness}</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={svgBrightness}
                  onChange={(e) => handleSvgBrightnessChange(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>

              {/* Contrast */}
              <div className="mb-2">
                <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Contrast</span>
                  <span>{svgContrast > 0 ? '+' : ''}{svgContrast}</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={svgContrast}
                  onChange={(e) => handleSvgContrastChange(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>

              {/* Saturation */}
              <div className="mb-2">
                <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Saturation</span>
                  <span>{svgSaturation > 0 ? '+' : ''}{svgSaturation}</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={svgSaturation}
                  onChange={(e) => handleSvgSaturationChange(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>

              {/* Hue Rotation */}
              <div>
                <label className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Hue Rotation</span>
                  <span>{svgHueRotation}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={svgHueRotation}
                  onChange={(e) => handleSvgHueRotationChange(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400">
              Adjust fill, stroke, and color effects for your icon.
            </p>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={handleClone}
          className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Duplicate Object
        </button>
      </div>
    </div>
  )
}
