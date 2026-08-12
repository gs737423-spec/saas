import { Link } from 'react-router-dom'
import { Link2, type LucideIcon } from 'lucide-react'

// Estado vazio real pra quando a empresa nunca conectou nenhum marketplace
// (ou conectou mas ainda não sincronizou nada). Substitui o dashboard cheio
// de número ilustrativo — vendedor real logando pela primeira vez não pode
// ver R$ 93.167 de faturamento fake com só um banner de aviso em cima,
// parece dado real. Sem número nenhum aqui, só o caminho pra conectar.
export default function ConnectMarketplacePrompt({
  icon: Icon = Link2,
  title = 'Conecte um marketplace pra começar',
  description = 'Assim que você conectar e sincronizar o Mercado Livre, esses números viram reais.',
}: {
  icon?: LucideIcon
  title?: string
  description?: string
}) {
  return (
    <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-text-muted">{description}</p>
      </div>
      <Link
        to="/app/importacoes"
        className="mt-1 flex items-center gap-1.5 rounded-lg bg-accent-blue/15 px-4 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25"
      >
        <Link2 className="h-3.5 w-3.5" />
        Ir para Conexões
      </Link>
    </div>
  )
}
