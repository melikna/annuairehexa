'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from 'lucide-react'

export default function CorrectionPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/correction', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Une erreur est survenue lors de l\'enregistrement de votre demande.')
      }

      setSubmitted(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de transmettre votre demande. Veuillez réessayer ultérieurement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Opposition & Rectification RGPD' }]} />

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Guichet gratuit d'exercice des droits RGPD
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Opposition, Déréférencement &amp; Rectification
          </h1>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed">
            Exercez vos droits légaux (Articles 16, 17 et 21 du RGPD). Cette procédure est <strong>strictement gratuite</strong> et instruite sous 48h.
          </p>
        </header>

        {/* Alerte informative CNIL et INSEE */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 mb-8 text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-blue-950">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            Bon à savoir : Deux niveaux de mise à jour possibles
          </div>
          <p className="leading-relaxed">
            <strong>1. Sur Annuairehexa :</strong> Ce formulaire enregistre immédiatement votre demande dans notre registre de blocage
            et déréférence la fiche entreprise concernée de nos pages publiques et des moteurs de recherche.
          </p>
          <p className="leading-relaxed">
            <strong>2. À la source Insee :</strong> Pour masquer définitivement votre adresse personnelle de l'ensemble des annuaires
            réutilisant la base Sirene, activez également votre droit d'opposition gratuit (statut P) sur le téléservice officiel de l'Insee :{' '}
            <a
              href="https://statut-diffusion-sirene.insee.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-blue-700 inline-flex items-center gap-0.5"
            >
              statut-diffusion-sirene.insee.fr
              <ExternalLink className="w-3 h-3" />
            </a>.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Votre demande a été enregistrée avec succès</h2>
            <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed mb-6">
              Notre délégué à la protection des données (DPO) traite votre demande dans les plus brefs délais.
              Un accusé de réception a été consigné dans notre registre de conformité RGPD.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-xs"
            aria-label="Formulaire d'exercice des droits RGPD"
          >
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SIREN ou SIRET */}
            <div>
              <label htmlFor="entity_id" className="block font-semibold text-gray-800 mb-1.5">
                Numéro SIREN ou SIRET concerné <span className="text-red-500">*</span>
              </label>
              <input
                id="entity_id"
                name="entity_id"
                type="text"
                required
                pattern="[0-9]{9}([0-9]{5})?"
                placeholder="123456789 (SIREN 9 chiffres) ou 12345678900012 (SIRET 14 chiffres)"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-gray-50 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Indiquez les 9 chiffres du SIREN ou les 14 chiffres de l'établissement sans espaces.
              </p>
            </div>

            {/* Type de demande */}
            <div>
              <label htmlFor="request_type" className="block font-semibold text-gray-800 mb-1.5">
                Nature de la demande légale <span className="text-red-500">*</span>
              </label>
              <select
                id="request_type"
                name="request_type"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="">Sélectionnez votre droit RGPD...</option>
                <option value="opposition">Droit d'opposition &amp; Déréférencement (Art. 21 RGPD - Statut P Insee)</option>
                <option value="suppression">Demande d'effacement / Droit à l'oubli (Art. 17 RGPD)</option>
                <option value="correction">Rectification d'une information inexacte (Art. 16 RGPD)</option>
                <option value="acces">Droit d'accès et communication des données (Art. 15 RGPD)</option>
              </select>
            </div>

            {/* Coordonnées du demandeur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="requester_name" className="block font-semibold text-gray-800 mb-1.5">
                  Nom et prénom du demandeur <span className="text-red-500">*</span>
                </label>
                <input
                  id="requester_name"
                  name="requester_name"
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label htmlFor="requester_email" className="block font-semibold text-gray-800 mb-1.5">
                  Email de notification <span className="text-red-500">*</span>
                </label>
                <input
                  id="requester_email"
                  name="requester_email"
                  type="email"
                  required
                  placeholder="jean.dupont@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Précisions / Description */}
            <div>
              <label htmlFor="description" className="block font-semibold text-gray-800 mb-1.5">
                Précisions et motifs de la demande <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                maxLength={2000}
                placeholder="Indiquez avec précision les mentions à déréférencer, corriger ou masquer (ex : adresse personnelle du dirigeant, fin d'activité, etc.)."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y text-xs bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Encarts de consentement RGPD obligatoires */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent_quality"
                    name="consent_quality"
                    required
                    className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="consent_quality" className="text-gray-700 text-[11px] leading-relaxed cursor-pointer">
                    <strong>Attestation sur l'honneur :</strong> J'atteste sur l'honneur être la personne physique concernée
                    ou le représentant légal habilité de l'entreprise désignée par ce numéro SIREN.
                  </label>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent_rgpd"
                    name="consent_rgpd"
                    required
                    className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="consent_rgpd" className="text-gray-700 text-[11px] leading-relaxed cursor-pointer">
                    <strong>Consentement RGPD :</strong> En application des articles 15 à 21 du Règlement Général sur la Protection des Données (RGPD),
                    je consens au traitement de mes informations par Annuairehexa aux seules fins d'instruire ma demande légale,
                    conformément à la{' '}
                    <Link href="/confidentialite" className="text-blue-600 underline font-semibold">
                      politique de confidentialité
                    </Link>.
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Traitement et transmission...' : 'Transmettre ma demande légale'}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  )
}
