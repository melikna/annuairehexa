import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Database, FileText, Settings, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administration — Annuairehexa',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-blue-600 rounded text-xs font-bold font-mono">ADMIN</span>
            <span className="font-semibold text-sm">Gestion Annuaire Entreprises</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au site public
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  )
}
