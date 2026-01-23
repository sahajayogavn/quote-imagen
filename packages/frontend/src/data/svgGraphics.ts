// SVG Graphics library data
// Each SVG is stored as a string and can be added to the canvas

export interface SvgGraphic {
  id: string
  name: string
  category: string
  svg: string
}

export const SVG_CATEGORIES = [
  { id: 'shapes', name: 'Shapes' },
  { id: 'arrows', name: 'Arrows' },
  { id: 'decorative', name: 'Decorative' },
  { id: 'social', name: 'Social' },
  { id: 'icons', name: 'Icons' },
] as const

export const SVG_GRAPHICS: SvgGraphic[] = [
  // Shapes
  {
    id: 'star-5',
    name: '5-Point Star',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'star-6',
    name: '6-Point Star',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 60,35 95,35 70,55 80,90 50,70 20,90 30,55 5,35 40,35" fill="#4169E1" stroke="#2E4C9E" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,88 C20,60 5,45 5,28 C5,10 25,5 50,25 C75,5 95,10 95,28 C95,45 80,60 50,88 Z" fill="#FF6B6B" stroke="#CC5555" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 95,50 50,95 5,50" fill="#00CED1" stroke="#008B8B" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="#9370DB" stroke="#7B5CB8" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 97,38 79,93 21,93 3,38" fill="#FF8C00" stroke="#CC7000" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 90,90 10,90" fill="#32CD32" stroke="#228B22" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'cross',
    name: 'Cross',
    category: 'shapes',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="35,5 65,5 65,35 95,35 95,65 65,65 65,95 35,95 35,65 5,65 5,35 35,35" fill="#DC143C" stroke="#B8102F" stroke-width="2"/>
    </svg>`,
  },

  // Arrows
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,10 95,50 60,90 60,65 5,65 5,35 60,35" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'arrow-left',
    name: 'Arrow Left',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,10 5,50 40,90 40,65 95,65 95,35 40,35" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'arrow-up',
    name: 'Arrow Up',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="10,40 50,5 90,40 65,40 65,95 35,95 35,40" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="10,60 50,95 90,60 65,60 65,5 35,5 35,60" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'arrow-curved',
    name: 'Curved Arrow',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,90 Q20,20 80,20 L80,5 L98,25 L80,45 L80,30 Q30,30 30,90 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'arrow-double',
    name: 'Double Arrow',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,10 5,50 25,90 25,65 75,65 75,90 95,50 75,10 75,35 25,35" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },

  // Decorative
  {
    id: 'sun',
    name: 'Sun',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="20" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
      <g fill="#FFD700" stroke="#DAA520" stroke-width="2">
        <rect x="47" y="5" width="6" height="15" rx="3"/>
        <rect x="47" y="80" width="6" height="15" rx="3"/>
        <rect x="5" y="47" width="15" height="6" ry="3"/>
        <rect x="80" y="47" width="15" height="6" ry="3"/>
        <rect x="18" y="17" width="6" height="15" rx="3" transform="rotate(45 21 24.5)"/>
        <rect x="76" y="17" width="6" height="15" rx="3" transform="rotate(-45 79 24.5)"/>
        <rect x="18" y="68" width="6" height="15" rx="3" transform="rotate(-45 21 75.5)"/>
        <rect x="76" y="68" width="6" height="15" rx="3" transform="rotate(45 79 75.5)"/>
      </g>
    </svg>`,
  },
  {
    id: 'moon',
    name: 'Crescent Moon',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,5 A45,45 0 1,0 50,95 A35,35 0 0,1 50,5" fill="#F4E99B" stroke="#D4C97B" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25,70 A20,20 0 0,1 25,40 A25,25 0 0,1 70,35 A20,20 0 0,1 85,60 A15,15 0 0,1 75,75 Z" fill="#E8E8E8" stroke="#CCCCCC" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'lightning',
    name: 'Lightning Bolt',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="55,5 25,50 45,50 35,95 75,45 55,45 70,5" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'flower',
    name: 'Flower',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="25" rx="15" ry="20" fill="#FF69B4" stroke="#DB5A9C" stroke-width="1"/>
      <ellipse cx="25" cy="50" rx="15" ry="20" fill="#FF69B4" stroke="#DB5A9C" stroke-width="1" transform="rotate(-90 25 50)"/>
      <ellipse cx="75" cy="50" rx="15" ry="20" fill="#FF69B4" stroke="#DB5A9C" stroke-width="1" transform="rotate(90 75 50)"/>
      <ellipse cx="50" cy="75" rx="15" ry="20" fill="#FF69B4" stroke="#DB5A9C" stroke-width="1" transform="rotate(180 50 75)"/>
      <circle cx="50" cy="50" r="12" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
    </svg>`,
  },
  {
    id: 'ribbon',
    name: 'Ribbon Banner',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,35 L15,45 L15,65 L5,55 L5,35" fill="#CC3333"/>
      <path d="M95,35 L85,45 L85,65 L95,55 L95,35" fill="#CC3333"/>
      <rect x="15" y="35" width="70" height="30" fill="#FF4444" stroke="#CC3333" stroke-width="1"/>
    </svg>`,
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 58,15 72,10 70,25 85,32 75,43 82,57 68,58 62,72 50,62 38,72 32,58 18,57 25,43 15,32 30,25 28,10 42,15" fill="#4169E1" stroke="#2E4C9E" stroke-width="2"/>
      <circle cx="50" cy="40" r="20" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'burst',
    name: 'Starburst',
    category: 'decorative',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 55,35 85,20 65,45 95,50 65,55 85,80 55,65 50,95 45,65 15,80 35,55 5,50 35,45 15,20 45,35" fill="#FF6347" stroke="#DC4030" stroke-width="2"/>
    </svg>`,
  },

  // Social icons
  {
    id: 'social-like',
    name: 'Thumbs Up',
    category: 'social',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25,95 L25,45 L10,45 L10,95 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <path d="M30,90 L30,45 L50,45 L60,20 C60,10 75,10 75,20 L75,40 L90,40 C95,40 98,50 95,55 L85,90 C83,95 78,95 75,95 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'social-share',
    name: 'Share',
    category: 'social',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="20" r="12" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <circle cx="75" cy="80" r="12" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <circle cx="25" cy="50" r="12" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <line x1="35" y1="44" x2="65" y2="27" stroke="#3A7AC0" stroke-width="4"/>
      <line x1="35" y1="56" x2="65" y2="73" stroke="#3A7AC0" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'social-comment',
    name: 'Comment',
    category: 'social',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,15 L90,15 C93,15 95,18 95,22 L95,65 C95,70 92,72 88,72 L30,72 L15,90 L15,72 L12,72 C8,72 5,70 5,65 L5,22 C5,18 8,15 10,15 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'social-bookmark',
    name: 'Bookmark',
    category: 'social',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,5 L80,5 L80,95 L50,70 L20,95 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
    </svg>`,
  },

  // Icons
  {
    id: 'icon-check',
    name: 'Checkmark',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#388E3C" stroke-width="2"/>
      <polyline points="25,50 42,67 75,33" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'icon-x',
    name: 'X Mark',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#F44336" stroke="#D32F2F" stroke-width="2"/>
      <line x1="30" y1="30" x2="70" y2="70" stroke="white" stroke-width="10" stroke-linecap="round"/>
      <line x1="70" y1="30" x2="30" y2="70" stroke="white" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'icon-plus',
    name: 'Plus',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#2196F3" stroke="#1976D2" stroke-width="2"/>
      <line x1="50" y1="25" x2="50" y2="75" stroke="white" stroke-width="10" stroke-linecap="round"/>
      <line x1="25" y1="50" x2="75" y2="50" stroke="white" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'icon-minus',
    name: 'Minus',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FF9800" stroke="#F57C00" stroke-width="2"/>
      <line x1="25" y1="50" x2="75" y2="50" stroke="white" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'icon-info',
    name: 'Info',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#2196F3" stroke="#1976D2" stroke-width="2"/>
      <circle cx="50" cy="28" r="6" fill="white"/>
      <rect x="44" y="42" width="12" height="35" rx="3" fill="white"/>
    </svg>`,
  },
  {
    id: 'icon-warning',
    name: 'Warning',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 95,90 5,90" fill="#FF9800" stroke="#F57C00" stroke-width="2"/>
      <rect x="44" y="35" width="12" height="30" rx="3" fill="white"/>
      <circle cx="50" cy="75" r="6" fill="white"/>
    </svg>`,
  },
  {
    id: 'icon-question',
    name: 'Question',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#9C27B0" stroke="#7B1FA2" stroke-width="2"/>
      <path d="M35,35 Q35,20 50,20 Q65,20 65,35 Q65,48 50,48 L50,58" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>
      <circle cx="50" cy="75" r="6" fill="white"/>
    </svg>`,
  },
  {
    id: 'icon-location',
    name: 'Location Pin',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,95 L50,95 C50,95 15,55 15,35 C15,15 30,5 50,5 C70,5 85,15 85,35 C85,55 50,95 50,95 Z" fill="#F44336" stroke="#D32F2F" stroke-width="2"/>
      <circle cx="50" cy="35" r="12" fill="white"/>
    </svg>`,
  },
  {
    id: 'icon-email',
    name: 'Email',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="80" height="60" rx="5" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <polyline points="10,25 50,55 90,25" fill="none" stroke="#3A7AC0" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'icon-phone',
    name: 'Phone',
    category: 'icons',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25,5 L75,5 C80,5 85,10 85,15 L85,85 C85,90 80,95 75,95 L25,95 C20,95 15,90 15,85 L15,15 C15,10 20,5 25,5 Z" fill="#4A90D9" stroke="#3A7AC0" stroke-width="2"/>
      <rect x="25" y="15" width="50" height="60" rx="2" fill="white"/>
      <circle cx="50" cy="85" r="5" fill="white"/>
    </svg>`,
  },
]

// Helper function to get SVGs by category
export function getSvgsByCategory(category: string): SvgGraphic[] {
  return SVG_GRAPHICS.filter((svg) => svg.category === category)
}

// Helper function to get all SVGs
export function getAllSvgs(): SvgGraphic[] {
  return SVG_GRAPHICS
}
