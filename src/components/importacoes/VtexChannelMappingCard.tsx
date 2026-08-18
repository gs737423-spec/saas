import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, RefreshCw, Route, Search } from 'lucide-react'
import { useConnections } from '@/contexts/ConnectionContext'
import { supabase } from '@/lib/supabaseClient'
import { withViewAsCompanyId } from '@/lib/apiFetch'
import ChannelLogo from '@/lib/channelBranding'

/** Uma linha = um IDENTIFICADOR BRUTO devolvido pela VTEX (affiliateId ou
 *  salesChannel). Deliberadamente NÃO é chamado de "marketplace" enquanto
 *  não estiver resolvido — antes de existir um mapeamento, "MZN" é só um
 *  texto que veio no pedido. */
interface DiscoveredIdentifier {
  externalKey: string
  identifierType: 'affiliate_id' | 'sales_channel' | 'native_store' | 'unidentified'
  identifierValue: string
  identifierLabel: string
  canonicalChannel: string | null
  canonicalDisplayName: string | null
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
  channels: DiscoveredIdentifier[]
  counters?: { total: number; resolved: number; unresolved: number }
  canonicalChannels: CanonicalChannel[]
  message?: string
}

const CUSTOM_CHANNEL = '__new__'
type FilterMode = 'pending' | 'resolved' | 'all'

async function authorizationHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}

interface MappingDraft { target: string; customKey: string; customDisplayName: string }
const EMPTY_DRAFT: MappingDraft = { target: '', customKey: '', customDisplayName: '' }

/** Seção "Canais encontrados na VTEX".
 *
 *  Redesenhada para escala real: a validação em produção trouxe dezenas de
 *  identificadores, e o layout anterior (um card vertical grande por item)
 *  virava uma página infinita. Agora: contadores no cabeçalho, busca,
 *  filtro, lista compacta de uma linha por identificador, e os já
 *  resolvidos agrupados sob o canal canônico ("Amazon — 3 identificadores
 *  VTEX"), colapsados por padrão. */
export default function VtexChannelMappingCard() {
  const { vtex, syncingVtex, syncVtex } = useConnections()
  const [identifiers, setIdentifiers] = useState<DiscoveredIdentifier[]>([])
  const [canonicalChannels, setCanonicalChannels] = useState<CanonicalChannel[]>([])
  const [drafts, setDrafts] = useState<Record<string, MappingDraft>>({})
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [needsReprocess, setNeedsReprocess] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('pending')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
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
      setIdentifiers(result.channels)
      setCanonicalChannels(result.canonicalChannels)
      setDrafts((current) => Object.fromEntries(result.channels.map((item) => [item.externalKey, current[item.externalKey] ?? EMPTY_DRAFT])))
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

  const counters = useMemo(() => ({
    total: identifiers.length,
    resolved: identifiers.filter((item) => item.resolutionStatus === 'resolved').length,
    pending: identifiers.filter((item) => item.resolutionStatus !== 'resolved').length,
  }), [identifiers])

  const normalizedQuery = query.trim().toLowerCase()
  const matches = useCallback((item: DiscoveredIdentifier) => {
    if (!normalizedQuery) return true
    return [item.identifierValue, item.identifierLabel, item.canonicalDisplayName ?? '', item.externalKey]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  }, [normalizedQuery])

  const pending = useMemo(
    () => identifiers.filter((item) => item.resolutionStatus !== 'resolved' && matches(item)),
    [identifiers, matches],
  )

  /** Agrupamento por canal canônico — é isso que impede a lista de crescer
   *  linearmente com o número de identificadores já resolvidos. */
  const resolvedGroups = useMemo(() => {
    const groups = new Map<string, { key: string; displayName: string; items: DiscoveredIdentifier[] }>()
    for (const item of identifiers) {
      if (item.resolutionStatus !== 'resolved' || !item.canonicalChannel) continue
      if (!matches(item)) continue
      const group = groups.get(item.canonicalChannel)
        ?? { key: item.canonicalChannel, displayName: item.canonicalDisplayName ?? item.canonicalChannel, items: [] }
      group.items.push(item)
      groups.set(item.canonicalChannel, group)
    }
    return [...groups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
  }, [identifiers, matches])

  if (!connected) return null

  function updateDraft(externalKey: string, patch: Partial<MappingDraft>) {
    setDrafts((current) => ({ ...current, [externalKey]: { ...(current[externalKey] ?? EMPTY_DRAFT), ...patch } }))
  }

  async function save(item: DiscoveredIdentifier) {
    const draft = drafts[item.externalKey]
    if (!draft?.target) return
    const custom = draft.target === CUSTOM_CHANNEL
    setSavingKey(item.externalKey)
    setMessage(null)
    try {
      const response = await fetch(withViewAsCompanyId('/api/integrations/vtex/channel-mappings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await authorizationHeader()) },
        body: JSON.stringify({
          externalKey: item.externalKey,
          canonicalChannel: custom ? draft.customKey : draft.target,
          ...(custom ? { displayName: draft.customDisplayName } : {}),
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.message ?? 'Não foi possível salvar o mapeamento.')
      setNeedsReprocess(Boolean(result.requiresFullSync))
      setMessage({ ok: true, text: 'Mapeamento salvo. Sincronize novamente para reclassificar o histórico.' })
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

  const showPending = filter === 'pending' || filter === 'all'
  const showResolved = filter === 'resolved' || filter === 'all'

  return (
    <div className="connection-card glass-panel rounded-md p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Route className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Canais encontrados na VTEX</h3>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-text-muted">
              Cada linha é um identificador que a VTEX enviou nos pedidos. Ele só vira um canal depois que você indicar a qual canal pertence. Os pedidos continuam contando nos totais enquanto isso.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold">
          <span className="rounded-full bg-accent-emerald/15 px-2 py-0.5 text-accent-emerald">{counters.resolved} mapeados</span>
          <span className="rounded-full bg-accent-amber/15 px-2 py-0.5 text-accent-amber">{counters.pending} pendentes</span>
        </div>
      </div>

      {counters.total > 0 && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar identificador ou canal"
              aria-label="Buscar identificador ou canal"
              className="w-full rounded-lg border border-border-default bg-bg-primary py-2 pl-8 pr-3 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue"
            />
          </label>
          <div className="flex shrink-0 gap-1" role="group" aria-label="Filtrar identificadores">
            {([['pending', 'Pendentes'], ['resolved', 'Mapeados'], ['all', 'Todos']] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={filter === mode}
                onClick={() => setFilter(mode)}
                className={`rounded-lg px-2.5 py-2 text-[11px] font-semibold ${filter === mode ? 'control-active' : 'control-inactive'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-1.5">
        {loading && <div className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-3 text-[11px] text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" />Consultando canais...</div>}
        {!loading && counters.total === 0 && <p className="rounded-lg border border-border-subtle px-3 py-3 text-[11px] text-text-muted">Nenhum identificador foi encontrado ainda. Execute a primeira sincronização completa.</p>}

        {!loading && showPending && pending.map((item) => {
          const draft = drafts[item.externalKey] ?? EMPTY_DRAFT
          const custom = draft.target === CUSTOM_CHANNEL
          return (
            <div key={item.externalKey} className="rounded-lg border border-border-subtle bg-bg-primary/60 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {/* Não identificado = ícone neutro. Nunca logo emprestada. */}
                <ChannelLogo canonicalKey={null} size={22} label="Canal ainda não identificado" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text-primary">{item.identifierValue}</p>
                  <p className="truncate text-[10px] text-text-muted">{item.identifierLabel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent-amber/15 px-2 py-0.5 text-[9.5px] font-semibold text-accent-amber">Não identificado</span>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  aria-label={`Canal para o identificador ${item.identifierValue}`}
                  value={draft.target}
                  onChange={(event) => updateDraft(item.externalKey, { target: event.target.value })}
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-blue sm:flex-1"
                >
                  <option value="">Selecionar canal</option>
                  {canonicalChannels.map((option) => <option key={option.canonicalKey} value={option.canonicalKey}>{option.displayName}</option>)}
                  <option value={CUSTOM_CHANNEL}>Criar canal...</option>
                </select>
                <button
                  type="button"
                  onClick={() => void save(item)}
                  disabled={!draft.target || (custom && (!draft.customKey || !draft.customDisplayName)) || savingKey === item.externalKey}
                  className="control-active inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {savingKey === item.externalKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Salvar
                </button>
              </div>
              {custom && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input aria-label="Nome do novo canal" value={draft.customDisplayName} onChange={(event) => updateDraft(item.externalKey, { customDisplayName: event.target.value })} placeholder="Nome do canal" className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue" />
                  <input aria-label="Chave do novo canal" value={draft.customKey} onChange={(event) => updateDraft(item.externalKey, { customKey: event.target.value })} placeholder="chave-do-canal" className="rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue" />
                </div>
              )}
            </div>
          )
        })}

        {!loading && showPending && pending.length === 0 && counters.total > 0 && filter === 'pending' && (
          <p className="rounded-lg border border-border-subtle px-3 py-3 text-[11px] text-text-muted">
            {normalizedQuery ? 'Nenhum identificador pendente corresponde à busca.' : 'Todos os identificadores já estão mapeados.'}
          </p>
        )}

        {!loading && showResolved && resolvedGroups.map((group) => {
          const expanded = Boolean(expandedGroups[group.key])
          return (
            <div key={group.key} className="rounded-lg border border-border-subtle bg-bg-primary/40">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
              >
                {/* Logo por chave canônica — nunca por nome. */}
                <ChannelLogo canonicalKey={group.key} size={22} label={group.displayName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-text-primary">{group.displayName}</span>
                  <span className="block text-[10px] text-text-muted">{group.items.length} {group.items.length === 1 ? 'identificador VTEX' : 'identificadores VTEX'}</span>
                </span>
                {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
              </button>
              {expanded && (
                <ul className="border-t border-border-subtle px-3 py-2">
                  {group.items.map((item) => (
                    <li key={item.externalKey} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-1">
                      <span className="min-w-0 truncate text-[11px] text-text-secondary">{item.identifierValue}</span>
                      <span className="shrink-0 text-[10px] text-text-muted">{item.identifierLabel}</span>
                    </li>
                  ))}
                </ul>
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
