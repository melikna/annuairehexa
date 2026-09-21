import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Shield, Lock, Eye, RefreshCw, CheckCircle, Scale, Mail, MapPin, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de confidentialité et RGPD — Annuairehexa',
  description: 'Engagement de conformité RGPD d\'Annuairehexa : responsable du traitement Mélik Nakhla, exercice des droits d\'opposition, déréférencement, rectification et politique des cookies.',
  alternates: { canonical: '/confidentialite' },
}

export default function ConfidentialitePage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Annuairehexa'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Politique de confidentialité' }]} />

        <header className="mt-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Conformité intégrale RGPD (UE 2016/679) &amp; Loi Informatique et Libertés
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Politique de Confidentialité &amp; Protection des Données
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Dernière révision complète : 20 septembre 2026.
          </p>
        </header>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          {/* Introduction & Engagement */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              1. Engagement d'{siteName} et Cadre Réglementaire
            </h2>
            <p className="mb-3">
              Le respect de la vie privée et la sécurité des données à caractère personnel sont au cœur de nos engagements.
              La présente politique vous informe de manière claire et transparente sur la façon dont <strong>{siteName}</strong>{' '}
              collecte, utilise et protège les données, en stricte conformité avec :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li>Le <strong>Règlement Général sur la Protection des Données (RGPD n° 2016/679)</strong> du Parlement européen et du Conseil ;</li>
              <li>La <strong>loi n° 78-17 du 6 janvier 1978 modifiée</strong> relative à l'informatique, aux fichiers et aux libertés (« Loi Informatique et Libertés ») ;</li>
              <li>Les lignes directrices et recommandations de la <strong>CNIL</strong> concernant la réutilisation des données publiques ouvertes par les annuaires en ligne.</li>
            </ul>
          </section>

          {/* Responsable de traitement */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              2. Identité du Responsable de Traitement
            </h2>
            <p className="mb-3">
              Le responsable du traitement des données pour le site {siteName} ({siteUrl}) est :
            </p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <p><strong>Identité :</strong> Mélik Nakhla</p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>Adresse postale :</strong> 60 rue François 1er, 75008 Paris, France
              </p>
              <p className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>SIRET :</strong> 753 719 996 00054 (SIREN 753 719 996)
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <strong>Contact Référent RGPD :</strong>{' '}
                <a href="mailto:contact@annuairehexa.fr" className="text-blue-600 font-semibold hover:underline">
                  contact@annuairehexa.fr
                </a>
              </p>
            </div>
          </section>

          {/* Bases légales et finalités */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              3. Finalités du traitement et Bases Légales
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-gray-900 text-xs mb-1">A. Consultation publique et transparence économique</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                  <strong>Finalité :</strong> Mise à disposition du public d'un annuaire d'information économique sur les entreprises,
                  commerçants et artisans exerçant en France.
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Base légale :</strong> Article 6.1(e) et 6.1(f) du RGPD — Réutilisation légitime d'informations publiques ouvertes
                  (Code des relations entre le public et l'administration, Licence Ouverte 2.0 Etalab) dans l'intérêt public d'information
                  économique et de transparence des affaires.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-gray-900 text-xs mb-1">B. Traitement des demandes d'opposition et de rectification</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                  <strong>Finalité :</strong> Réception, instruction et exécution des demandes d'opposition (Article 21 RGPD),
                  de rectification (Article 16 RGPD) ou d'effacement / déréférencement (Article 17 RGPD).
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Base légale :</strong> Article 6.1(c) du RGPD — Respect d'une obligation légale incombant au responsable du traitement.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 text-xs mb-1">C. Mesure d'audience et sécurité du site</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                  <strong>Finalité :</strong> Prévention des attaques DDoS, analyse technique des requêtes et statistiques de fréquentation anonymisées.
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Base légale :</strong> Consentement (Art. 6.1(a) RGPD) pour les traceurs non essentiels et intérêt légitime (Art. 6.1(f) RGPD)
                  pour la sécurité des serveurs.
                </p>
              </div>
            </div>
          </section>

          {/* Catégories de données traitées */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              4. Catégories de Données Traitées
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
              <li>
                <strong>Données des personnes morales :</strong> Raison sociale, sigle, numéro SIREN, numéro SIRET,
                adresse du siège social et des établissements secondaires, code NAF/APE, statut juridique, forme sociale,
                chiffres de la tranche d'effectifs, annonces légales BODACC.
              </li>
              <li>
                <strong>Données des personnes physiques (Entrepreneurs Individuels) :</strong> Nom, prénoms usuels,
                nom commercial, adresse de l'établissement professionnel, date d'immatriculation.
                <em>
                  Note : ces informations ne sont diffusées que si l'entrepreneur individuel n'a pas manifesté d'opposition
                  auprès du répertoire Sirene de l'INSEE.
                </em>
              </li>
              <li>
                <strong>Données transmises via les formulaires :</strong> Identité du demandeur, adresse email de correspondance,
                numéro SIREN/SIRET concerné, justificatif éventuel et descriptif de la demande.
              </li>
            </ul>
          </section>

          {/* Droit d'opposition statut P Insee */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              5. Respect du Statut de Non-Diffusion Insee (Statut P)
            </h2>
            <p className="mb-3">
              Conformément à l'article A123-96 du Code de commerce, toute personne physique (auto-entrepreneur, artisan,
              profession libérale) a le droit de demander à ne pas figurer sur les listes publiques de diffusion du répertoire Sirene.
            </p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs mb-3 space-y-2">
              <p className="text-gray-700">
                <strong>Prise en compte automatique :</strong> Dès qu'une entreprise ou un professionnel est marqué avec le statut de diffusion
                partielle (statut « P ») dans le fichier Sirene de l'INSEE, notre infrastructure masque immédiatement :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Le nom et le prénom de la personne physique ;</li>
                <li>L'adresse précise de l'établissement (numéro et voie) ;</li>
                <li>Les coordonnées géographiques précises.</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600">
              Pour faire valoir votre droit d'opposition à la source directement auprès de l'Insee, vous pouvez vous rendre sur le portail officiel Insee :{' '}
              <a
                href="https://statut-diffusion-sirene.insee.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-medium"
              >
                statut-diffusion-sirene.insee.fr
              </a>.
            </p>
          </section>

          {/* Vos droits et exercice */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              6. Exercice de vos Droits (Articles 15 à 22 du RGPD)
            </h2>
            <p className="mb-3">
              Conformément à la réglementation européenne, toute personne concernée dispose des droits suivants :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900 mb-1">Droit d'opposition (Art. 21 RGPD)</p>
                <p className="text-gray-600">
                  Vous pouvez vous opposer à tout moment, sans frais et sans justification pour les entrepreneurs individuels,
                  à ce que vos données nominatives soient diffusées sur notre annuaire.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900 mb-1">Droit d'effacement &amp; Déréférencement (Art. 17)</p>
                <p className="text-gray-600">
                  Vous pouvez demander le déréférencement immédiat de votre fiche des moteurs de recherche et son masquage public.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900 mb-1">Droit de rectification (Art. 16 RGPD)</p>
                <p className="text-gray-600">
                  Vous pouvez demander la correction de données inexactes affichées sur votre fiche d'établissement.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900 mb-1">Droit d'accès (Art. 15 RGPD)</p>
                <p className="text-gray-600">
                  Vous avez le droit d'obtenir confirmation que des données vous concernant sont traitées et d'en recevoir une copie claire.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              <strong>Modalités pratiques :</strong> Les demandes s'effectuent sans aucun frais via notre formulaire sécurisé en ligne
              ou par email à <a href="mailto:contact@annuairehexa.fr" className="text-blue-600 underline font-medium">contact@annuairehexa.fr</a>.
              Elles sont instruites dans un délai maximum de <strong>30 jours</strong> (généralement sous 48 à 72 heures ouvrées).
            </p>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900">Souhaitez-vous exercer un droit d'opposition ou de rectification ?</p>
                <p className="text-[11px] text-blue-700">Procédure simplifiée et gratuite réservée aux professionnels et particuliers.</p>
              </div>
              <Link
                href="/correction"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shrink-0"
              >
                Formulaire d'exercice des droits
              </Link>
            </div>
          </section>

          {/* Durées de conservation */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              7. Durée de Conservation des Données
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
              <li>
                <strong>Données des répertoires économiques (Sirene, BODACC) :</strong> Conservées et actualisées périodiquement
                selon le rythme de publication des sources officielles ouvertes de l'État. En cas d'opposition validée, le masquage
                est rendu permanent.
              </li>
              <li>
                <strong>Données des formulaires de demande et d'opposition :</strong> Conservées pendant 12 mois à compter de la clôture
                de la demande à des fins probatoires de respect des obligations légales (Article 21 RGPD), puis supprimées définitivement.
              </li>
              <li>
                <strong>Cookies et choix de consentement :</strong> Votre choix (acceptation ou refus) est conservé pour une durée maximale
                de 6 mois conformément aux préconisations de la CNIL.
              </li>
            </ul>
          </section>

          {/* Réclamation CNIL */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              8. Droit de Réclamation auprès de la CNIL
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Si vous estimez, après nous avoir contactés, que vos droits Informatique et Libertés ne sont pas respectés,
              vous avez le droit d'introduire une réclamation auprès de l'autorité de contrôle compétente :
            </p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <p><strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong></p>
              <p>3 Place de Fontenoy - TSA 80715 - 75334 Paris Cedex 07</p>
              <p>Téléphone : 01 53 73 22 22 — Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.cnil.fr</a></p>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
