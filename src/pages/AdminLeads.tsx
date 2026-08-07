import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Phone, Calendar, ClipboardCheck, Inbox, MessageCircle, Scale, Landmark, MapPin, Users, Tag, ThumbsDown, Loader2, CheckCircle2 } from 'lucide-react'
import { apiFetchJson } from '@/lib/apiFetch'
import { useToast } from '@/contexts/ToastContext'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/common/StatusBadge'
import SortableHeader from '@/components/common/SortableHeader'
import PaginationBar from '@/components/common/PaginationBar'
import { useSortedPaginatedRows } from '@/lib/useSortedPaginatedRows'

interface ReceitaData {
  razaoSocial?: string | null
  nomeFantasia?: string | null
  situacaoCadastral?: string | null
  dataInicioAtividade?: string | null
  atividadePrincipal?: string | null
  cnaeCodigo?: string | null
  naturezaJuridica?: string | null
  capitalSocial?: number | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  socios?: string[]
}

interface Lead {
  id: string
  name: string
  whatsapp: string
  company: string
  cnpj: string
  marketplaces: string | null
  message: string
  receitaData: ReceitaData | null
  status: 'pendente' | 'aprovado' | 'recusado'
  createdAt: string
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// Solicitações que chegam pelo formulário do site (api/leads.ts grava em
// `leads`, ver migration 013) — lista real, não mais dado de exemplo.
export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<Lead | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<{ ok: boolean; leads: Lead[] }>('/api/admin/leads').then((res) => {
      if (!cancelled) {
        setLeads(res?.leads ?? [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  function handleResolved(leadId: string) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setAnalyzing(null)
  }

  const { sortKey, sortDir, handleSort, page, setPage, totalPages, pageRows, totalRows } = useSortedPaginatedRows<Lead, 'company' | 'createdAt'>(
    leads,
    {
      company: (a, b) => (a.receitaData?.nomeFantasia ?? a.company).localeCompare(b.receitaData?.nomeFantasia ?? b.company),
      createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    'createdAt'
  )

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Tudo limpo por aqui!"
          subtitle="Nenhuma nova solicitação de cadastro no momento."
        />
      ) : (
        // <table> nativa em vez de grid manual — colunas de cabeçalho e linha
        // alinham por construção, sem depender de fr/gap ficarem sincronizados
        // entre dois elementos separados (era a causa do desalinhamento).
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  <SortableHeader label="Empresa" sortKeyValue="company" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 font-semibold">CNPJ</th>
                  <SortableHeader label="Solicitado em" sortKeyValue="createdAt" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pageRows.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-text-primary" title={lead.receitaData?.nomeFantasia ?? lead.company}>{lead.receitaData?.nomeFantasia ?? lead.company}</td>
                    <td className="px-4 py-3 text-[13px] text-text-muted">{lead.cnpj}</td>
                    <td className="px-4 py-3 text-[13px] text-text-muted">{fmtDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant="warning" label="Pendente" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setAnalyzing(lead)}
                        className="ml-auto flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-accent-cyan/25 bg-accent-cyan/10 px-3 py-1.5 text-[12px] font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/20"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" /> Analisar Cadastro
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} totalRows={totalRows} pageSize={10} onPageChange={setPage} />
        </div>
      )}

      {analyzing && <LeadModal lead={analyzing} onClose={() => setAnalyzing(null)} onResolved={() => handleResolved(analyzing.id)} />}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{children}</h3>
}

function Field({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-1.5 border-b border-border-subtle/40 py-1 text-[13px] last:border-0">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
      <span className="shrink-0 text-text-muted">{label}:</span>
      <span className="min-w-0 text-text-primary">{value}</span>
    </div>
  )
}

function LeadModal({ lead, onClose, onResolved }: { lead: Lead; onClose: () => void; onResolved: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const waHref = `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const r = lead.receitaData

  async function updateStatus(status: 'aprovado' | 'recusado') {
    await apiFetchJson('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status }),
    })
  }

  async function handleReject() {
    setRejecting(true)
    try {
      await updateStatus('recusado')
      toast.success('Solicitação recusada.')
      onResolved()
    } finally {
      setRejecting(false)
    }
  }

  // Cria a empresa de verdade (mesmo endpoint do cadastro manual), com o
  // snapshot completo da Receita anexado, e dispara o convite real por
  // e-mail. Precisa de e-mail vindo da Receita Federal (o formulário do
  // site não pede e-mail direto) — sem isso não dá pra convidar.
  async function handleApprove() {
    if (!r?.email) {
      const msg = 'Esse lead não tem e-mail (a Receita Federal não devolveu um pra esse CNPJ). Cadastre a empresa manualmente em Clientes e informe o e-mail de contato lá.'
      setApproveError(msg)
      toast.error(msg)
      return
    }
    setApproving(true)
    setApproveError(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; company?: { id: string } }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: r.nomeFantasia ?? lead.company,
          cnpj: lead.cnpj,
          contactEmail: r.email,
          whatsapp: lead.whatsapp,
          receitaData: r,
        }),
      })
      if (!res?.ok || !res.company) {
        const msg = res?.message ?? 'Erro ao criar empresa.'
        setApproveError(msg)
        toast.error(msg)
        return
      }
      const inviteRes = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: r.email, companyId: res.company.id }),
      })
      if (!inviteRes?.ok) {
        const msg = `Empresa criada, mas o convite falhou: ${inviteRes?.message ?? 'erro desconhecido'}. Convide pela tela da empresa.`
        setApproveError(msg)
        toast.error(msg)
        return
      }
      await updateStatus('aprovado')
      toast.success('Cadastro aprovado e perfil criado com sucesso!')
      onResolved()
      navigate(`/app/admin/empresa/${res.company.id}`)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 py-8" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="glass-panel mx-auto flex w-full max-w-4xl flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-lg font-bold text-text-primary">{r?.nomeFantasia ?? lead.company}</h2>
              {r?.situacaoCadastral && (
                <span className="shrink-0 rounded-full bg-accent-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-emerald">{r.situacaoCadastral}</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[13px] text-text-muted">{r?.razaoSocial ?? lead.company} · {lead.cnpj}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo — 2 blocos, sem rolagem interna: página única, tudo visível */}
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <div className="glass-panel rounded-xl p-3">
            <SectionTitle>Dados do Formulário</SectionTitle>
            <div className="flex flex-col">
              <Field icon={Users} label="Nome do contato" value={lead.name} />
              <Field
                icon={Phone}
                label="WhatsApp"
                value={
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-emerald hover:underline">
                    <MessageCircle className="h-3 w-3" /> {lead.whatsapp}
                  </a>
                }
              />
              <Field icon={Tag} label="Marketplaces de interesse" value={lead.marketplaces} />
              <Field icon={MessageCircle} label="Mensagem" value={lead.message} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3">
            <SectionTitle>Varredura Receita Federal</SectionTitle>
            {r ? (
              <div className="flex flex-col">
                <Field icon={Scale} label="Razão Social" value={r.razaoSocial} />
                <Field icon={MessageCircle} label="E-mail (Receita)" value={r.email} />
                <Field icon={Calendar} label="Abertura" value={r.dataInicioAtividade} />
                <Field icon={Landmark} label="Natureza Jurídica" value={r.naturezaJuridica} />
                <Field icon={Landmark} label="Capital Social" value={r.capitalSocial != null ? `R$ ${r.capitalSocial.toLocaleString('pt-BR')}` : null} />
                <Field icon={MapPin} label="Endereço" value={r.endereco} />
                <Field icon={Users} label="Sócios" value={r.socios?.join(', ')} />
                <Field icon={Tag} label="CNAE" value={r.atividadePrincipal ? `${r.cnaeCodigo ?? ''} — ${r.atividadePrincipal}` : null} />
              </div>
            ) : (
              <p className="text-[13px] text-text-muted">Sem dado da Receita Federal pra esse CNPJ.</p>
            )}
          </div>
        </div>

        {approveError && (
          <p className="mx-4 mb-2 flex items-center gap-1.5 text-[12px] text-accent-rose">{approveError}</p>
        )}

        {/* Rodapé — CTAs */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border-subtle bg-bg-primary/30 p-3">
          <button type="button" onClick={handleReject} disabled={approving || rejecting} className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white/5 disabled:opacity-50">
            {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />} Recusar
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="flex items-center gap-1.5 rounded-lg bg-accent-cyan px-5 py-2.5 text-[13.5px] font-bold text-[#081423] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Aprovar e Criar Login
          </button>
        </div>
      </div>
    </div>
  )
}
