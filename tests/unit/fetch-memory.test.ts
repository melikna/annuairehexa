import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import net from 'net'
import { socksFetch, safeFetch } from '../../src/lib/api/fetch-client'

describe('SOCKS request lifecycle', () => {
  let server: net.Server
  const sockets = new Set<net.Socket>()
  let respond: (socket: net.Socket) => void
  const oldHost = process.env.SOCKS_PROXY_HOST
  const oldPort = process.env.SOCKS_PROXY_PORT

  beforeAll(async () => {
    server = net.createServer(socket => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      socket.once('data', () => {
        socket.write(Buffer.from([5, 0]))
        socket.once('data', () => {
          socket.write(Buffer.from([5, 0, 0, 1, 127, 0, 0, 1, 0, 80]))
          socket.once('data', () => respond(socket))
        })
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    process.env.SOCKS_PROXY_HOST = '127.0.0.1'
    process.env.SOCKS_PROXY_PORT = String((server.address() as net.AddressInfo).port)
  })
  afterAll(async () => {
    for (const socket of sockets) socket.destroy()
    await new Promise<void>(resolve => server.close(() => resolve()))
    if (oldHost === undefined) delete process.env.SOCKS_PROXY_HOST
    else process.env.SOCKS_PROXY_HOST = oldHost
    if (oldPort === undefined) delete process.env.SOCKS_PROXY_PORT
    else process.env.SOCKS_PROXY_PORT = oldPort
  })
  it('settles stalled responses on abort instead of retaining them forever', async () => {
    respond = () => {}
    await expect(socksFetch('http://example.test/', { signal: AbortSignal.timeout(100) })).rejects.toThrow()
  })
  it('settles connections closed without a response', async () => {
    respond = socket => socket.end()
    await expect(socksFetch('http://example.test/')).rejects.toThrow()
  })
  it('rejects oversized bodies and remains usable afterward', async () => {
    respond = socket => socket.end('HTTP/1.1 200 OK\r\n\r\n' + 'x'.repeat(5 * 1024 * 1024))
    await expect(socksFetch('http://example.test/')).rejects.toThrow('memory budget')
    respond = socket => socket.end('HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK')
    expect(await (await socksFetch('http://example.test/')).text()).toBe('OK')
  })
  it('does not retry requests that were already cancelled', async () => {
    const controller = new AbortController()
    controller.abort(new Error('cancelled'))
    await expect(safeFetch('http://example.test/', { signal: controller.signal })).rejects.toThrow('cancelled')
  })
})
