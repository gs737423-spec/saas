import { useState } from 'react'
import { MapPin, Users, Tag, Copy, Check, MessageCircle } from 'lucide-react'
import { maskCnpj, type CnpjInfo } from '@/lib/adminUi'

interface Props {
  name: string
  cnpj: string | null
  receitaData: CnpjInfo | null
  contactEmail?: string | null
  contactPhone?: string | null
  whatsapp?: string | null
}

function Item({ label, value, span }: { label: string; value: string | null; span?: boolean }) {
  return (
    <p className={`truncate text-[13px] text-text-secondary ${span ? 'col-span-2' : ''}`}>
      <span className="text-text-muted">{label}: </span>
      <span className={value ? 'font-medium text-text-primary' : 'italic text-text-muted/60'}>{value ?? '—'}</span>
    </p>
  )
}

function CopyableText({ label, value, wrap }: { label: string; value: string | null; wrap?: boolean }) {
  const [copied, setCopied] = useState(false)

  if (!value) return <Item label={label} value={null} />

  async function handleCopy() {
    await navigator.clipboard.writeText(value!)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" onClick={handleCopy} title={`Copiar ${label.toLowerCase()}`} className={`group flex items-start gap-1 text-left text-[13px] text-text-secondary ${wrap ? '' : 'truncate'}`}>
      <span className="shrink-0 text-text-muted">{label}: </span>
      <span className={`font-medium text-text-primary ${wrap ? '' : 'truncate'}`}>{value}</span>
      {copied ? (
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-accent-emerald"><Check className="h-3 w-3" /> copiado</span>
      ) : (
        <Copy className="mt-0.5 h-3 w-3 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}

function ClickableTelefone({ telefone }: { telefone: string | null }) {
  if (!telefone) return <Item label="Telefone" value={null} />
  const digits = telefone.replace(/\D/g, '')
  return (
    <a
      href={`https://wa.me/55${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir no WhatsApp"
      className="group flex items-center gap-1 truncate text-[13px] text-text-secondary hover:text-accent-emerald"
    >
      <span className="text-text-muted group-hover:text-text-muted">Telefone: </span>
      <span className="truncate font-medium text-text-primary group-hover:text-accent-emerald">{telefone}</span>
      <MessageCircle className="h-3 w-3 shrink-0 text-accent-emerald opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  )
}

/** 3 cards por assunto (cadastral/fiscal, contato+endereço, sociedade) —
 *  nunca 1 chip por campo, nunca um card gigante só. Mesmo componente no
 *  header da página do cliente no admin (AdminCompany.tsx) e na aba
 *  "Minha Conta" do próprio cliente (Configuracoes.tsx). */
export default function CompanyRegistrationInfo({ name, cnpj, receitaData, contactEmail, contactPhone, whatsapp }: Props) {
  const r = receitaData
  const capitalSocial = typeof r?.capitalSocial === 'number'
    ? r.capitalSocial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : null
  const cnae = r?.cnaeCodigo ? `${r.cnaeCodigo}${r.atividadePrincipal ? ` — ${r.atividadePrincipal}` : ''}` : null
  const telefone = whatsapp ?? contactPhone ?? r?.telefone ?? null

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1.6fr_1fr]">
      <div className="glass-panel rounded-xl p-3">
        <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Dados Cadastrais e Fiscais</h3>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          <Item label="CNPJ" value={cnpj ? maskCnpj(cnpj) : null} />
          <Item label="Razão Social" value={r?.razaoSocial ?? name} />
          <Item label="Situação" value={r?.situacaoCadastral ?? null} />
          <Item label="Natureza Jurídica" value={r?.naturezaJuridica ?? null} />
          <Item label="Capital Social" value={capitalSocial} />
          <Item label="Abertura" value={r?.dataInicioAtividade ?? null} />
          <div className="col-span-2 mt-0.5 flex items-start gap-1.5 border-t border-border-subtle/60 pt-1.5">
            <Tag className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
            <Item label="CNAE" value={cnae} span />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="glass-panel rounded-xl p-3">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Contato &amp; Endereço</h3>
          <div className="flex flex-col gap-1.5">
            <CopyableText label="E-mail" value={contactEmail ?? r?.email ?? null} />
            <ClickableTelefone telefone={telefone} />
            {r?.endereco ? (
              <div className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                <CopyableText label="Endereço" value={r.endereco} wrap />
              </div>
            ) : (
              <div className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                <span className="text-[13px] italic text-text-muted/60">endereço não cadastrado</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-3">
          <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Estrutura Societária</h3>
          <div className="flex items-start gap-1.5">
            <Users className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
            <span className="text-[13px] text-text-secondary">
              {r?.socios && r.socios.length > 0 ? r.socios.join(', ') : <span className="italic text-text-muted/60">sócios não disponíveis</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
