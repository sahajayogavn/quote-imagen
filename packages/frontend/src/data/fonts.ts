// Font data for Google Fonts with weight variants
// All fonts support Unicode/international characters

export interface FontWeight {
  value: number
  label: string
}

export interface FontFamily {
  name: string
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
  weights: FontWeight[]
  googleFontUrl?: string
}

// Standard weight mappings
export const WEIGHT_LABELS: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
}

// Helper to create weight arrays
const createWeights = (...values: number[]): FontWeight[] =>
  values.map((value) => ({ value, label: WEIGHT_LABELS[value] || String(value) }))

// Popular Google Fonts with Unicode support
export const GOOGLE_FONTS: FontFamily[] = [
  // Sans-Serif Fonts
  {
    name: 'Roboto',
    category: 'sans-serif',
    weights: createWeights(100, 300, 400, 500, 700, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
  },
  {
    name: 'Open Sans',
    category: 'sans-serif',
    weights: createWeights(300, 400, 500, 600, 700, 800),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap',
  },
  {
    name: 'Lato',
    category: 'sans-serif',
    weights: createWeights(100, 300, 400, 700, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap',
  },
  {
    name: 'Montserrat',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Poppins',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Inter',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Oswald',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
  },
  {
    name: 'Raleway',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Nunito',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Nunito Sans',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Work Sans',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Rubik',
    category: 'sans-serif',
    weights: createWeights(300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Mukta',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Mukta:wght@200;300;400;500;600;700;800&display=swap',
  },
  {
    name: 'Noto Sans',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Source Sans 3',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Quicksand',
    category: 'sans-serif',
    weights: createWeights(300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Barlow',
    category: 'sans-serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Barlow:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Mulish',
    category: 'sans-serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Mulish:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  
  // Serif Fonts
  {
    name: 'Playfair Display',
    category: 'serif',
    weights: createWeights(400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Merriweather',
    category: 'serif',
    weights: createWeights(300, 400, 700, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap',
  },
  {
    name: 'Lora',
    category: 'serif',
    weights: createWeights(400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
  },
  {
    name: 'PT Serif',
    category: 'serif',
    weights: createWeights(400, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap',
  },
  {
    name: 'Noto Serif',
    category: 'serif',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@100;200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Libre Baskerville',
    category: 'serif',
    weights: createWeights(400, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap',
  },
  {
    name: 'Crimson Text',
    category: 'serif',
    weights: createWeights(400, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap',
  },
  {
    name: 'Source Serif 4',
    category: 'serif',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'EB Garamond',
    category: 'serif',
    weights: createWeights(400, 500, 600, 700, 800),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&display=swap',
  },
  {
    name: 'Cormorant Garamond',
    category: 'serif',
    weights: createWeights(300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap',
  },
  
  // Display Fonts
  {
    name: 'Bebas Neue',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  },
  {
    name: 'Abril Fatface',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap',
  },
  {
    name: 'Righteous',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
  },
  {
    name: 'Archivo Black',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
  },
  {
    name: 'Fredoka',
    category: 'display',
    weights: createWeights(300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Comfortaa',
    category: 'display',
    weights: createWeights(300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'Titan One',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Titan+One&display=swap',
  },
  {
    name: 'Lobster',
    category: 'display',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap',
  },
  {
    name: 'Passion One',
    category: 'display',
    weights: createWeights(400, 700, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&display=swap',
  },
  
  // Handwriting Fonts
  {
    name: 'Dancing Script',
    category: 'handwriting',
    weights: createWeights(400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap',
  },
  {
    name: 'Pacifico',
    category: 'handwriting',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
  {
    name: 'Great Vibes',
    category: 'handwriting',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
  },
  {
    name: 'Caveat',
    category: 'handwriting',
    weights: createWeights(400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap',
  },
  {
    name: 'Sacramento',
    category: 'handwriting',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap',
  },
  {
    name: 'Satisfy',
    category: 'handwriting',
    weights: createWeights(400),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap',
  },
  {
    name: 'Kalam',
    category: 'handwriting',
    weights: createWeights(300, 400, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap',
  },
  
  // Monospace Fonts
  {
    name: 'Roboto Mono',
    category: 'monospace',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;200;300;400;500;600;700&display=swap',
  },
  {
    name: 'Source Code Pro',
    category: 'monospace',
    weights: createWeights(200, 300, 400, 500, 600, 700, 800, 900),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap',
  },
  {
    name: 'Fira Code',
    category: 'monospace',
    weights: createWeights(300, 400, 500, 600, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
  },
  {
    name: 'JetBrains Mono',
    category: 'monospace',
    weights: createWeights(100, 200, 300, 400, 500, 600, 700, 800),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap',
  },
  {
    name: 'Space Mono',
    category: 'monospace',
    weights: createWeights(400, 700),
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
  },
]

// Font categories for filtering
export const FONT_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sans-serif', label: 'Sans Serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'monospace', label: 'Monospace' },
] as const

export type FontCategoryId = typeof FONT_CATEGORIES[number]['id']

// Helper function to find a font by name
export const findFont = (name: string): FontFamily | undefined => {
  return GOOGLE_FONTS.find((font) => font.name.toLowerCase() === name.toLowerCase())
}

// Helper function to get fonts by category
export const getFontsByCategory = (category: FontCategoryId): FontFamily[] => {
  if (category === 'all') return GOOGLE_FONTS
  return GOOGLE_FONTS.filter((font) => font.category === category)
}

// Track loaded fonts
const loadedFonts = new Set<string>()

// Load a Google Font dynamically
export const loadGoogleFont = async (fontName: string): Promise<boolean> => {
  // Skip if already loaded
  if (loadedFonts.has(fontName)) {
    return true
  }

  const font = findFont(fontName)
  if (!font || !font.googleFontUrl) {
    console.warn(`Font "${fontName}" not found or has no Google Font URL`)
    return false
  }

  return new Promise((resolve) => {
    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${font.googleFontUrl}"]`)
    if (existingLink) {
      loadedFonts.add(fontName)
      resolve(true)
      return
    }

    // Create and append link element
    const link = document.createElement('link')
    link.href = font.googleFontUrl!
    link.rel = 'stylesheet'
    link.crossOrigin = 'anonymous'

    link.onload = () => {
      loadedFonts.add(fontName)
      resolve(true)
    }

    link.onerror = () => {
      console.error(`Failed to load font: ${fontName}`)
      resolve(false)
    }

    document.head.appendChild(link)
  })
}

// Load multiple fonts at once
export const loadGoogleFonts = async (fontNames: string[]): Promise<void> => {
  await Promise.all(fontNames.map((name) => loadGoogleFont(name)))
}

// Check if a font is loaded
export const isFontLoaded = (fontName: string): boolean => {
  return loadedFonts.has(fontName)
}

// Get the fallback font family string for CSS
export const getFontFallback = (category: FontFamily['category']): string => {
  switch (category) {
    case 'serif':
      return 'Georgia, "Times New Roman", serif'
    case 'monospace':
      return '"Courier New", Courier, monospace'
    case 'handwriting':
      return 'cursive'
    case 'display':
      return 'Impact, sans-serif'
    case 'sans-serif':
    default:
      return 'Arial, Helvetica, sans-serif'
  }
}

// Get full font-family CSS value with fallbacks
export const getFontFamilyWithFallback = (fontName: string): string => {
  const font = findFont(fontName)
  if (!font) {
    return `"${fontName}", Arial, sans-serif`
  }
  return `"${fontName}", ${getFontFallback(font.category)}`
}
