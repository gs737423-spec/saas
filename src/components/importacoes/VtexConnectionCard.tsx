import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, RefreshCw, Settings, ShieldCheck, Unplug, X } from 'lucide-react'
import { useConnections, type VtexCredentialsInput } from '@/contexts/ConnectionContext'
import VtexSyncProgressPanel from './VtexSyncProgressPanel'
import vtexLogo from '@/assets/marketplaces/vtex-logo.svg'

/** Códigos que sanitizedError() (backend, sync.ts) prefixa na mensagem
 *  quando o erro vem de credencial/permissão — decide o CTA certo em vez de
 *  mostrar "HTTP 403 FORBIDDEN" cru pro usuário. */
function isAuthorizationError(lastError: string | null | undefined): boolean {
  return Boolean(lastError && /VTEX_(INVALID_CREDENTIALS|PERMISSION_REQUIRED)/.test(lastError))
}

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Desconectado', pending: 'Pendente', connecting: 'Conectando', connected: 'Conectado',
  syncing: 'Sincronizando', requires_attention: 'Requer atenção', error: 'Erro', expired: 'Expirado', config_missing: 'Configuração pendente',
}

// Enquanto houver sync ativa, revalida o status a cada 4s — rápido o
// bastante pra parecer "ao vivo", devagar o bastante pra não martelar o
// backend. Para sozinho assim que activeSync deixa de existir (run chegou
// num estado terminal), nunca fica dando poll infinito.
const POLL_INTERVAL_MS = 4_000

export default function VtexConnectionCard() {
  const { vtex, loading, syncingVtex, connectErrorVtex, connectVtex, rotateVtexCredentials, disconnectVtex, syncVtex, refresh } = useConnections()
  const [dialog, setDialog] = useState<'connect' | 'rotate' | 'disconnect' | null>(null)
  const [form, setForm] = useState<VtexCredentialsInput>({ accountName: '', appKey: '', appToken: '' })
  const [historyMonths, setHistoryMonths] = useState<3 | 6>(3)
  const [showToken, setShowToken] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const connected = vtex?.status === 'connected' || vtex?.status === 'syncing' || vtex?.status === 'requires_attention'
  const wasSyncingRef = useRef(false)

  useEffect(() => {
    if (!dialog) return
    closeButtonRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setDialog(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog])

  useEffect(() => {
    if (!vtex?.activeSync) return
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [vtex?.activeSync, refresh])

  // Transição "Sincronizando" -> "Concluída": detecta o momento em que a
  // run ativa some sem erro (finalizou com sucesso) e mostra confirmação
  // curta antes de o card voltar ao estado compacto normal.
  useEffect(() => {
    const isSyncingNow = Boolean(vtex?.activeSync)
    if (wasSyncingRef.current && !isSyncingNow && !vtex?.lastError) {
      setJustCompleted(true)
      const timeout = setTimeout(() => setJustCompleted(false), 6_000)
      return () => clearTimeout(timeout)
    }
    wasSyncingRef.current = isSyncingNow
  }, [vtex?.activeSync, vtex?.lastError])

  async function submitCredentials() {
    setSubmitting(true)
    const ok = dialog === 'rotate' ? await rotateVtexCredentials(form) : await connectVtex({ ...form, historyMonths })
    setSubmitting(false)
    if (ok) { setDialog(null); setForm({ accountName: '', appKey: '', appToken: '' }) }
  }

  async function confirmDisconnect() {
    setSubmitting(true)
    const ok = await disconnectVtex()
    setSubmitting(false)
    if (ok) setDialog(null)
  }

  return (
    <>
      <div className="connection-card glass-panel glass-panel-hover motion-card-tight relative overflow-hidden rounded-md p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src={vtexLogo} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" />
            <div><h3 className="text-sm font-semibold text-text-primary">VTEX</h3><p className="text-[10.5px] text-text-muted">Integração nativa somente leitura</p></div>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${connected ? 'border-accent-emerald/30 bg-accent-emerald/15 text-accent-emerald' : vtex?.status === 'error' || vtex?.status === 'requires_attention' ? 'border-accent-rose/30 bg-accent-rose/15 text-accent-rose' : 'border-border-subtle bg-bg-card text-text-muted'}`}>{loading ? 'Carregando' : STATUS_LABEL[vtex?.status ?? 'disconnected']}</span>
        </div>

        {connected ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-text-muted">Conta VTEX</span><p className="truncate font-medium text-text-secondary">{vtex?.externalAccountId}</p></div>
              <div>
                <span className="text-text-muted">Último sucesso</span>
                <p className="font-medium text-text-secondary">
                  {vtex?.activeSync ? 'Sincronização em andamento' : vtex?.lastSuccessAt ? new Date(vtex.lastSuccessAt).toLocaleString('pt-BR') : 'Primeira sincronização pendente'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-[11px]"><Metric label="Produtos" value={vtex?.productsCount} /><Metric label="Estoque" value={vtex?.inventoryCount} /><Metric label="Pedidos" value={vtex?.ordersCount} /></div>

            {vtex?.activeSync && <VtexSyncProgressPanel activeSync={vtex.activeSync} onResume={() => syncVtex('incremental')} />}

            {justCompleted && !vtex?.activeSync && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-emerald/25 bg-accent-emerald/10 px-3 py-2.5 text-[11.5px] text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                <div>
                  <p className="font-medium text-text-primary">Sincronização concluída</p>
                  <p className="mt-0.5">{(vtex?.ordersCount ?? 0).toLocaleString('pt-BR')} pedidos · {(vtex?.productsCount ?? 0).toLocaleString('pt-BR')} produtos · {(vtex?.inventoryCount ?? 0).toLocaleString('pt-BR')} registros de estoque</p>
                </div>
              </div>
            )}

            {vtex?.lastError && !vtex?.activeSync && (
              <div className="mt-3 flex items-start gap-2 text-[11px] text-accent-rose">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {isAuthorizationError(vtex.lastError)
                  ? 'A conexão VTEX precisa de atenção — as permissões da chave de integração podem ter sido alteradas ou expirado.'
                  : 'Sincronização interrompida. Os dados anteriores foram preservados.'}
              </div>
            )}
            {connectErrorVtex && <div className="mt-3 flex items-start gap-2 text-[11px] text-accent-rose"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{connectErrorVtex}</div>}

            <div className="mt-4 flex flex-wrap gap-2">
              {vtex?.lastError && !vtex?.activeSync && isAuthorizationError(vtex.lastError) ? (
                <button type="button" onClick={() => { setForm((current) => ({ ...current, accountName: vtex?.externalAccountId ?? '' })); setDialog('rotate') }} className="control-active inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"><ShieldCheck className="h-3.5 w-3.5" />Revisar conexão</button>
              ) : (
                <button type="button" onClick={() => syncVtex('full')} disabled={syncingVtex || Boolean(vtex?.activeSync)} className="control-active inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50">{syncingVtex || vtex?.activeSync ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{vtex?.activeSync ? 'Sincronizando...' : 'Sincronizar agora'}</button>
              )}
              <button type="button" onClick={() => { setForm((current) => ({ ...current, accountName: vtex?.externalAccountId ?? '' })); setDialog('rotate') }} className="control-inactive inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"><Settings className="h-3.5 w-3.5" />Configurações</button>
            </div>
          </>
        ) : (
          <><p className="mt-3 text-[12px] leading-relaxed text-text-secondary">Sincronize catálogo, estoque e pedidos da sua operação VTEX sem compartilhar sua senha.</p><div className="mt-3 flex items-center gap-2 text-[10.5px] text-text-muted"><ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" />O MKTOnline nunca solicita sua senha da VTEX.</div><button type="button" onClick={() => setDialog('connect')} className="control-active mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold">Conectar VTEX</button></>
        )}
      </div>

      {dialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}><div role="dialog" aria-modal="true" aria-labelledby="vtex-dialog-title" className="overview-glass-elevated w-full max-w-lg rounded-2xl border border-border-default p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="vtex-dialog-title" className="text-base font-semibold text-text-primary">{dialog === 'connect' ? 'Conectar VTEX' : dialog === 'rotate' ? 'Atualizar credenciais' : 'Desconectar VTEX?'}</h2>{dialog !== 'disconnect' && <p className="mt-1 text-[11.5px] text-text-muted">Acesso de integração somente leitura. Nunca informe sua senha.</p>}</div><button ref={closeButtonRef} type="button" onClick={() => setDialog(null)} aria-label="Fechar" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-card hover:text-text-primary"><X className="h-4 w-4" /></button></div>
        {dialog === 'disconnect' ? <><p className="mt-5 text-sm text-text-secondary">Os dados já sincronizados serão preservados. Novas atualizações deixarão de ser recebidas.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="control-inactive rounded-lg px-4 py-2 text-xs font-semibold">Cancelar</button><button type="button" onClick={confirmDisconnect} disabled={submitting} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-rose px-4 py-2 text-xs font-semibold text-white"><Unplug className="h-3.5 w-3.5" />Desconectar</button></div></> : <><div className="mt-5 grid gap-3"><Field label="Nome da conta" value={form.accountName} onChange={(value) => setForm((current) => ({ ...current, accountName: value }))} placeholder="minhaloja" autoComplete="off" /><Field label="VTEX AppKey" value={form.appKey} onChange={(value) => setForm((current) => ({ ...current, appKey: value }))} placeholder="vtexappkey-..." autoComplete="off" /><label className="grid gap-1.5 text-[11px] font-medium text-text-secondary">VTEX AppToken<div className="flex rounded-lg border border-border-default bg-bg-primary focus-within:border-accent-blue"><input type={showToken ? 'text' : 'password'} value={form.appToken} onChange={(event) => setForm((current) => ({ ...current, appToken: event.target.value }))} autoComplete="new-password" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none" /><button type="button" onClick={() => setShowToken((value) => !value)} aria-label={showToken ? 'Ocultar token' : 'Mostrar token'} className="px-3 text-text-muted">{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>{dialog === 'connect' && (
          <div className="grid gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">Histórico da primeira sincronização</span>
            <div className="grid grid-cols-2 gap-2">
              {([3, 6] as const).map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setHistoryMonths(months)}
                  className={`rounded-lg border px-3 py-2 text-left text-[11.5px] transition-colors ${historyMonths === months ? 'border-accent-blue bg-accent-blue/10 text-text-primary' : 'border-border-default text-text-secondary hover:border-border-active'}`}
                >
                  <span className="block font-semibold">Últimos {months} meses{months === 3 && <span className="ml-1 rounded-full bg-accent-emerald/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent-emerald">Recomendado</span>}</span>
                  <span className="mt-0.5 block text-text-muted">{months === 3 ? 'Sincronização inicial mais rápida.' : 'Mais histórico, pode levar mais tempo.'}</span>
                </button>
              ))}
            </div>
          </div>
        )}</div>{connectErrorVtex && <p className="mt-3 flex items-start gap-2 text-[11px] text-accent-rose"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{connectErrorVtex}</p>}<div className="mt-5 flex items-center justify-between gap-3"><a href="https://developers.vtex.com/docs/guides/api-authentication-using-api-keys" target="_blank" rel="noreferrer" className="text-[10.5px] font-medium text-accent-blue hover:underline">Como gerar credenciais</a><button type="button" onClick={submitCredentials} disabled={submitting || !form.accountName || !form.appKey || !form.appToken} className="control-active inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50">{submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Validar e conectar</button></div>{dialog === 'rotate' && <button type="button" onClick={() => setDialog('disconnect')} className="mt-5 text-[10.5px] font-medium text-accent-rose hover:underline">Desconectar integração</button>}</>}
      </div></div>}
    </>
  )
}

function Metric({ label, value }: { label: string; value?: number }) { return <div><span className="text-text-muted">{label}</span><p className="text-sm font-semibold text-text-primary">{(value ?? 0).toLocaleString('pt-BR')}</p></div> }
function Field({ label, value, onChange, placeholder, autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string }) { return <label className="grid gap-1.5 text-[11px] font-medium text-text-secondary">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="rounded-lg border border-border-default bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-blue" /></label> }
