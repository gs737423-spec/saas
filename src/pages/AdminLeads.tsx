import { useState } from 'react'
import { X, FileText, Phone, Calendar, ClipboardCheck, Inbox } from 'lucide-react'
import { MOCK_LEADS, type MockLead } from '@/lib/mockLeads'

// Solicitações que chegam pelo formulário do site — hoje só existem por
// e-mail (api/leads.ts). Esta tela é o desenho de UI do fluxo de triagem;
// os dados são mockados até existir uma tabela `leads` real no Supabase.
export default function AdminLeads() {
  const [analyzing, setAnalyzing] = useState<MockLead | null>(null)

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Solicitações</h1>
          <p className="mt-1 text-sm text-text-muted">Cadastros recebidos pelo formulário do site, aguardando triagem.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-semibold uppercase text-text-muted" title="Ainda não existe tabela de leads no Supabase — dados de exemplo">
          dados de exemplo
        </span>
      </div>

      {MOCK_LEADS.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle p-6 text-center">
          <Inbox className="h-6 w-6 text-text-muted" />
          <p className="text-sm text-text-muted">Nenhuma solicitação pendente.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-xl">
          <div className="hidden grid-cols-[2fr_1.4fr_1fr_1fr_auto] gap-3 border-b border-border-subtle px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted sm:grid">
            <span>Nome Fantasia</span>
            <span>CNPJ</span>
            <span>Solicitado em</span>
            <span>Status</span>
            <span />
          </div>
          <div className="flex flex-col divide-y divide-border-subtle">
            {MOCK_LEADS.map((lead) => (
              <div key={lead.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[2fr_1.4fr_1fr_1fr_auto] sm:items-center sm:gap-3">
                <span className="truncate text-sm font-medium text-text-primary">{lead.nomeFantasia}</span>
                <span className="truncate text-[13px] text-text-muted">{lead.cnpj}</span>
                <span className="text-[13px] text-text-muted">{lead.dataSolicitacao}</span>
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" /> Pendente
                </span>
                <button
                  type="button"
                  onClick={() => setAnalyzing(lead)}
                  className="flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-accent-cyan/25 bg-accent-cyan/10 px-3 py-1.5 text-[12px] font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/20"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" /> Analisar Cadastro
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {analyzing && <LeadModal lead={analyzing} onClose={() => setAnalyzing(null)} />}
    </div>
  )
}

function LeadModal({ lead, onClose }: { lead: MockLead; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="glass-panel w-full max-w-md rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text-primary">{lead.nomeFantasia}</h2>
            <p className="text-[12.5px] text-text-muted">{lead.razaoSocial}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-4">
          <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {lead.cnpj} · IE {lead.inscricaoEstadual}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {lead.cnae}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-text-muted" /> Aberta em {lead.dataAbertura}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {lead.whatsapp}
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-border-subtle bg-bg-primary/40 p-2.5 text-[11.5px] text-text-muted">
          Dados de exemplo. Próximo passo: persistir solicitações reais numa tabela `leads` e ligar "Criar Acesso" à criação de empresa em Clientes.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" disabled title="Depende da tabela `leads` real ainda não existir" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-cyan px-4 py-2.5 text-[13px] font-bold text-[#081423] opacity-60 disabled:cursor-not-allowed">
            Criar Acesso
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border-subtle px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white/5">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
