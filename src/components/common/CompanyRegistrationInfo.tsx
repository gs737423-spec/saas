import { useState } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { maskCnpj, type CnpjInfo } from '@/lib/adminUi'

interface Props {
  name: string
  cnpj: string | null
  receitaData: CnpjInfo | null
}

function Chip({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5 text-[11.5px]">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </span>
  )
}

/** Bloco compacto de dados cadastrais/fiscais — CNPJ, Nome Fantasia,
 *  Situação, Natureza Jurídica, Capital Social, CNAE em chips de uma
 *  linha; Endereço/Sócios (mais longos) atrás de "ver mais". Mesmo
 *  componente usado no header da página do cliente no admin
 *  (AdminCompany.tsx) e na aba "Minha Conta" do próprio cliente
 *  (Configuracoes.tsx) — nunca espalhado em card gigante. */
export default function CompanyRegistrationInfo({ name, cnpj, receitaData }: Props) {
  const [expanded, setExpanded] = useState(false)
  const r = receitaData

  const capitalSocial = typeof r?.capitalSocial === 'number'
    ? r.capitalSocial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : null
  const cnae = r?.cnaeCodigo ? `${r.cnaeCodigo}${r.atividadePrincipal ? ` — ${r.atividadePrincipal}` : ''}` : null
  const hasExtra = Boolean(r?.endereco || r?.socios?.length)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip label="CNPJ" value={cnpj ? maskCnpj(cnpj) : null} />
        <Chip label="Nome Fantasia" value={r?.nomeFantasia ?? (cnpj ? null : name)} />
        <Chip label="Razão Social" value={r?.razaoSocial ?? null} />
        <Chip label="Situação" value={r?.situacaoCadastral ?? null} />
        <Chip label="Natureza Jurídica" value={r?.naturezaJuridica ?? null} />
        <Chip label="Capital Social" value={capitalSocial} />
        <Chip label="Abertura" value={r?.dataInicioAtividade ?? null} />
        <Chip label="CNAE" value={cnae} />
        {hasExtra && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-accent-cyan hover:underline"
          >
            {expanded ? 'ver menos' : 'ver mais'}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        {!cnpj && !r && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5 text-[11.5px] italic text-text-muted/70">
            <Building2 className="h-3 w-3" /> sem dado cadastral ainda
          </span>
        )}
      </div>
      {expanded && (
        <div className="flex flex-col gap-1 border-t border-border-subtle/60 pt-2 text-[11.5px] text-text-secondary">
          {r?.endereco && <p><span className="text-text-muted">Endereço: </span>{r.endereco}</p>}
          {r?.socios && r.socios.length > 0 && <p><span className="text-text-muted">Sócios: </span>{r.socios.join(', ')}</p>}
        </div>
      )}
    </div>
  )
}
