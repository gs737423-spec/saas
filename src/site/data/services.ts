// Benefícios/soluções — composição assimétrica (ServicesSection, seção
// escura). Bloco principal (o que muda) + três complementares.
export interface ServiceItem {
  id: string
  title: string
  description: string
  benefits: string[]
  featured: boolean
}

export const mainService: ServiceItem = {
  id: 'tudo-reunido',
  title: 'Tudo reunido para acompanhar',
  description: 'As informações dos marketplaces deixam de ficar espalhadas entre várias telas e passam a seguir uma mesma rotina de acompanhamento.',
  benefits: [
    'Veja o que aconteceu em cada marketplace',
    'Acompanhe pedidos e estoque com menos buscas',
    'Compare resultados sem montar relatórios separados',
  ],
  featured: true,
}

export const complementaryServices: ServiceItem[] = [
  {
    id: 'menos-atualizacao-manual',
    title: 'Menos atualização manual',
    description: 'As informações chegam pela conexão disponível com os marketplaces, reduzindo a dependência de planilhas e conferências repetidas.',
    benefits: [],
    featured: false,
  },
  {
    id: 'saiba-onde-agir',
    title: 'Saiba onde agir primeiro',
    description: 'Identifique diferenças, atrasos e pontos de atenção com mais rapidez.',
    benefits: [],
    featured: false,
  },
  {
    id: 'comece-acompanhado',
    title: 'Comece com acompanhamento',
    description: 'A equipe da Vintec apoia a configuração, a conexão dos marketplaces e a adaptação da rotina.',
    benefits: [],
    featured: false,
  },
]
