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
    color: 'bg-orange-700 hover:bg-orange-800',
  },
  {
    name: 'WMN Digital',
    title: 'Former mon équipe à l’IA',
    description: 'Découvrez les formations pour intégrer l’intelligence artificielle dans votre quotidien professionnel.',
    href: 'https://wmn-digital.fr',
    linkTitle: 'Formation IA',
    action: 'Découvrir les formations',
    Icon: GraduationCap,
    color: 'bg-violet-700 hover:bg-violet-800',
  },
]

export function BusinessOffers() {
  return (
    <section aria-label="Services pour votre entreprise" className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-700">
          Pour développer votre entreprise
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map(({ name, title, description, href, linkTitle, action, Icon, color }) => (
            <a
              key={name}
              href={href}
              title={linkTitle}
              className={`group flex flex-col rounded-2xl p-5 text-white shadow-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-950 ${color}`}
            >
              <div className="mb-2 flex items-center gap-2 text-white">
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{name}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
              <p className="mb-4 mt-2 text-sm leading-relaxed text-white">{description}</p>
              <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-950 group-hover:underline">
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
