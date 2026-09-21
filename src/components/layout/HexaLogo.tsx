import React from 'react'

interface HexaLogoProps {
  className?: string
  iconOnly?: boolean
}

export function HexaLogo({ className = '', iconOnly = false }: HexaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 font-sans ${className}`}>
      {/* Icône SVG Hexagone Géométrique & Données */}
      <svg
        className="w-8 h-8 shrink-0 drop-shadow-xs"
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hexaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="hexaAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Contour Hexagonal (L'Hexagone) */}
        <polygon
          points="20,2 38,12 38,32 20,42 2,32 2,12"
          fill="url(#hexaGrad)"
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Motif interne : grille / data nodes / bâtiment stylisé */}
        <path
          d="M20 10 L20 22 M20 22 L10 28 M20 22 L30 28"
          stroke="url(#hexaAccent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="10" r="2.5" fill="#FFFFFF" />
        <circle cx="10" cy="28" r="2.5" fill="#38BDF8" />
        <circle cx="30" cy="28" r="2.5" fill="#F43F5E" />
        <circle cx="20" cy="22" r="2" fill="#FFFFFF" />
      </svg>

      {!iconOnly && (
        <span className="flex items-baseline tracking-tight">
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Annuaire</span>
          <span className="text-xl font-black text-blue-600 ml-0.5">hexa</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5 self-center inline-block" />
        </span>
      )}
    </div>
  )
}
