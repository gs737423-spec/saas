// Métricas institucionais — NÃO VALIDADAS. Nenhum valor aqui é dado real
// confirmado pela Vintec. `verified:false` + `source:null` em cada item.
// `showInProduction:false` é o sinal de bloqueio: NÃO fazer deploy dessas
// métricas sem trocar para valores reais e `verified:true` com `source`.
export type SiteMetric = {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  label: string
  description?: string
  verified: boolean
  source: string | null
  showInProduction: boolean
}

export const siteMetrics: SiteMetric[] = [
  { value: 1037, prefix: '+', label: 'Clientes atendidos', verified: false, source: null, showInProduction: false },
  { value: 2.1, prefix: '+', suffix: ' BI', decimals: 1, label: 'em GMV acompanhado', verified: false, source: null, showInProduction: false },
  { value: 4.5, prefix: '+', suffix: ' MI', decimals: 1, label: 'de pedidos monitorados', verified: false, source: null, showInProduction: false },
  { value: 99.5, suffix: '%', decimals: 1, label: 'de disponibilidade da plataforma', verified: false, source: null, showInProduction: false },
  { value: 70, prefix: '+', label: 'especialistas e parceiros', verified: false, source: null, showInProduction: false },
  { value: 4, label: 'marketplaces integrados', verified: false, source: null, showInProduction: false },
]
