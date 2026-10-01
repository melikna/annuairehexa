import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Search,
  MapPin,
  TrendingUp,
  Database,
  Shield,
  BookOpen,
  Building2,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowRight,
  Calculator,
  Briefcase,
  HelpCircle,
  Clock,
  FileCheck,
  Building,
  GraduationCap,
  Truck,
  HeartPulse,
  Hammer,
  Utensils,
  Laptop,
} from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { InstantSearchAutocomplete } from '@/components/search/InstantSearchAutocomplete'
import { ProceduresCollectivesWidget } from '@/components/procedures/ProceduresCollectivesWidget'
import { fetchProceduresCollectives } from '@/lib/procedures/procedures-service'
import { NouvellesCreationsWidget } from '@/components/creations/NouvellesCreationsWidget'
import { fetchNouvellesCreations } from '@/lib/creations/creations-service'
import { FALLBACK_REGIONS } from '@/lib/geo/referentiel-data'

export const metadata: Metadata = {
  title: 'Annuairehexa — Annuaire national des entreprises françaises (Insee & BODACC)',
  description:
    "Consultez gratuitement les fiches de toutes les entreprises et établissements en France : SIREN, SIRET, TVA, dirigeants, bilans, procédures collectives BODACC, créations du jour, code NAF et adresse.",
  alternates: {
    canonical: '/',
  },
}

export const revalidate = 3600 // 1 heure

const POPULAR_SEARCHES = [
  { label: 'SASU', q: 'SASU' },
  { label: 'Organismes de formation', q: 'formation' },
  { label: 'BTP & Rénovation', q: 'batiment' },
  { label: 'Informatique & Conseil', q: 'informatique' },
  { label: 'Restauration', q: 'restaurant' },
  { label: 'Immobilier', q: 'immobilier' },
]

const POPULAR_CITIES = [
  { nom: 'Paris', slug: 'paris' },
  { nom: 'Marseille', slug: 'marseille' },
  { nom: 'Lyon', slug: 'lyon' },
  { nom: 'Toulouse', slug: 'toulouse' },
  { nom: 'Nice', slug: 'nice' },
  { nom: 'Nantes', slug: 'nantes' },
  { nom: 'Montpellier', slug: 'montpellier' },
  { nom: 'Strasbourg', slug: 'strasbourg' },
  { nom: 'Bordeaux', slug: 'bordeaux' },
  { nom: 'Lille', slug: 'lille' },
  { nom: 'Rennes', slug: 'rennes' },
  { nom: 'Amiens', slug: 'amiens' },
]

const REGION_SUBTITLES: Record<string, string> = {
  'auvergne-rhone-alpes': '12 départements',
  'bourgogne-franche-comte': '8 départements',
  'bretagne': '4 départements',
  'centre-val-de-loire': '6 départements',
  'corse': '2 départements',
  'grand-est': '10 départements',
  'guadeloupe': 'Outre-mer (971)',
  'guyane': 'Outre-mer (973)',
  'hauts-de-france': '5 départements',
  'ile-de-france': '8 départements',
  'la-reunion': 'Outre-mer (974)',
  'martinique': 'Outre-mer (972)',
  'mayotte': 'Outre-mer (976)',
  'normandie': '5 départements',
  'nouvelle-aquitaine': '12 départements',
  'occitanie': '13 départements',
  'pays-de-la-loire': '5 départements',
  'provence-alpes-cote-d-azur': '6 départements',
}

const KEY_SECTORS = [
  { icon: Hammer, title: 'Construction & BTP', code: 'F', desc: 'Génie civil, maçonnerie, électricité, plomberie, rénovation' },
  { icon: Laptop, title: 'Informatique & Numérique', code: 'J', desc: 'Édition logicielle, programmation, hébergement, IA, web' },
  { icon: Utensils, title: 'Hôtellerie & Restauration', code: 'I', desc: 'Restaurants traditionnels, traiteurs, débits de boissons, hôtels' },
  { icon: Briefcase, title: 'Services aux Entreprises', code: 'M', desc: 'Conseil en gestion, comptabilité, juridique, ingénierie, marketing' },
  { icon: HeartPulse, title: 'Santé & Action Sociale', code: 'Q', desc: 'Cabinets médicaux, dentaires, soins infirmiers, cliniques' },
  { icon: GraduationCap, title: 'Enseignement & Formation', code: 'P', desc: 'Formation professionnelle continue, écoles, coaching certifié' },
  { icon: Truck, title: 'Transports & Logistique', code: 'H', desc: 'Transport routier, fret express, entreposage, livraisons' },
  { icon: Building, title: 'Activités Immobilières', code: 'L', desc: 'Agences, syndics, marchands de biens, promotion et location' },
]

const FAQ_HOME = [
  {
    q: 'Comment vérifier le numéro SIREN ou SIRET d’une entreprise ?',
    a: 'Entrez simplement la raison sociale, le nom du dirigeant ou les chiffres du numéro d\'immatriculation dans notre barre de recherche intelligente. Notre outil vérifie la clé de Luhn et interroge en direct le répertoire Sirene de l’Insee.',
  },
  {
    q: 'Comment savoir si une entreprise est en redressement ou en liquidation ?',
    a: 'Chaque fiche entreprise intègre une surveillance en temps réel des annonces du BODACC (Bulletin Officiel des Annonces Civiles et Commerciales). Tout jugement de redressement judiciaire, liquidation ou sauvegarde est immédiatement signalé en tête de fiche.',
  },
  {
    q: 'Comment est calculé le numéro de TVA intracommunautaire ?',
    a: 'En France, le numéro de TVA intracommunautaire commence par "FR" suivi d\'une clé à deux chiffres calculée par la formule réglementaire : [12 + 3 * (SIREN modulo 97)] modulo 97, suivie des 9 chiffres du SIREN. Notre système le calcule et le valide automatiquement.',
  },
  {
    q: 'D’où proviennent les données de l’annuaire ?',
    a: '100% des informations publiées proviennent des répertoires publics ouverts : Base Sirene Insee, Registre National des Entreprises (INPI), et BODACC, sous Licence Ouverte 2.0 (Etalab).',
  },
]

export default async function HomePage() {
  const [recentProcedures, recentCreations] = await Promise.all([
    fetchProceduresCollectives({ limit: 6 }),
    fetchNouvellesCreations({ limit: 8 }),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Annuairehexa',
    url: 'https://annuairehexa.fr',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://annuairehexa.fr/recherche?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ================================================================
          HERO RECHERCHE INTELLIGENTE
          ================================================================ */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white pt-20 pb-24 px-4 overflow-hidden">
        {/* Éléments décoratifs graphiques */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-700/60 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Base Sirene INSEE &amp; RNE 2026 en direct
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Annuaire National des Entreprises en France
          </h1>

          <p className="text-blue-100 text-base sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Recherchez instantanément parmi plus de <strong>13 millions d'entreprises</strong>, artisans,
            commerçants et établissements répertoriés.
          </p>

          {/* Autocomplétion intelligente */}
          <div className="max-w-2xl mx-auto mb-6">
            <InstantSearchAutocomplete
              variant="hero"
              placeholder="Tapez un nom d'entreprise, SIREN, dirigeant, ville, code postal..."
              autoFocus
            />
          </div>

          {/* Requêtes fréquentes */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-blue-200">
            <span className="font-semibold text-white/80">Recherches populaires :</span>
            {POPULAR_SEARCHES.map((item) => (
              <Link
                key={item.label}
                href={`/recherche?q=${encodeURIComponent(item.q)}`}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          CHIFFRES CLÉS & ENGAGEMENTS
          ================================================================ */}
      <section className="relative -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center p-3 border-r border-gray-100 last:border-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-700">13,5M+</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Établissements Sirene</p>
          </div>
          <div className="text-center p-3 md:border-r border-gray-100 last:border-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-700">101</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Départements couverts</p>
          </div>
          <div className="text-center p-3 border-r border-gray-100 last:border-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">Temps Réel</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Alertes BODACC &amp; Faillites</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-700">100% Gratuit</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Données ouvertes publiques</p>
          </div>
        </div>
      </section>

      {/* ================================================================
          TOP SECTEURS PROFESSIONNELS
          ================================================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Nomenclature NAF Insee
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Explorer par secteur d'activité
            </h2>
          </div>
          <Link
            href="/secteurs"
            className="mt-3 md:mt-0 text-sm font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group"
          >
            Tous les secteurs d'activité
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {KEY_SECTORS.map((sec) => {
            const Icon = sec.icon
            return (
              <Link
                key={sec.code}
                href={`/activite/NAFRev2/${sec.code}`}
                className="p-5 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md rounded-2xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-base mb-1.5">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    {sec.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-blue-600 pt-3 border-t border-gray-100">
                  <span>Section {sec.code}</span>
                  <span className="group-hover:translate-x-1 transition-transform">Explorer →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ================================================================
          ENCART DES NOUVELLES CRÉATIONS DU JOUR (DIRECT BODACC & RNE)
          ================================================================ */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <NouvellesCreationsWidget
          initialData={recentCreations}
          limit={8}
        />
      </section>

      {/* ================================================================
          ENCART DES PROCÉDURES COLLECTIVES (LIQUIDATIONS & REDRESSEMENTS)
          ================================================================ */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <ProceduresCollectivesWidget
          initialData={recentProcedures}
          limit={6}
          showViewAllLink={true}
        />
      </section>

      {/* ================================================================
          EXPLORATION PAR RÉGION & GRANDES VILLES
          ================================================================ */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Maillage territorial
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-2">
              Implantation dans les 18 régions françaises
            </h2>
            <p className="text-sm text-gray-600">
              Accédez directement aux répertoires des entreprises par territoire administratif.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {FALLBACK_REGIONS.map((reg) => {
              const subtitle = REGION_SUBTITLES[reg.slug] ?? 'Région'
              return (
                <Link
                  key={reg.code}
                  href={`/region/${reg.slug}`}
                  className="p-3.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-xs rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[86px]"
                >
                  <MapPin className="w-4 h-4 text-blue-600 mb-1.5 opacity-75 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
                    {reg.nom}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {subtitle}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-xl mb-8 text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-gray-600 text-center sm:text-left">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Vous recherchez par numéro de département officiel (75 Paris, 13 Marseille, 69 Lyon, 59 Lille, 33 Bordeaux...) ?</span>
            </div>
            <Link
              href="/departements"
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Consulter les 101 départements français →
            </Link>
          </div>

          {/* Villes principales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Répertoire des grandes métropoles
            </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/ville/${c.slug}`}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 rounded-lg transition-colors font-medium"
                >
                  {c.nom}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          OUTILS ET GARANTIES DE FIABILITÉ
          ================================================================ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Outils &amp; Garanties de Fiabilité
          </h2>
          <p className="text-sm text-gray-600">
            Des technologies fiables pour auditer vos tiers, clients et fournisseurs en toute transparence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Validateur de TVA &amp; Clé de Luhn
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Calcul automatique de la clé valide de TVA intracommunautaire et contrôle de conformité de l’algorithme de Luhn sur les numéros SIREN à 9 chiffres.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Alerte BODACC en Temps Réel
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Détection instantanée des procédures collectives (sauvegardes, redressements judiciaires, liquidations) directement depuis les greffes des tribunaux de commerce.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Transition NAF 2025 Intégrée
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Anticipation de la nouvelle nomenclature NAF 2025 de l’Insee avec affichage côte-à-côte des codes actuels et futurs pour chaque établissement.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ PÉDAGOGIQUE
          ================================================================ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-2">
            <HelpCircle className="w-5 h-5" />
            Guide et questions fréquentes
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Tout savoir sur les données d'entreprises
          </h2>

          <div className="space-y-4">
            {FAQ_HOME.map((item, idx) => (
              <div key={idx} className="p-5 bg-white border border-gray-200 rounded-xl">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          AVERTISSEMENT LÉGAL
          ================================================================ */}
      <section className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            Annuairehexa est un service indépendant de consultation des données publiques ouvertes de la base
            Sirene de l’INSEE, du Registre National des Entreprises (RNE / INPI) et du BODACC (Licence Ouverte 2.0).
            Pour toute formalité d’immatriculation ou délivrance d'actes certifiés (Kbis, statuts), consultez les greffes des tribunaux de commerce.
          </p>
        </div>
      </section>
    </PublicLayout>
  )
}
