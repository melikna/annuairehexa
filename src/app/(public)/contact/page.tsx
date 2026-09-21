import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Mail, MapPin, Building2, Clock, ShieldCheck, Send, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contactez-nous — Annuairehexa',
  description: 'Formulaire de contact et coordonnées du service Annuairehexa : support utilisateur, signalement et assistance.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Contact' }]} />

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <Mail className="w-3.5 h-3.5" />
            Support &amp; Correspondance
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contactez l'équipe {siteName}</h1>
          <p className="text-gray-600 text-sm mt-1">
            Une question sur une fiche entreprise, un signalement ou une suggestion technique ? Nous vous répondons sous 48h.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne informations éditeur */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-4">Informations Éditeur</h2>

              <div className="space-y-4 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Éditeur</strong>
                    <span>Mélik Nakhla</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Adresse de correspondance</strong>
                    <span>60 rue François 1er<br />75008 Paris, France</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Immatriculation</strong>
                    <span>SIRET : 753 719 996 00054</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Courriel direct</strong>
                    <a href="mailto:contact@annuairehexa.fr" className="text-blue-600 hover:underline font-medium">
                      contact@annuairehexa.fr
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block">Délai de traitement</strong>
                    <span>Réponse sous 24 à 48 heures ouvrées</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Encart spécifique RGPD */}
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-900 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Droit d'opposition RGPD ?
              </div>
              <p className="leading-relaxed mb-3">
                Si votre demande concerne la suppression ou le déréférencement de vos données nominatives (statut P Insee,
                art. 21 RGPD), utilisez notre formulaire prioritaire dédié.
              </p>
              <Link
                href="/correction"
                className="inline-block px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-[11px] transition-colors"
              >
                Accéder au formulaire RGPD →
              </Link>
            </div>
          </div>

          {/* Colonne Formulaire de contact */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Envoyez-nous un message</h2>
              <p className="text-xs text-gray-500 mb-6">
                Tous les champs marqués d'une étoile (*) sont obligatoires pour nous permettre d'instruire votre demande.
              </p>

              <form action="mailto:contact@annuairehexa.fr" method="get" className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nom" className="block font-semibold text-gray-700 mb-1">
                      Votre nom et prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      required
                      placeholder="Jean Dupont"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-semibold text-gray-700 mb-1">
                      Adresse email de réponse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="jean.dupont@example.com"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block font-semibold text-gray-700 mb-1">
                      Objet de la demande <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">Sélectionnez un motif...</option>
                      <option value="Question sur une fiche entreprise">Question sur une fiche entreprise</option>
                      <option value="Signalement technique ou bug">Signalement d'un bug ou dysfonctionnement</option>
                      <option value="Demande d'information légale">Question relative aux données légales</option>
                      <option value="Partenariat ou presse">Partenariat ou presse</option>
                      <option value="Autre demande">Autre demande</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="siren" className="block font-semibold text-gray-700 mb-1">
                      Numéro SIREN / SIRET (facultatif)
                    </label>
                    <input
                      type="text"
                      id="siren"
                      name="siren"
                      placeholder="9 chiffres (ex : 753719996)"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block font-semibold text-gray-700 mb-1">
                    Votre message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Détaillez votre demande en fournissant tous les éléments pertinents..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors resize-y"
                  />
                </div>

                {/* Encart de consentement RGPD obligatoire */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="rgpd-consent"
                      name="rgpd-consent"
                      required
                      className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="rgpd-consent" className="text-gray-600 text-[11px] leading-relaxed cursor-pointer">
                      <strong>Consentement RGPD :</strong> En cochant cette case, j'accepte expressément que les données saisies
                      dans ce formulaire soient traitées par {siteName} aux seules fins de gestion et de réponse à mon message,
                      conformément à la{' '}
                      <Link href="/confidentialite" className="text-blue-600 underline font-semibold">
                        politique de confidentialité
                      </Link>.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Envoyer mon message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
