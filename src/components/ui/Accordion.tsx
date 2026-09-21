'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  id: string
  title: string
  content: string | React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
}

export function Accordion({ items, className = '' }: AccordionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <details
          key={item.id}
          className="group bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-blue-300"
        >
          <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-semibold text-sm text-gray-900 list-none group-open:border-b group-open:border-gray-100">
            <span>{item.title}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
          </summary>
          <div className="p-4 text-sm text-gray-600 leading-relaxed bg-gray-50/50">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  )
}
