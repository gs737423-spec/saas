import { maskCnpj, type CnpjInfo } from '@/lib/adminUi'

interface Props {
  name: string
  cnpj: string | null
  receitaData: CnpjInfo | null
  contactEmail?: string | null
  contactPhone?: string | null
  whatsapp?: string | null
}

function Field({ label, value, span }: { label: string; value: string | null; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2 sm:col-span-4' : ''}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-0.5 text-[13px] ${value ? 'text-text-primary' : 'italic text-text-muted/60'}`}>{value ?? '—'}</p>
    </div>
  )
}

/** Bloco único de dados cadastrais/fiscais + contato — grid limpo de
 *  label/valor, sem caixinha por campo, sem toggle "ver mais". Mesmo
 *  componente no header da página do cliente no admin (AdminCompany.tsx)
 *  e na aba "Minha Conta" do próprio cliente (Configuracoes.tsx). */
export default function CompanyRegistrationInfo({ name, cnpj, receitaData, contactEmail, contactPhone, whatsapp }: Props) {
  const r = receitaData
  const capitalSocial = typeof r?.capitalSocial === 'number'
    ? r.capitalSocial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : null
  const cnae = r?.cnaeCodigo ? `${r.cnaeCodigo}${r.atividadePrincipal ? ` — ${r.atividadePrincipal}` : ''}` : null
  const telefone = whatsapp ?? contactPhone ?? r?.telefone ?? null

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      <Field label="Razão Social" value={r?.razaoSocial ?? null} />
      <Field label="Nome Fantasia" value={r?.nomeFantasia ?? name} />
      <Field label="CNPJ" value={cnpj ? maskCnpj(cnpj) : null} />
      <Field label="Situação" value={r?.situacaoCadastral ?? null} />
      <Field label="Natureza Jurídica" value={r?.naturezaJuridica ?? null} />
      <Field label="Capital Social" value={capitalSocial} />
      <Field label="Abertura" value={r?.dataInicioAtividade ?? null} />
      <Field label="CNAE" value={cnae} />
      <Field label="E-mail de Contato" value={contactEmail ?? r?.email ?? null} />
      <Field label="Telefone / WhatsApp" value={telefone} />
      <Field label="Endereço" value={r?.endereco ?? null} span />
      <Field label="Sócios / Administradores" value={r?.socios && r.socios.length > 0 ? r.socios.join(', ') : null} span />
    </div>
  )
}
