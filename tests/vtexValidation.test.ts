import { describe, expect, it } from 'vitest'
import { buildVtexBaseUrl, normalizeVtexAccountName, normalizeVtexCanonicalChannel, normalizeVtexChannelDisplayName, normalizeVtexChannelMappings, normalizeVtexExternalChannelKey, sanitizeVtexPath, validateVtexCredential } from '../src/server/integrations/vtex/validation'

describe('VTEX endpoint validation', () => {
  it('constructs the host only from a strict account slug', () => {
    expect(normalizeVtexAccountName(' Minha-Loja ')).toBe('minha-loja')
    expect(buildVtexBaseUrl('minha-loja')).toBe('https://minha-loja.vtexcommercestable.com.br')
  })

  it.each(['https://evil.example', 'localhost', '127.0.0.1', 'foo.bar', '-invalid'])('rejects SSRF-shaped account %s', (value) => {
    expect(() => normalizeVtexAccountName(value)).toThrow('VTEX_INVALID_ACCOUNT')
  })

  it('rejects absolute, protocol-relative and header-injection paths', () => {
    for (const path of ['https://evil.example/a', '//evil.example/a', '/ok\r\nX-Evil: yes']) {
      expect(() => sanitizeVtexPath(path)).toThrow('VTEX_INVALID_PATH')
    }
    expect(sanitizeVtexPath('/api/oms/pvt/orders?page=1')).toBe('/api/oms/pvt/orders?page=1')
  })

  it('rejects empty and multiline credentials', () => {
    expect(() => validateVtexCredential('', 'appKey')).toThrow('VTEX_INVALID_APP_KEY')
    expect(() => validateVtexCredential('secret\nleak', 'appToken')).toThrow('VTEX_INVALID_APP_TOKEN')
  })

  it('normalizes explicit affiliate mappings without guessing providers', () => {
    expect(normalizeVtexChannelMappings({ mercadolivre: [' MLB ', 'mlb'], shopee: ['SHP'], magalu: ['MGL'], marketplace_xyz: ['XYZ'] })).toEqual({ mercadolivre: ['mlb'], shopee: ['shp'], magalu: ['mgl'], marketplace_xyz: ['xyz'] })
    expect(() => normalizeVtexChannelMappings({ amazon: ['https://invalid'] })).toThrow('VTEX_INVALID_CHANNEL_MAPPING')
    expect(() => normalizeVtexChannelMappings({ 'INVALID CHANNEL': ['abc'] })).toThrow('VTEX_INVALID_CHANNEL_MAPPING')
  })

  it('validates dynamic mapping identities and labels without a fixed marketplace enum', () => {
    expect(normalizeVtexCanonicalChannel(' Marketplace_XYZ ')).toBe('marketplace_xyz')
    expect(normalizeVtexChannelDisplayName(' Marketplace XYZ ')).toBe('Marketplace XYZ')
    expect(normalizeVtexExternalChannelKey('affiliate:XYZ')).toBe('affiliate:XYZ')
    expect(() => normalizeVtexCanonicalChannel('canal inválido')).toThrow('VTEX_INVALID_CHANNEL_MAPPING')
    expect(() => normalizeVtexChannelDisplayName('\n')).toThrow('VTEX_INVALID_CHANNEL_MAPPING')
    expect(() => normalizeVtexExternalChannelKey('affiliate:\nXYZ')).toThrow('VTEX_INVALID_CHANNEL_MAPPING')
  })
})
