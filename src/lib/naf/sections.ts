export interface NafSection {
  code: string
  nom: string
  description: string
}

export const NAF_SECTIONS: NafSection[] = [
  { code: 'A', nom: 'Agriculture, sylviculture et pêche', description: 'Culture, élevage, chasse, exploitation forestière, pêche et aquaculture.' },
  { code: 'B', nom: 'Industries extractives', description: 'Extraction d\'hydrocarbures, minerais métalliques et autres produits minéraux.' },
  { code: 'C', nom: 'Industrie manufacturière', description: 'Agroalimentaire, textile, bois, chimie, métallurgie, équipements électroniques et machines.' },
  { code: 'D', nom: 'Production et distribution d\'électricité, de gaz, de vapeur et d\'air conditionné', description: 'Énergie électrique, gaz naturel et distribution d\'énergie thermique.' },
  { code: 'E', nom: 'Production et distribution d\'eau ; assainissement, gestion des déchets', description: 'Traitement et distribution d\'eau, collecte et recyclage des déchets.' },
  { code: 'F', nom: 'Construction', description: 'Bâtiment, travaux publics, génie civil et travaux de construction spécialisés.' },
  { code: 'G', nom: 'Commerce ; réparation d\'automobiles et de motocycles', description: 'Commerce de gros, commerce de détail et réparation de véhicules.' },
  { code: 'H', nom: 'Transports et entreposage', description: 'Transports terrestres, aériens, maritimes, logistique et services postaux.' },
  { code: 'I', nom: 'Hébergement et restauration', description: 'Hôtels, hébergements touristiques, restaurants, débits de boisson et traiteurs.' },
  { code: 'J', nom: 'Information et communication', description: 'Édition, audiovisuel, télécommunications, programmation et services informatiques.' },
  { code: 'K', nom: 'Activités financières et d\'assurance', description: 'Banques, assurances, gestion de fonds et activités de holding.' },
  { code: 'L', nom: 'Activités immobilières', description: 'Promotion immobilière, agences, location et administration de biens.' },
  { code: 'M', nom: 'Activités spécialisées, scientifiques et techniques', description: 'Juridique, comptabilité, conseil, ingénierie, recherche scientifique et publicité.' },
  { code: 'N', nom: 'Activités de services administratifs et de soutien', description: 'Intérim, sécurité, nettoyage, agences de voyages et services de secrétariat.' },
  { code: 'O', nom: 'Administration publique', description: 'Services de l\'État, collectivités territoriales et sécurité sociale.' },
  { code: 'P', nom: 'Enseignement', description: 'Enseignement scolaire, supérieur, professionnel et formation continue.' },
  { code: 'Q', nom: 'Santé humaine et action sociale', description: 'Hôpitaux, médecins, soins dentaires, maisons de retraite et aide sociale.' },
  { code: 'R', nom: 'Arts, spectacles et activités récréatives', description: 'Spectacles vivants, musées, bibliothèques, sports et parcs d\'attractions.' },
  { code: 'S', nom: 'Autres activités de services', description: 'Associations, syndicats, réparation d\'ordinateurs, coiffure et soins de beauté.' },
  { code: 'T', nom: 'Activités des ménages en tant qu\'employeurs', description: 'Emploi de personnel de maison et production domestique.' },
  { code: 'U', nom: 'Activités extra-territoriales', description: 'Organisations internationales et représentations diplomatiques.' },
]
