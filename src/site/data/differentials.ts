// Faixa final compacta (ex "Por que Vintec", incorporada ao fim de "Como
// funciona" — não é mais seção independente).
export interface ClosingPointItem {
  title: string
  text: string
}

export const closingPoints: ClosingPointItem[] = [
  { title: 'Acompanhamento desde o início', text: 'Nossa equipe apoia a configuração e os primeiros passos.' },
  { title: 'Informações e acessos separados', text: 'Cada empresa e usuário acessa somente o que corresponde à sua responsabilidade.' },
  { title: 'Estrutura pronta para novos marketplaces', text: 'A gestão pode crescer sem reconstruir todos os controles.' },
]
