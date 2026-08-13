import { describe, expect, it } from 'vitest'
import { getRequestId } from '../../src/server/security/requestContext.js'

function requestWith(value?: string) {
  return { headers: value === undefined ? {} : { 'x-request-id': value } } as never
}

function response() {
  const headers: Record<string, string> = {}
  return { headers, res: { setHeader(name: string, value: string) { headers[name] = value } } as never }
}

describe('request correlation IDs', () => {
  it('generates an ID when absent', () => {
    const target = response()
    expect(getRequestId(requestWith(), target.res)).toMatch(/^[0-9a-f-]{36}$/)
    expect(target.headers['X-Request-Id']).toBeDefined()
  })

  it('preserves a safe caller ID', () => {
    const target = response()
    expect(getRequestId(requestWith('request-test-1234'), target.res)).toBe('request-test-1234')
  })

  it.each(['short', 'contains spaces and bearer', 'x'.repeat(129)])('replaces malformed ID %s', (value) => {
    const target = response()
    expect(getRequestId(requestWith(value), target.res)).not.toBe(value)
  })
})
