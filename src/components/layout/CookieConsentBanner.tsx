'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Cookie, Check, X, Settings2 } from 'lucide-react'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)

  useEffect(() => {
    // Vérifier si le choix a déjà été enregistré
    const saved = localStorage.getItem('annuairehexa_cookie_consent')
    if (!saved) {
      // Afficher le bandeau après un léger délai pour un rendu fluide
      const timer = setTimeout(() => setShowBanner(true), 600)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  // Écouter un événement personnalisé pour ré-ouvrir les préférences depuis le Footer
  useEffect(() => {
    const handleOpen = () => {
      setShowModal(true)
    }
    window.addEventListener('open_cookie_preferences', handleOpen)
    return () => window.removeEventListener('open_cookie_preferences', handleOpen)
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(
      'annuairehexa_cookie_consent',
      JSON.stringify({
        status: 'accepted_all',
        date: new Date().toISOString(),
        analytics: true,
      })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  const handleRefuseAll = () => {
    localStorage.setItem(
      'annuairehexa_cookie_consent',
      JSON.stringify({
        status: 'refused_all',
        date: new Date().toISOString(),
        analytics: false,
      })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(
      'annuairehexa_cookie_consent',
      JSON.stringify({
        status: 'custom',
        date: new Date().toISOString(),
        analytics: analyticsEnabled,
      })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  if (!showBanner && !showModal) return null

  return (
    <>
      {/* Bandeau principal fixé en bas de l'écran */}
      {showBanner && !showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gestion des cookies et confidentialité"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl transition-all"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-4xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-900 mb-1">
                  Respect de votre vie privée et conformité RGPD
                </p>
                <p className="text-gray-600 text-xs">
                  Annuairehexa utilise des cookies strictement nécessaires au fonctionnement du service et, avec votre accord,
                  des cookies de mesure d'audience anonymisée afin d'optimiser les performances de recherche. Conformément aux
                  recommandations de la <strong>CNIL</strong>, vous pouvez accepter, refuser ou personnaliser vos choix à tout moment.
                  Consultez notre{' '}
                  <Link href="/confidentialite" className="text-blue-600 underline hover:text-blue-800">
                    politique de confidentialité
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handleRefuseAll}
                className="flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl transition-colors cursor-pointer"
              >
                Tout refuser
              </button>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex-1 md:flex-none px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Personnaliser
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 md:flex-none px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de personnalisation détaillée */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cookie-title"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <h3 id="modal-cookie-title" className="text-base font-bold text-gray-900">
                  Préférences de confidentialité des cookies
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Fermer la fenêtre"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-gray-600 leading-relaxed max-h-[60vh] overflow-y-auto">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-900">Cookies techniques essentiels</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
                    Toujours actif
                  </span>
                </div>
                <p className="text-gray-600">
                  Nécessaires à la navigation, à la sécurité et à la mémorisation de vos choix de consentement. Ne peuvent être désactivés.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-900">Mesure d'audience &amp; Statistiques</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-gray-600">
                  Permet de mesurer anonymement le trafic et l'utilisation des fonctionnalités de recherche pour améliorer l'expérience utilisateur.
                </p>
              </div>

              <p className="text-[11px] text-gray-500">
                Vous pouvez modifier ou retirer votre consentement à tout moment en cliquant sur le lien « Gestion des cookies »
                situé dans le pied de page du site.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleRefuseAll}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
