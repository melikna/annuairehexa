import net from 'net'
import tls from 'tls'
import { Agent, fetch as undiciFetch } from 'undici'

// Agent permissive pour les cas de certificats intermédiaires
const permissiveAgent = new Agent({
  connections: 4,
  connect: {
    rejectUnauthorized: false,
  },
})

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024
const MAX_ACTIVE_REQUESTS = 16
let activeRequests = 0

function socks5Connect(targetHost: string, targetPort: number, socksHost: string, socksPort: number, signal?: AbortSignal | null): Promise<net.Socket> {
  signal?.throwIfAborted()
  return new Promise((resolve, reject) => {
    const s = net.connect(socksPort, socksHost, () => {
      // Version 5, 1 méthode d'authentification (0x00: aucune)
      s.write(Buffer.from([0x05, 0x01, 0x00]))
    })

    const onAbort = () => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      s.destroy()
      reject(signal?.reason ?? new Error('Request aborted'))
    }
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      s.destroy()
      reject(new Error(`SOCKS5 connection timeout to ${socksHost}:${socksPort}`))
    }, 4000)
    signal?.addEventListener('abort', onAbort, { once: true })

    s.once('data', (data) => {
      if (data[0] !== 0x05 || data[1] !== 0x00) {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', onAbort)
        s.destroy()
        return reject(new Error('SOCKS5 auth negotiation failed'))
      }

      const hostBuf = Buffer.from(targetHost)
      const req = Buffer.concat([
        Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
        hostBuf,
        Buffer.from([(targetPort >> 8) & 0xff, targetPort & 0xff]),
      ])
      s.write(req)

      s.once('data', (resp) => {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', onAbort)
        if (resp[0] !== 0x05 || resp[1] !== 0x00) {
          s.destroy()
          return reject(new Error(`SOCKS5 connect command failed (code ${resp[1]})`))
        }
        resolve(s)
      })
    })

    s.on('error', (err) => {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      reject(err)
    })
  })
}

export async function socksFetch(urlStr: string, init?: RequestInit): Promise<Response> {
  init?.signal?.throwIfAborted()
  const isBuildTime = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build'
  if (isBuildTime && !process.env.SOCKS_PROXY_HOST) {
    throw new Error('SOCKS proxy bypassed during build phase')
  }

  const parsed = new URL(urlStr)
  const isHttps = parsed.protocol === 'https:'
  const targetPort = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80)
  const targetHost = parsed.hostname

  const socksHost = process.env.SOCKS_PROXY_HOST || (process.platform === 'linux' && process.env.NODE_ENV === 'production' ? '10.0.1.1' : undefined)
  if (!socksHost) {
    throw new Error('SOCKS proxy not configured in this environment')
  }
  const socksPort = parseInt(process.env.SOCKS_PROXY_PORT || '9050', 10)

  const rawSocket = await socks5Connect(targetHost, targetPort, socksHost, socksPort, init?.signal)

  const socket: net.Socket = isHttps
    ? (tls.connect({ socket: rawSocket, servername: targetHost, rejectUnauthorized: false }) as any)
    : rawSocket

  return new Promise((resolve, reject) => {
    let settled = false
    const chunks: Buffer[] = []
    let receivedBytes = 0
    const cleanup = () => {
      clearTimeout(deadline)
      init?.signal?.removeEventListener('abort', onAbort)
      chunks.length = 0
      socket.destroy()
      rawSocket.destroy()
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const onAbort = () => fail(init?.signal?.reason ?? new Error('Request aborted'))
    const deadline = setTimeout(() => fail(new Error('SOCKS response timeout')), 8000)
    init?.signal?.addEventListener('abort', onAbort, { once: true })
    socket.on('error', fail)
    socket.on('close', () => {
      if (!settled) fail(new Error('SOCKS connection closed before response completed'))
    })
    if (init?.signal?.aborted) { onAbort(); return }

    const method = (init?.method || 'GET').toUpperCase()
    const path = parsed.pathname + parsed.search
    let reqStr = `${method} ${path} HTTP/1.1\r\nHost: ${parsed.host}\r\nConnection: close\r\nUser-Agent: AnnuaireHexa/1.0 (contact@annuairehexa.fr)\r\n`

    if (init?.headers) {
      const entries = init.headers instanceof Headers
        ? Array.from(init.headers.entries())
        : Array.isArray(init.headers)
        ? init.headers
        : Object.entries(init.headers)

      for (const [k, v] of entries) {
        if (k.toLowerCase() !== 'host' && k.toLowerCase() !== 'connection' && k.toLowerCase() !== 'user-agent') {
          reqStr += `${k}: ${v}\r\n`
        }
      }
    }
    reqStr += '\r\n'

    socket.write(reqStr)
    if (init?.body) {
      if (typeof init.body === 'string') {
        socket.write(init.body)
      } else if (Buffer.isBuffer(init.body)) {
        socket.write(init.body)
      }
    }

    socket.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length
      if (receivedBytes > MAX_RESPONSE_BYTES) {
        fail(new Error('Upstream response exceeds memory budget'))
      } else {
        chunks.push(chunk)
      }
    })
    socket.on('end', () => {
      if (settled) return
      try {
      const buffer = Buffer.concat(chunks)
      const headerEnd = buffer.indexOf('\r\n\r\n')
      if (headerEnd === -1) {
        fail(new Error('Invalid HTTP response from upstream proxy'))
        return
      }

      const headerText = buffer.subarray(0, headerEnd).toString('utf-8')
      const bodyBuffer = buffer.subarray(headerEnd + 4)

      const [statusLine, ...headerLines] = headerText.split('\r\n')
      const [, statusCodeStr, ...statusTextParts] = (statusLine ?? '').split(' ')
      const status = parseInt(statusCodeStr || '200', 10) || 200
      const statusText = statusTextParts.join(' ')

      const headers = new Headers()
      let isChunked = false
      for (const line of headerLines) {
        const idx = line.indexOf(':')
        if (idx !== -1) {
          const name = line.substring(0, idx).trim()
          const val = line.substring(idx + 1).trim()
          headers.set(name, val)
          if (name.toLowerCase() === 'transfer-encoding' && val.toLowerCase().includes('chunked')) {
            isChunked = true
          }
        }
      }

      let finalBody = bodyBuffer
      if (isChunked) {
        const unchunked: Buffer[] = []
        let offset = 0
        while (offset < bodyBuffer.length) {
          const lineEnd = bodyBuffer.indexOf('\r\n', offset)
          if (lineEnd === -1) break
          const chunkSizeHex = bodyBuffer.subarray(offset, lineEnd).toString('ascii').trim()
          const chunkSize = parseInt(chunkSizeHex, 16)
          if (isNaN(chunkSize) || chunkSize === 0) break
          const chunkDataStart = lineEnd + 2
          const chunkDataEnd = chunkDataStart + chunkSize
          unchunked.push(bodyBuffer.subarray(chunkDataStart, chunkDataEnd))
          offset = chunkDataEnd + 2
        }
        finalBody = Buffer.concat(unchunked)
      }

      const res = new Response([204, 205, 304].includes(status) ? null : new Uint8Array(finalBody), {
        status,
        statusText,
        headers,
      })

      settled = true
      cleanup()
      resolve(res)
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)))
      }
    })
  })
}

async function fetchWithFallback(url: string | URL, init?: RequestInit): Promise<Response> {
  init?.signal?.throwIfAborted()
  const urlStr = typeof url === 'string' ? url : url.toString()
  const parsed = new URL(urlStr)

  // En production, les IP 37.59.183.0/24 (data.gouv.fr / api.gouv.fr) sont routées via le proxy SOCKS5 local
  const isApiGouv = parsed.hostname.endsWith('api.gouv.fr') || parsed.hostname.endsWith('data.gouv.fr')

  if (isApiGouv && process.platform === 'linux' && process.env.NODE_ENV === 'production') {
    try {
      return await socksFetch(urlStr, init)
    } catch (socksErr) {
      init?.signal?.throwIfAborted()
    }
  }

  try {
    return await fetch(urlStr, init)
  } catch (error: any) {
    init?.signal?.throwIfAborted()
    // Si fetch natif échoue (blocage réseau ou certificat), tenter socksFetch
    try {
      return await socksFetch(urlStr, init)
    } catch {
      init?.signal?.throwIfAborted()
      // Deuxième fallback: undici avec permissiveAgent
      try {
        const undiciRes = await undiciFetch(urlStr, {
          ...(init as any),
          dispatcher: permissiveAgent,
        })
        return undiciRes as unknown as Response
      } catch {
        throw error
      }
    }
  }
}

/** Bound the whole request, including body consumption, with no unbounded queue. */
export async function safeFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  init?.signal?.throwIfAborted()
  if (activeRequests >= MAX_ACTIVE_REQUESTS) throw new Error('Upstream request capacity reached')
  activeRequests++
  const controller = new AbortController()
  const onAbort = () => controller.abort(init?.signal?.reason)
  init?.signal?.addEventListener('abort', onAbort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('Upstream request timeout')), 8000)
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    const response = await fetchWithFallback(url, { ...init, signal: controller.signal })
    if (!response.body) return response
    reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_RESPONSE_BYTES) throw new Error('Upstream response exceeds memory budget')
      chunks.push(value)
    }
    return new Response(Buffer.concat(chunks), {
      status: response.status, statusText: response.statusText, headers: response.headers,
    })
  } finally {
    controller.abort()
    if (reader) await reader.cancel().catch(() => {})
    clearTimeout(timer)
    init?.signal?.removeEventListener('abort', onAbort)
    activeRequests--
  }
}
