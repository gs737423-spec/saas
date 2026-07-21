// Jornada do cliente ("Como começamos") — cada etapa mostra o que a Vintec
// faz e o resultado concreto que o cliente recebe.
export interface ProcessStepItem {
  n: string
  title: string
  text: string
  result: string
}

export const processSteps: ProcessStepItem[] = [
  { n: '01', title: 'Entendemos sua rotina', text: 'Mapeamos os marketplaces utilizados, os controles atuais e os pontos que mais consomem tempo.', result: 'Diagnóstico inicial' },
  { n: '02', title: 'Conectamos os marketplaces', text: 'Realizamos as conexões disponíveis com Mercado Livre, Amazon, Shopee e Leroy Merlin.', result: 'Marketplaces conectados' },
  { n: '03', title: 'Organizamos o acompanhamento', text: 'Pedidos, estoque, vendas e resultados passam a seguir uma estrutura mais fácil de consultar.', result: 'Rotina organizada' },
  { n: '04', title: 'Sua equipe identifica prioridades', text: 'Gestores e equipes passam a enxergar o que precisa de atenção sem reunir informações manualmente.', result: 'Próximos passos mais claros' },
]
