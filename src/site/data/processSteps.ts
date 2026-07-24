// Implantação — 3 etapas editoriais dentro de uma única superfície escura.
export interface ProcessStepItem {
  n: string
  title: string
  text: string
  result: string
}

export const processSteps: ProcessStepItem[] = [
  { n: '01', title: 'Entendemos sua rotina atual', text: 'Mapeamos onde sua empresa vende, quais controles são utilizados e quais tarefas consomem mais tempo da equipe.', result: 'Diagnóstico e plano inicial.' },
  { n: '02', title: 'Conectamos e organizamos', text: 'Configuramos os marketplaces disponíveis e reunimos pedidos, estoque, vendas e acessos em uma rotina de acompanhamento.', result: 'Informações reunidas em um único fluxo.' },
  { n: '03', title: 'Acompanhamos sua equipe', text: 'Validamos as informações, orientamos os responsáveis e esclarecemos dúvidas durante os primeiros dias de utilização.', result: 'Equipe preparada para começar.' },
]
