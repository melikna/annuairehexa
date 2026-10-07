import { ArrowUpRight, Globe, GraduationCap } from 'lucide-react'

const offers = [
  {
    name: 'SiteToClient',
    title: 'Créer le site de mon entreprise',
    description: 'Présentez votre activité et vos services avec un site internet professionnel.',
    href: 'https://www.sitetoclient.com/',
    linkTitle: 'Création de site internet',
    action: 'Découvrir SiteToClient',
    Icon: Globe,
  },
  {
    name: 'WMN Digital',
    title: 'Former mon équipe à l’IA',
    description: 'Découvrez les formations pour intégrer l’intelligence artificielle dans votre quotidien professionnel.',
    href: 'https://wmn-digital.fr',
    linkTitle: 'Formation IA',
    action: 'Découvrir les formations',
    Icon: GraduationCap,
  },
]

export function BusinessOffers() {
  return (
    <section aria-label="Services pour votre entreprise" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Pour développer votre entreprise
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map(({ name, title, description, href, linkTitle, action, Icon }) => (
            <a
              key={name}
              href={href}
              title={linkTitle}
              className="group flex flex-col rounded-2xl border border-blue-100 bg-blue-50/50 p-6 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <div className="mb-4 flex items-center gap-3 text-blue-700">
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{name}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-gray-950">{title}</h2>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-700 group-hover:underline">
                {action}
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
