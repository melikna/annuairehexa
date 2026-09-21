'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  textToCopy: string
  label?: string
  className?: string
}

export function CopyButton({ textToCopy, label = 'Copier', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Impossible de copier dans le presse-papier:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label} : ${textToCopy}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
          <span className="text-green-700 font-medium">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
