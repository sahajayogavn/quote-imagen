import { useState, useEffect, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  storageKey: string
  children: ReactNode
  defaultExpanded?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  storageKey,
  children,
  defaultExpanded = true,
  className = '',
}: CollapsibleSectionProps) {
  // Initialize state from localStorage or default
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      return stored === 'true'
    }
    return defaultExpanded
  })

  // Persist state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, String(isExpanded))
  }, [isExpanded, storageKey])

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <button
        onClick={toggleExpanded}
        className="w-full py-2 px-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {title}
        </h2>
        <span
          className="text-gray-400 text-[10px] transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▼
        </span>
      </button>
      {isExpanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}
