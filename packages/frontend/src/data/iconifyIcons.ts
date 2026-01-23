// Curated list of Iconify icons for the quote-imagen editor
// Each icon is defined by its full Iconify name (prefix:name format)

export interface IconifyIconDef {
  name: string // Full Iconify name (e.g., 'mdi:star')
  label: string // Display label
}

export interface IconifyCategory {
  id: string
  name: string
  icons: IconifyIconDef[]
}

// Organized by categories with ~200+ total icons
export const ICONIFY_CATEGORIES: IconifyCategory[] = [
  {
    id: 'decorative',
    name: 'Decorative/Ornaments',
    icons: [
      { name: 'mdi:flare', label: 'Flare' },
      { name: 'mdi:star-four-points', label: 'Four Point Star' },
      { name: 'mdi:star-three-points', label: 'Three Point Star' },
      { name: 'mdi:shimmer', label: 'Shimmer' },
      { name: 'mdi:auto-fix', label: 'Magic Wand' },
      { name: 'mdi:creation', label: 'Creation' },
      { name: 'ph:sparkle-fill', label: 'Sparkle' },
      { name: 'ph:sparkle-bold', label: 'Sparkle Bold' },
      { name: 'ph:confetti-fill', label: 'Confetti' },
      { name: 'tabler:sparkles', label: 'Sparkles' },
      { name: 'tabler:wand', label: 'Wand' },
      { name: 'tabler:leaf', label: 'Leaf' },
      { name: 'tabler:feather', label: 'Feather' },
      { name: 'lucide:sparkle', label: 'Sparkle Alt' },
      { name: 'lucide:flower', label: 'Flower Simple' },
      { name: 'lucide:flower-2', label: 'Flower 2' },
      { name: 'ri:vip-crown-fill', label: 'Crown' },
      { name: 'ri:vip-crown-2-fill', label: 'Crown 2' },
      { name: 'ri:diamond-fill', label: 'Diamond' },
      { name: 'carbon:paint-brush', label: 'Paint Brush' },
      { name: 'heroicons:sparkles-solid', label: 'Sparkles Solid' },
      { name: 'heroicons:fire-solid', label: 'Fire' },
      { name: 'ion:flame', label: 'Flame' },
      { name: 'ion:flash', label: 'Flash' },
      { name: 'mdi:star-shooting', label: 'Shooting Star' },
      { name: 'tabler:stars', label: 'Stars' },
      { name: 'fluent:sparkle-20-filled', label: 'Sparkle Filled' },
      { name: 'fluent:sparkle-24-regular', label: 'Sparkle Regular' },
      { name: 'ph:flower-lotus-fill', label: 'Lotus Flower' },
      { name: 'ph:butterfly-fill', label: 'Butterfly' },
      { name: 'mdi:butterfly', label: 'Butterfly Alt' },
      { name: 'mdi:snowflake', label: 'Snowflake' },
    ],
  },
  {
    id: 'shapes',
    name: 'Shapes',
    icons: [
      { name: 'mdi:star', label: 'Star' },
      { name: 'mdi:star-outline', label: 'Star Outline' },
      { name: 'mdi:heart', label: 'Heart' },
      { name: 'mdi:heart-outline', label: 'Heart Outline' },
      { name: 'mdi:hexagon', label: 'Hexagon' },
      { name: 'mdi:hexagon-outline', label: 'Hexagon Outline' },
      { name: 'mdi:pentagon', label: 'Pentagon' },
      { name: 'mdi:pentagon-outline', label: 'Pentagon Outline' },
      { name: 'mdi:octagon', label: 'Octagon' },
      { name: 'mdi:octagon-outline', label: 'Octagon Outline' },
      { name: 'mdi:rhombus', label: 'Rhombus' },
      { name: 'mdi:rhombus-outline', label: 'Rhombus Outline' },
      { name: 'mdi:triangle', label: 'Triangle' },
      { name: 'mdi:triangle-outline', label: 'Triangle Outline' },
      { name: 'mdi:circle', label: 'Circle' },
      { name: 'mdi:circle-outline', label: 'Circle Outline' },
      { name: 'mdi:square', label: 'Square' },
      { name: 'mdi:square-outline', label: 'Square Outline' },
      { name: 'mdi:rectangle', label: 'Rectangle' },
      { name: 'mdi:rectangle-outline', label: 'Rectangle Outline' },
      { name: 'ph:star-fill', label: 'Star Filled' },
      { name: 'ph:star-four-fill', label: 'Star Four Filled' },
      { name: 'ph:heart-fill', label: 'Heart Filled' },
      { name: 'ph:diamond-fill', label: 'Diamond Shape' },
      { name: 'ph:seal-fill', label: 'Seal' },
      { name: 'lucide:star', label: 'Star Alt' },
      { name: 'lucide:heart', label: 'Heart Alt' },
      { name: 'tabler:badge', label: 'Badge' },
      { name: 'tabler:badge-filled', label: 'Badge Filled' },
      { name: 'tabler:hexagon-filled', label: 'Hexagon Filled' },
      { name: 'mdi:shield-star', label: 'Shield Star' },
      { name: 'mdi:decagram', label: 'Decagram' },
    ],
  },
  {
    id: 'arrows',
    name: 'Arrows & Pointers',
    icons: [
      { name: 'mdi:arrow-right', label: 'Arrow Right' },
      { name: 'mdi:arrow-left', label: 'Arrow Left' },
      { name: 'mdi:arrow-up', label: 'Arrow Up' },
      { name: 'mdi:arrow-down', label: 'Arrow Down' },
      { name: 'mdi:arrow-right-bold', label: 'Arrow Right Bold' },
      { name: 'mdi:arrow-left-bold', label: 'Arrow Left Bold' },
      { name: 'mdi:arrow-top-right', label: 'Arrow Top Right' },
      { name: 'mdi:arrow-top-left', label: 'Arrow Top Left' },
      { name: 'mdi:chevron-right', label: 'Chevron Right' },
      { name: 'mdi:chevron-left', label: 'Chevron Left' },
      { name: 'mdi:chevron-double-right', label: 'Chevron Double Right' },
      { name: 'mdi:chevron-double-left', label: 'Chevron Double Left' },
      { name: 'ph:arrow-right-bold', label: 'Arrow Right Bold' },
      { name: 'ph:arrow-fat-right-fill', label: 'Fat Arrow Right' },
      { name: 'ph:arrow-bend-right-up-fill', label: 'Curved Arrow Up' },
      { name: 'lucide:arrow-right-circle', label: 'Arrow Circle' },
      { name: 'lucide:move-right', label: 'Move Right' },
      { name: 'tabler:arrow-big-right-filled', label: 'Big Arrow Right' },
      { name: 'tabler:arrow-big-up-filled', label: 'Big Arrow Up' },
      { name: 'ri:arrow-right-s-fill', label: 'Arrow S Fill' },
      { name: 'heroicons:arrow-right-circle-solid', label: 'Arrow Circle Solid' },
      { name: 'mdi:cursor-pointer', label: 'Pointer' },
    ],
  },
  {
    id: 'social',
    name: 'Social & Communication',
    icons: [
      { name: 'mdi:heart', label: 'Like Heart' },
      { name: 'mdi:thumb-up', label: 'Thumbs Up' },
      { name: 'mdi:thumb-down', label: 'Thumbs Down' },
      { name: 'mdi:share-variant', label: 'Share' },
      { name: 'mdi:bookmark', label: 'Bookmark' },
      { name: 'mdi:comment', label: 'Comment' },
      { name: 'mdi:message', label: 'Message' },
      { name: 'mdi:chat', label: 'Chat' },
      { name: 'mdi:email', label: 'Email' },
      { name: 'mdi:bell', label: 'Bell' },
      { name: 'ph:thumbs-up-fill', label: 'Thumbs Up Filled' },
      { name: 'ph:share-network-fill', label: 'Share Network' },
      { name: 'ph:chat-circle-fill', label: 'Chat Circle' },
      { name: 'ph:heart-straight-fill', label: 'Heart Straight' },
      { name: 'lucide:share-2', label: 'Share 2' },
      { name: 'lucide:message-square', label: 'Message Square' },
      { name: 'tabler:brand-instagram', label: 'Instagram' },
      { name: 'tabler:brand-twitter', label: 'Twitter' },
      { name: 'tabler:brand-facebook', label: 'Facebook' },
      { name: 'tabler:brand-youtube', label: 'YouTube' },
      { name: 'tabler:brand-tiktok', label: 'TikTok' },
      { name: 'ri:at-fill', label: 'At Symbol' },
    ],
  },
  {
    id: 'weather',
    name: 'Weather & Nature',
    icons: [
      { name: 'mdi:weather-sunny', label: 'Sun' },
      { name: 'mdi:weather-night', label: 'Moon' },
      { name: 'mdi:weather-cloudy', label: 'Cloud' },
      { name: 'mdi:weather-rainy', label: 'Rain' },
      { name: 'mdi:weather-snowy', label: 'Snow' },
      { name: 'mdi:weather-lightning', label: 'Lightning' },
      { name: 'mdi:weather-windy', label: 'Wind' },
      { name: 'mdi:tree', label: 'Tree' },
      { name: 'mdi:flower', label: 'Flower' },
      { name: 'mdi:leaf', label: 'Leaf' },
      { name: 'ph:sun-fill', label: 'Sun Filled' },
      { name: 'ph:moon-fill', label: 'Moon Filled' },
      { name: 'ph:cloud-fill', label: 'Cloud Filled' },
      { name: 'ph:rainbow-fill', label: 'Rainbow' },
      { name: 'ph:plant-fill', label: 'Plant' },
      { name: 'lucide:cloud-sun', label: 'Cloud Sun' },
      { name: 'lucide:moon-star', label: 'Moon Star' },
      { name: 'tabler:sun', label: 'Sun Alt' },
      { name: 'tabler:moon-stars', label: 'Moon Stars' },
      { name: 'tabler:rainbow', label: 'Rainbow Alt' },
      { name: 'ri:sun-fill', label: 'Sun Bright' },
      { name: 'ri:moon-fill', label: 'Moon Bright' },
    ],
  },
  {
    id: 'celebrations',
    name: 'Celebrations',
    icons: [
      { name: 'mdi:party-popper', label: 'Party Popper' },
      { name: 'mdi:confetti', label: 'Confetti' },
      { name: 'mdi:gift', label: 'Gift' },
      { name: 'mdi:cake', label: 'Cake' },
      { name: 'mdi:balloon', label: 'Balloon' },
      { name: 'mdi:trophy', label: 'Trophy' },
      { name: 'mdi:medal', label: 'Medal' },
      { name: 'mdi:firework', label: 'Firework' },
      { name: 'ph:party-popper-fill', label: 'Party Popper Filled' },
      { name: 'ph:confetti-fill', label: 'Confetti Filled' },
      { name: 'ph:gift-fill', label: 'Gift Filled' },
      { name: 'ph:balloon-fill', label: 'Balloon Filled' },
      { name: 'ph:trophy-fill', label: 'Trophy Filled' },
      { name: 'ph:champagne-fill', label: 'Champagne' },
      { name: 'lucide:party-popper', label: 'Party Popper Alt' },
      { name: 'lucide:cake', label: 'Cake Alt' },
      { name: 'tabler:award', label: 'Award' },
      { name: 'tabler:award-filled', label: 'Award Filled' },
      { name: 'tabler:trophy-filled', label: 'Trophy Filled' },
      { name: 'tabler:crown', label: 'Crown' },
      { name: 'ri:trophy-fill', label: 'Trophy Alt' },
      { name: 'mdi:crown', label: 'Crown Alt' },
    ],
  },
  {
    id: 'ui',
    name: 'UI Elements',
    icons: [
      { name: 'mdi:check', label: 'Checkmark' },
      { name: 'mdi:check-circle', label: 'Check Circle' },
      { name: 'mdi:close', label: 'Close' },
      { name: 'mdi:close-circle', label: 'Close Circle' },
      { name: 'mdi:plus', label: 'Plus' },
      { name: 'mdi:plus-circle', label: 'Plus Circle' },
      { name: 'mdi:minus', label: 'Minus' },
      { name: 'mdi:minus-circle', label: 'Minus Circle' },
      { name: 'mdi:information', label: 'Info' },
      { name: 'mdi:alert', label: 'Alert' },
      { name: 'mdi:help-circle', label: 'Help' },
      { name: 'ph:check-circle-fill', label: 'Check Circle Filled' },
      { name: 'ph:x-circle-fill', label: 'X Circle Filled' },
      { name: 'ph:info-fill', label: 'Info Filled' },
      { name: 'ph:warning-fill', label: 'Warning Filled' },
      { name: 'lucide:check-circle', label: 'Check Circle Alt' },
      { name: 'lucide:x-circle', label: 'X Circle Alt' },
      { name: 'tabler:check', label: 'Check Alt' },
      { name: 'tabler:x', label: 'X Alt' },
      { name: 'ri:checkbox-circle-fill', label: 'Checkbox Fill' },
      { name: 'heroicons:check-circle-solid', label: 'Check Solid' },
      { name: 'heroicons:exclamation-circle-solid', label: 'Exclamation Solid' },
    ],
  },
  {
    id: 'misc',
    name: 'Misc Decorative',
    icons: [
      { name: 'mdi:pin', label: 'Pin' },
      { name: 'mdi:map-marker', label: 'Map Marker' },
      { name: 'mdi:music', label: 'Music' },
      { name: 'mdi:music-note', label: 'Music Note' },
      { name: 'mdi:camera', label: 'Camera' },
      { name: 'mdi:video', label: 'Video' },
      { name: 'mdi:microphone', label: 'Microphone' },
      { name: 'mdi:headphones', label: 'Headphones' },
      { name: 'mdi:palette', label: 'Palette' },
      { name: 'mdi:brush', label: 'Brush' },
      { name: 'mdi:pencil', label: 'Pencil' },
      { name: 'mdi:lightbulb', label: 'Lightbulb' },
      { name: 'mdi:lightbulb-on', label: 'Lightbulb On' },
      { name: 'mdi:rocket', label: 'Rocket' },
      { name: 'mdi:earth', label: 'Earth' },
      { name: 'mdi:clock', label: 'Clock' },
      { name: 'mdi:calendar', label: 'Calendar' },
      { name: 'mdi:coffee', label: 'Coffee' },
      { name: 'mdi:food-apple', label: 'Apple' },
      { name: 'mdi:food', label: 'Food' },
      { name: 'ph:quote-fill', label: 'Quote' },
      { name: 'ph:quotes-fill', label: 'Quotes' },
      { name: 'ph:book-fill', label: 'Book' },
      { name: 'ph:flag-banner-fill', label: 'Banner' },
      { name: 'ph:flag-fill', label: 'Flag' },
      { name: 'ph:anchor-fill', label: 'Anchor' },
      { name: 'ph:compass-fill', label: 'Compass' },
      { name: 'lucide:tag', label: 'Tag' },
      { name: 'lucide:bookmark', label: 'Bookmark' },
      { name: 'lucide:zap', label: 'Zap' },
      { name: 'lucide:target', label: 'Target' },
      { name: 'tabler:guitar-pick-filled', label: 'Guitar Pick' },
      { name: 'tabler:key-filled', label: 'Key' },
      { name: 'tabler:lock-filled', label: 'Lock' },
      { name: 'tabler:heart-handshake', label: 'Handshake Heart' },
      { name: 'ri:focus-3-fill', label: 'Focus' },
      { name: 'ri:price-tag-3-fill', label: 'Price Tag' },
      { name: 'carbon:tag', label: 'Tag Alt' },
      { name: 'heroicons:bolt-solid', label: 'Bolt' },
      { name: 'ion:rocket', label: 'Rocket Alt' },
      { name: 'mdi:cards-heart', label: 'Heart Card' },
      { name: 'mdi:cards-diamond', label: 'Diamond Card' },
      { name: 'mdi:cards-club', label: 'Club Card' },
      { name: 'mdi:cards-spade', label: 'Spade Card' },
    ],
  },
]

// Helper function to get all icons flattened
export function getAllIconifyIcons(): IconifyIconDef[] {
  return ICONIFY_CATEGORIES.flatMap((cat) => cat.icons)
}

// Helper function to get icons by category
export function getIconsByCategory(categoryId: string): IconifyIconDef[] {
  const category = ICONIFY_CATEGORIES.find((cat) => cat.id === categoryId)
  return category ? category.icons : []
}

// Helper function to search icons locally (for filtering curated icons)
export function searchCuratedIcons(query: string): IconifyIconDef[] {
  const lowerQuery = query.toLowerCase()
  return getAllIconifyIcons().filter(
    (icon) =>
      icon.label.toLowerCase().includes(lowerQuery) ||
      icon.name.toLowerCase().includes(lowerQuery)
  )
}

// Iconify API endpoints
export const ICONIFY_API = {
  search: (query: string, limit = 48) =>
    `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  svg: (prefix: string, name: string) =>
    `https://api.iconify.design/${prefix}/${name}.svg`,
}

// Interface for Iconify search API response
export interface IconifySearchResult {
  icons: string[] // Array of icon names in 'prefix:name' format
  total: number
  limit: number
  start: number
}

// Helper function to fetch SVG from Iconify API
export async function fetchIconifySvg(iconName: string): Promise<string> {
  const [prefix, name] = iconName.split(':')
  if (!prefix || !name) {
    throw new Error(`Invalid icon name format: ${iconName}`)
  }
  const url = ICONIFY_API.svg(prefix, name)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${response.statusText}`)
  }
  return response.text()
}

// Helper function to search Iconify API
export async function searchIconify(query: string, limit = 48): Promise<IconifySearchResult> {
  const url = ICONIFY_API.search(query, limit)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`)
  }
  return response.json()
}
