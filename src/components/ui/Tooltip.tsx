import { useState } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  size?: number
  className?: string
}

export function Tooltip({ content, size = 16, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className={`text-gray-400 hover:text-stage-ribbon transition-colors cursor-help ${className}`}
        aria-label="More information"
      >
        <Info size={size} strokeWidth={2} />
      </button>

      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 px-4 py-3 bg-stage-gray-700 border-2 border-stage-ribbon/50 rounded-xl shadow-2xl shadow-stage-maroon/40 animate-in fade-in duration-200">
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-stage-ribbon/50"></div>
          <p className="text-sm text-gray-200 leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  )
}
