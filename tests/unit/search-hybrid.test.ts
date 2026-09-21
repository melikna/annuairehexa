import { describe, test, expect } from '@jest/globals'
import { SearchEngineHybrid } from '@/lib/search/engine'
import { getRegions, getDepartements, getDepartementByCode } from '@/lib/geo/service'

describe('SearchEngineHybrid & Geo Referentiel Fallbacks', () => {
  const engine = new SearchEngineHybrid()

  test('getRegions returns all 18 French regions when DB is offline', async () => {
    const regions = await getRegions()
    expect(regions.length).toBe(18)
    const ileDeFrance = regions.find((r) => r.code === '11')
    expect(ileDeFrance).toBeDefined()
    expect(ileDeFrance?.nom).toBe('Île-de-France')
  })

  test('getDepartements returns all 101 French departments when DB is offline', async () => {
    const departements = await getDepartements()
    expect(departements.length).toBe(101)
    const paris = await getDepartementByCode('75')
    expect(paris).toBeDefined()
    expect(paris?.nom).toBe('Paris')
    expect(paris?.codeRegion).toBe('11')
  })

  test('searchUnitesLegales finds real enterprise "sasu melik nakhla" via live government API fallback', async () => {
    const searchRes = await engine.searchUnitesLegales({ q: 'sasu melik nakhla', page: 1, perPage: 20 })
    expect(searchRes.results.length).toBeGreaterThan(0)
    const match = searchRes.results.find((r) => r.siren === '951595016')
    expect(match).toBeDefined()
    expect(match?.denominationAffichable).toContain('MELIK NAKHLA')
  }, 15000)

  test('getUniteLegale retrieves SIREN 951595016 with complete legal data and siege SIRET', async () => {
    const company = await engine.getUniteLegale('951595016')
    expect(company).not.toBeNull()
    expect(company?.siren).toBe('951595016')
    expect(company?.siretSiege).toBe('95159501600019')
    expect(company?.etatAdministratif).toBe('A')
    expect(company?.categorieJuridique).toBe('5710')
  }, 15000)
})
