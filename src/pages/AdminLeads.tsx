import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Phone, Calendar, ClipboardCheck, Inbox, MessageCircle, Scale, Landmark, MapPin, Users, Tag, ThumbsDown, Loader2, CheckCircle2 } from 'lucide-react'
import { MOCK_LEADS, type MockLead } from '@/lib/mockLeads'
import { apiFetchJson } from '@/lib/apiFetch'
import type { CnpjInfo } from '@/lib/adminUi'
import MarketplaceRow from '@/components/admin/MarketplaceRow'
import EmptyState from '@/components/admin/EmptyState'

// Converte "R$ 50.000,00" -> 50000 (número puro, mesmo shape de
// CnpjInfo.capitalSocial). Só usado nesse mock — a Receita real já devolve
// número, ver api/cnpj-lookup.ts.
function parseCapitalSocial(raw: string): number | null {
  const n = Number(raw.replace(/[^\d,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function leadToReceitaData(lead: MockLead): CnpjInfo {
  return {
    razaoSocial: lead.razaoSocial,
    nomeFantasia: lead.nomeFantasia,
    situacaoCadastral: lead.statusReceita,
    dataSituacaoCadastral: null,
    dataInicioAtividade: lead.dataAbertura,
    atividadePrincipal: lead.cnaeDescricao,
    cnaeCodigo: lead.cnaeCodigo,
    cnaesSecundarios: [],
    naturezaJuridica: lead.naturezaJuridica,
    porte: null,
    capitalSocial: parseCapitalSocial(lead.capitalSocial),
    telefone: null,
    email: lead.email,
    endereco: lead.endereco,
    matrizFilial: null,
    simplesNacional: null,
    socios: lead.socios,
  }
}

// Solicitações que chegam pelo formulário do site — hoje só existem por
// e-mail (api/leads.ts). Esta tela é o desenho de UI do fluxo de triagem;
// os dados são mockados até existir uma tabela `leads` real no Supabase.
export default function AdminLeads() {
  const [leads, setLeads] = useState<MockLead[]>(MOCK_LEADS)
  const [analyzing, setAnalyzing] = useState<MockLead | null>(null)

  function handleResolved(leadId: string) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setAnalyzing(null)
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-semibold uppercase text-text-muted" title="Ainda não existe tabela de leads no Supabase — dados de exemplo">
          dados de exemplo
        </span>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Tudo limpo por aqui!"
          subtitle="Nenhuma nova solicitação de cadastro no momento."
        />
      ) : (
        // <table> nativa em vez de grid manual — colunas de cabeçalho e linha
        // alinham por construção, sem depender de fr/gap ficarem sincronizados
        // entre dois elementos separados (era a causa do desalinhamento).
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold">Nome Fantasia</th>
                <th className="px-4 py-3 font-semibold">CNPJ</th>
                <th className="px-4 py-3 font-semibold">Solicitado em</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{lead.nomeFantasia}</td>
                  <td className="px-4 py-3 text-[13px] text-text-muted">{lead.cnpj}</td>
                  <td className="px-4 py-3 text-[13px] text-text-muted">{lead.dataSolicitacao}</td>
                  <td className="px-4 py-3">
                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-amber">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" /> Pendente
                    </span>
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
      )}

      {analyzing && <LeadModal lead={analyzing} onClose={() => setAnalyzing(null)} onResolved={() => handleResolved(analyzing.id)} />}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-text-muted">{children}</h3>
}

function Field({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted">{label}</p>
        <p className="text-[14.5px] text-text-primary">{value}</p>
      </div>
    </div>
  )
}

function LeadModal({ lead, onClose, onResolved }: { lead: MockLead; onClose: () => void; onResolved: () => void }) {
  const navigate = useNavigate()
  const waHref = `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  // Cria a empresa de verdade (mesmo endpoint do cadastro manual), com o
  // snapshot completo da Receita anexado, e dispara o convite real por
  // e-mail — a lista de leads em si ainda é mock (sem tabela `leads`), mas o
  // resultado da aprovação (empresa + acesso) é real, não simulado.
  async function handleApprove() {
    setApproving(true)
    setApproveError(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; company?: { id: string } }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.nomeFantasia,
          cnpj: lead.cnpj,
          contactEmail: lead.email,
          whatsapp: lead.whatsapp,
          receitaData: leadToReceitaData(lead),
        }),
      })
      if (!res?.ok || !res.company) {
        setApproveError(res?.message ?? 'Erro ao criar empresa.')
        return
      }
      const inviteRes = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lead.email, companyId: res.company.id }),
      })
      if (!inviteRes?.ok) {
        setApproveError(`Empresa criada, mas o convite falhou: ${inviteRes?.message ?? 'erro desconhecido'}. Convide pela tela da empresa.`)
        return
      }
      onResolved()
      navigate(`/app/admin/empresa/${res.company.id}`)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="glass-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho fixo */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-lg font-bold text-text-primary">{lead.nomeFantasia}</h2>
              <span className="shrink-0 rounded-full bg-accent-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-emerald">{lead.statusReceita}</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-text-muted">{lead.razaoSocial} · {lead.cnpj}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo — 2 blocos */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          <div className="glass-panel rounded-xl p-5">
            <SectionTitle>Dados do Formulário</SectionTitle>
            <div className="flex flex-col gap-4">
              <Field icon={Users} label="Nome do contato" value={lead.nomeContato} />
              <Field icon={MessageCircle} label="E-mail" value={lead.email} />
              <Field
                icon={Phone}
                label="WhatsApp"
                value={
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent-emerald hover:underline">
                    <MessageCircle className="h-3.5 w-3.5" /> {lead.whatsapp}
                  </a>
                }
              />
              <Field icon={Tag} label="Assunto tratado no site" value={lead.assunto} />
              <div className="flex items-start gap-2.5">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                <div className="min-w-0">
                  <p className="text-[11px] text-text-muted">Integrações de interesse</p>
                  <div className="mt-1.5"><MarketplaceRow interest={lead.interesses} size="sm" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <SectionTitle>Varredura Receita Federal</SectionTitle>
            <div className="flex flex-col gap-4">
              <Field icon={Scale} label="Razão Social" value={lead.razaoSocial} />
              <Field icon={Calendar} label="Data de Abertura" value={lead.dataAbertura} />
              <Field icon={Landmark} label="Natureza Jurídica" value={lead.naturezaJuridica} />
              <Field icon={Landmark} label="Capital Social" value={lead.capitalSocial} />
              <Field icon={MapPin} label="Endereço Completo" value={lead.endereco} />
              <Field icon={Users} label="Sócios / Administradores" value={lead.socios.join(', ')} />
              <Field icon={Tag} label="CNAE Principal" value={`${lead.cnaeCodigo} — ${lead.cnaeDescricao}`} />
            </div>
          </div>
        </div>

        <p className="shrink-0 border-t border-border-subtle px-6 py-2.5 text-[11px] text-text-muted">
          Lista de solicitações é de exemplo (sem tabela `leads` real ainda) — mas "Aprovar" cria a empresa e envia o convite de verdade.
        </p>

        {approveError && (
          <p className="mx-6 mb-2 flex items-center gap-1.5 text-[12px] text-accent-rose">{approveError}</p>
        )}

        {/* Rodapé — CTAs */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border-subtle bg-bg-primary/30 p-4">
          <button type="button" onClick={onClose} disabled={approving} className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white/5 disabled:opacity-50">
            <ThumbsDown className="h-3.5 w-3.5" /> Recusar
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={approving}
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
