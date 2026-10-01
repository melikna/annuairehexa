import { jest, describe, it, expect } from '@jest/globals'
import { BoundedCache } from '../../src/lib/api/bounded-cache'
import { singleFlight } from '../../src/lib/api/single-flight'

it('shares concurrent loads, rejects excess unique work and releases failed slots', async () => {
  const load = singleFlight<number>(1)
  let finish!: (value: number) => void
  const first = load('a', () => new Promise<number>(resolve => { finish = resolve }))
  expect(load('a', async () => 99)).toBe(first)
  await expect(load('b', async () => 2)).rejects.toThrow('capacity')
  finish(1)
  await expect(first).resolves.toBe(1)
  await expect(load('c', async () => { throw new Error('failed') })).rejects.toThrow('failed')
  await expect(load('d', async () => 4)).resolves.toBe(4)
})

describe('bounded caches', () => {
  it('evicts oldest entries even for thousands of unique URLs', () => {
    const cache = new BoundedCache<{ expiresAt: number; text: string }>(4, 1024)
    for (let i = 0; i < 10000; i++) cache.set(String(i), { expiresAt: Date.now() + 60000, text: 'x'.repeat(100) })
    expect(cache.size).toBe(4)
    expect(cache.byteSize).toBeLessThanOrEqual(1024)
    expect(cache.get('0')).toBeUndefined()
    expect(cache.get('9999')).toBeDefined()
  })
  it('expires entries and rejects an oversized value', () => {
    const cache = new BoundedCache<{ expiresAt: number; text: string }>(10, 100)
    cache.set('large', { expiresAt: Date.now() + 10000, text: 'x'.repeat(101) })
    expect(cache.size).toBe(0)
    jest.spyOn(Date, 'now').mockReturnValue(100)
    cache.set('small', { expiresAt: 200, text: 'x' })
    jest.spyOn(Date, 'now').mockReturnValue(201)
    expect(cache.get('small')).toBeUndefined()
    expect(cache.byteSize).toBe(0)
    jest.restoreAllMocks()
  })
})
