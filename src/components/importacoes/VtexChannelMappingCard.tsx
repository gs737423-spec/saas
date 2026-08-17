import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Route } from 'lucide-react'
import { useConnections } from '@/contexts/ConnectionContext'
import { supabase } from '@/lib/supabaseClient'
import { withViewAsCompanyId } from '@/lib/apiFetch'

interface DiscoveredChannel {
  externalKey: string
  displayName: string
  externalIdentifier: string
  canonicalChannel: string
  canonicalDisplayName: string
  resolutionStatus: 'resolved' | 'unresolved' | 'ignored'
  lastSeenAt: string
}

interface CanonicalChannel {
  canonicalKey: string
  displayName: string
  channelType: string
}

interface ChannelListResponse {
  ok: boolean
  channels: DiscoveredChannel[]
  canonicalChannels: CanonicalChannel[]
  message?: string
}

interface MappingDraft {
  target: string
  customKey: string
  customDisplayName: string
}

const CUSTOM_CHANNEL = '__new__'

async function authorizationHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}

export default function VtexChannelMappingCard() {
  const { vtex, syncingVtex, syncVtex } = useConnections()
  const [channels, setChannels] = useState<DiscoveredChannel[]>([])
  const [canonicalChannels, setCanonicalChannels] = useState<CanonicalChannel[]>([])
  const [drafts, setDrafts] = useState<Record<string, MappingDraft>>({})
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [needsReprocess, setNeedsReprocess] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const connected = Boolean(vtex && ['connected', 'syncing', 'requires_attention'].includes(vtex.status))

  const loadChannels = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetch(withViewAsCompanyId('/api/integrations/vtex/channel-mappings'), {
        headers: await authorizationHeader(),
        signal,
      })
      const result = await response.json().catch(() => null) as ChannelListResponse | null
      if (!response.ok || !result?.ok) throw new Error(result?.message ?? 'Não foi possível consultar os canais VTEX.')
      setChannels(result.channels)
      setCanonicalChannels(result.canonicalChannels)
      setDrafts((current) => Object.fromEntries(result.channels.map((channel) => [channel.externalKey, current[channel.externalKey] ?? { target: '', customKey: '', customDisplayName: '' }])))
    } catch (error) {
      if (signal?.aborted) return
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Não foi possível consultar os canais VTEX.' })
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!connected) return
    const controller = new AbortController()
    void loadChannels(controller.signal)
    return () => controller.abort()
  }, [connected, loadChannels])

  if (!connected) return null

  function updateDraft(externalKey: string, patch: Partial<MappingDraft>) {
    setDrafts((current) => ({ ...current, [externalKey]: { ...(current[externalKey] ?? { target: '', customKey: '', customDisplayName: '' }), ...patch } }))
  }

  async function save(channel: DiscoveredChannel) {
    const draft = drafts[channel.externalKey]
    if (!draft?.target) return
    const custom = draft.target === CUSTOM_CHANNEL
    setSavingKey(channel.externalKey)
    setMessage(null)
    try {
      const response = await fetch(withViewAsCompanyId('/api/integrations/vtex/channel-mappings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authorizationHeader()) },
        body: JSON.stringify({
          externalKey: channel.externalKey,
          canonicalChannel: custom ? draft.customKey : draft.target,
          ...(custom ? { displayName: draft.customDisplayName } : {}),
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.message ?? 'Não foi possível salvar o mapeamento.')
      setNeedsReprocess(Boolean(result.requiresFullSync))
      setMessage({ ok: true, text: 'Mapeamento salvo. Sincronize novamente para aplicar aos pedidos anteriores.' })
      await loadChannels()
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Não foi possível salvar o mapeamento.' })
    } finally {
      setSavingKey(null)
    }
  }

  async function reprocessHistory() {
    setMessage(null)
    const result = await syncVtex('full')
    if (!result?.ok) {
      setMessage({ ok: false, text: result?.message ?? 'Não foi possível iniciar a sincronização histórica.' })
      return
    }
    setNeedsReprocess(false)
    setMessage({ ok: true, text: 'Sincronização completa iniciada. O histórico será reclassificado sem duplicar pedidos.' })
  }

  return (
    <div className="connection-card glass-panel rounded-md p-4 sm:p-5">
      <div className="flex items-start gap-2.5">
        <Route className="mt-0.5 h-4 w-4 text-accent-blue" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Canais encontrados na VTEX</h3>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-text-muted">A lista vem da sincronização real. Canais novos permanecem nos totais e ficam marcados para revisão.</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {loading && <div className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-3 text-[11px] text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" />Consultando canais...</div>}
        {!loading && channels.length === 0 && <p className="rounded-lg border border-border-subtle px-3 py-3 text-[11px] text-text-muted">Nenhum canal foi encontrado ainda. Execute a primeira sincronização completa.</p>}
        {channels.map((channel) => {
          const draft = drafts[channel.externalKey] ?? { target: '', customKey: '', customDisplayName: '' }
          const resolved = channel.resolutionStatus === 'resolved'
          const custom = draft.target === CUSTOM_CHANNEL
          return (
            <div key={channel.externalKey} className="rounded-lg border border-border-subtle bg-bg-primary/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-xs font-semibold text-text-primary">{channel.displayName}</p><p className="truncate text-[10px] text-text-muted">Identificador: {channel.externalIdentifier}</p></div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${resolved ? 'bg-accent-emerald/15 text-accent-emerald' : 'bg-accent-amber/15 text-accent-amber'}`}>{resolved ? 'Mapeado' : 'Revisar mapeamento'}</span>
              </div>
              {resolved ? <p className="mt-2 text-[10.5px] text-text-secondary">Canal analítico: <span className="font-semibold">{channel.canonicalDisplayName}</span></p> : (
                <div className="mt-2 grid gap-2">
                  <select aria-label={`Canal canônico para ${channel.displayName}`} value={draft.target} onChange={(event) => updateDraft(channel.externalKey, { target: event.target.value })} className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-blue">
                    <option value="">Selecionar canal canônico</option>
                    {canonicalChannels.map((option) => <option key={option.canonicalKey} value={option.canonicalKey}>{option.displayName}</option>)}
                    <option value={CUSTOM_CHANNEL}>Criar canal analítico...</option>
                  </select>
                  {custom && <div className="grid gap-2 sm:grid-cols-2"><input aria-label="Nome do novo canal analítico" value={draft.customDisplayName} onChange={(event) => updateDraft(channel.externalKey, { customDisplayName: event.target.value })} placeholder="Nome do canal" className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue" /><input aria-label="Chave do novo canal analítico" value={draft.customKey} onChange={(event) => updateDraft(channel.externalKey, { customKey: event.target.value })} placeholder="chave-do-canal" className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue" /></div>}
                  <button type="button" onClick={() => void save(channel)} disabled={!draft.target || (custom && (!draft.customKey || !draft.customDisplayName)) || savingKey === channel.externalKey} className="control-active inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50">{savingKey === channel.externalKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Salvar mapeamento</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {message && <p className={`mt-2 flex items-start gap-1.5 text-[10.5px] ${message.ok ? 'text-accent-emerald' : 'text-accent-rose'}`}>{message.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}{message.text}</p>}
      {needsReprocess && <button type="button" onClick={() => void reprocessHistory()} disabled={syncingVtex || Boolean(vtex?.activeSync)} className="control-inactive mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50">{syncingVtex ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Sincronizar histórico agora</button>}
    </div>
  )
}
