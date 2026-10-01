import { jest, it, expect } from '@jest/globals'
jest.mock('postgres', () => ({ __esModule: true, default: jest.fn(() => ({})) }))
import postgres from 'postgres'
import { getDb, getDbReadonly } from '../../src/lib/db/client'

it('reuses one pool in production across repeated requests and read-only fallback', () => {
  const previous = { ...process.env }
  try {
    process.env = { ...process.env, NODE_ENV: 'production' }
    process.env.DATABASE_URL = 'postgres://user:password@localhost/test'
    delete process.env.DATABASE_URL_READONLY
    global.__db = undefined
    global.__db_readonly = undefined
    const first = getDb()
    for (let i = 0; i < 1000; i++) {
      expect(getDb()).toBe(first)
      expect(getDbReadonly()).toBe(first)
    }
    expect(postgres).toHaveBeenCalledTimes(1)
  } finally {
    process.env = previous
    global.__db = undefined
    global.__db_readonly = undefined
  }
})
