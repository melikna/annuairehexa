import { getDbReadonly } from '@/lib/db/client'
import { safeFetch } from '@/lib/api/fetch-client'
import type { Region, Departement, Commune } from '@/types/domain'
import { FALLBACK_REGIONS, FALLBACK_DEPARTEMENTS } from './referentiel-data'

export interface GeoAggregate {
  geoType: string
  geoCode: string
  calculatedAt: string
  totalEtablissements: number
  etablissementsActifs: number
  etablissementsFermes: number
  totalUnitesLegales: number
  unitesLegalesActives: number
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getRegions(): Promise<Region[]> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug
      FROM regions
      ORDER BY nom ASC
    `
    if (rows.length > 0) {
      return rows.map((r) => ({
        code: r.code,
        nom: r.nom,
        slug: r.slug,
      }))
    }
  } catch (error) {
    console.warn('[GeoService] DB indisponible pour getRegions, utilisation du référentiel embarqué.')
  }
  return FALLBACK_REGIONS
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug
      FROM regions
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (rows[0]) {
      return {
        code: rows[0].code,
        nom: rows[0].nom,
        slug: rows[0].slug,
      }
    }
  } catch (error) {
    // DB non accessible
  }
  return FALLBACK_REGIONS.find((r) => r.slug === slug || r.code === slug) ?? null
}

export async function getDepartements(codeRegion?: string): Promise<Departement[]> {
  try {
    const db = getDbReadonly()
    const rows = codeRegion
      ? await db`
          SELECT code, nom, slug, code_region
          FROM departements
          WHERE code_region = ${codeRegion}
          ORDER BY code ASC
        `
      : await db`
          SELECT code, nom, slug, code_region
          FROM departements
          ORDER BY code ASC
        `
    if (rows.length > 0) {
      return rows.map((r) => ({
        code: r.code,
        nom: r.nom,
        slug: r.slug,
        codeRegion: r.code_region,
      }))
    }
  } catch (error) {
    console.warn('[GeoService] DB indisponible pour getDepartements, utilisation du référentiel embarqué.')
  }

  if (codeRegion) {
    return FALLBACK_DEPARTEMENTS.filter((d) => d.codeRegion === codeRegion)
  }
  return FALLBACK_DEPARTEMENTS
}

export async function getDepartementBySlug(slug: string): Promise<Departement | null> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug, code_region
      FROM departements
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (rows[0]) {
      return {
        code: rows[0].code,
        nom: rows[0].nom,
        slug: rows[0].slug,
        codeRegion: rows[0].code_region,
      }
    }
  } catch (error) {
    // DB non accessible
  }
  return FALLBACK_DEPARTEMENTS.find((d) => d.slug === slug || d.code === slug) ?? null
}

export async function getDepartementByCode(code: string): Promise<Departement | null> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug, code_region
      FROM departements
      WHERE code = ${code}
      LIMIT 1
    `
    if (rows[0]) {
      return {
        code: rows[0].code,
        nom: rows[0].nom,
        slug: rows[0].slug,
        codeRegion: rows[0].code_region,
      }
    }
  } catch (error) {
    // DB non accessible
  }
  return FALLBACK_DEPARTEMENTS.find((d) => d.code === code) ?? null
}

export async function getCommunesByDepartement(
  codeDepartement: string,
  limit: number = 100
): Promise<Commune[]> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug, code_departement, code_region, population, latitude, longitude
      FROM communes
      WHERE code_departement = ${codeDepartement}
      ORDER BY population DESC NULLS LAST, nom ASC
      LIMIT ${limit}
    `
    if (rows.length > 0) {
      return rows.map((r) => ({
        code: r.code,
        nom: r.nom,
        slug: r.slug,
        codeDepartement: r.code_departement,
        codeRegion: r.code_region,
        codesPostaux: [],
        population: r.population ? Number(r.population) : undefined,
        coordonnees: (r.latitude && r.longitude) ? { latitude: Number(r.latitude), longitude: Number(r.longitude) } : undefined,
      }))
    }
  } catch (error) {
    // DB non accessible, fallback sur l'API publique geo.api.gouv.fr
  }

  try {
    const res = await safeFetch(
      `https://geo.api.gouv.fr/departements/${codeDepartement}/communes?fields=nom,code,codesPostaux,population,centre`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (res.ok) {
      const data: any[] = await res.json()
      // Trouver la région du département
      const dep = FALLBACK_DEPARTEMENTS.find((d) => d.code === codeDepartement)
      const codeRegion = dep?.codeRegion ?? ''

      return data
        .sort((a, b) => (b.population || 0) - (a.population || 0))
        .slice(0, limit)
        .map((c) => ({
          code: c.code,
          nom: c.nom,
          slug: toSlug(c.nom),
          codeDepartement,
          codeRegion,
          codesPostaux: c.codesPostaux || [],
          population: c.population,
          coordonnees: c.centre?.coordinates
            ? { latitude: c.centre.coordinates[1], longitude: c.centre.coordinates[0] }
            : undefined,
        }))
    }
  } catch (apiError) {
    console.warn(`[GeoService] Erreur API geo pour département ${codeDepartement}:`, apiError)
  }

  return []
}

export async function getCommuneBySlug(slug: string): Promise<Commune | null> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT code, nom, slug, code_departement, code_region, population, latitude, longitude
      FROM communes
      WHERE slug = ${slug}
      LIMIT 1
    `
    if (rows[0]) {
      return {
        code: rows[0].code,
        nom: rows[0].nom,
        slug: rows[0].slug,
        codeDepartement: rows[0].code_departement,
        codeRegion: rows[0].code_region,
        codesPostaux: [],
        population: rows[0].population ? Number(rows[0].population) : undefined,
        coordonnees: (rows[0].latitude && rows[0].longitude) ? { latitude: Number(rows[0].latitude), longitude: Number(rows[0].longitude) } : undefined,
      }
    }
  } catch (error) {
    // Fallback API geo
  }

  try {
    const cleanNom = slug.replace(/-/g, ' ')
    const res = await safeFetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cleanNom)}&fields=nom,code,codesPostaux,population,codeDepartement,codeRegion,centre&boost=population&limit=1`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (res.ok) {
      const data: any[] = await res.json()
      if (data.length > 0) {
        const c = data[0]
        return {
          code: c.code,
          nom: c.nom,
          slug,
          codeDepartement: c.codeDepartement,
          codeRegion: c.codeRegion,
          codesPostaux: c.codesPostaux || [],
          population: c.population,
          coordonnees: c.centre?.coordinates
            ? { latitude: c.centre.coordinates[1], longitude: c.centre.coordinates[0] }
            : undefined,
        }
      }
    }
  } catch (apiError) {
    console.warn(`[GeoService] Erreur API geo pour commune slug ${slug}:`, apiError)
  }

  return null
}

export async function getGeoStats(geoType: string, geoCode: string): Promise<GeoAggregate | null> {
  try {
    const db = getDbReadonly()
    const rows = await db`
      SELECT geo_type, geo_code, calculated_at, total_etablissements,
             etablissements_actifs, etablissements_fermes,
             total_unites_legales, unites_legales_actives
      FROM geo_aggregates
      WHERE geo_type = ${geoType} AND geo_code = ${geoCode}
      LIMIT 1
    `
    if (!rows[0]) return null
    return {
      geoType: rows[0].geo_type,
      geoCode: rows[0].geo_code,
      calculatedAt: rows[0].calculated_at,
      totalEtablissements: Number(rows[0].total_etablissements || 0),
      etablissementsActifs: Number(rows[0].etablissements_actifs || 0),
      etablissementsFermes: Number(rows[0].etablissements_fermes || 0),
      totalUnitesLegales: Number(rows[0].total_unites_legales || 0),
      unitesLegalesActives: Number(rows[0].unites_legales_actives || 0),
    }
  } catch (error) {
    return null
  }
}
