import { Agent, fetch as undiciFetch } from 'undici'

// Agent to ensure requests to government APIs (INSEE, data.gouv.fr, BODACC) succeed
// even if local Windows certificates lack the specific intermediate authority.
const permissiveAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

export async function safeFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof url === 'string' ? url : url.toString()
  try {
    return await fetch(urlStr, init)
  } catch (error: any) {
    // If native fetch throws UNABLE_TO_VERIFY_LEAF_SIGNATURE or TLS handshake failure,
    // fallback cleanly to undici dispatcher with permissive connection settings.
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
