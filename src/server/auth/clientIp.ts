import type { VercelRequest } from '@vercel/node'

/**
 * IP do cliente pra chave de rate limit em endpoints públicos (sem usuário
 * autenticado pra usar como chave). Vercel injeta `x-forwarded-for` com o IP
 * real na primeira posição; fallback pra `socket.remoteAddress` fora da Vercel
 * (dev local) e pra 'unknown' se nada estiver disponível (nesse caso todo
 * tráfego sem IP identificável compartilha o mesmo bucket — pior caso é mais
 * rate limit, não menos).
 */
export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0].split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}
