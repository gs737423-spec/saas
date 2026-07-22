// Benefícios — três linhas editoriais (sem comparação, sem cards).
export interface OutcomeItem {
  n: string
  title: string
  text: string
  result: string
}

export const outcomes: OutcomeItem[] = [
  { n: '01', title: 'Menos conferência manual', text: 'As informações dos marketplaces chegam à mesma rotina de acompanhamento, reduzindo atualizações repetidas em planilhas e relatórios.', result: 'Menos trabalho repetitivo para a equipe.' },
  { n: '02', title: 'Prioridades mais claras', text: 'Diferenças de resultado, atrasos, problemas de estoque e movimentos importantes ficam mais fáceis de perceber.', result: 'Sua equipe entende onde agir primeiro.' },
  { n: '03', title: 'Todos trabalhando com a mesma informação', text: 'Gestores e colaboradores deixam de depender de arquivos diferentes ou de uma única pessoa para localizar os números.', result: 'Mais continuidade e menos desencontro na gestão.' },
]
