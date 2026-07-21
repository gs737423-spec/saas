// "Por que Vintec" — linhas editoriais numeradas, não pills. Conceitos
// técnicos (tenant/RLS/roles) traduzidos em benefício.
export interface DifferentialItem {
  n: string
  title: string
  text: string
}

export const differentialRows: DifferentialItem[] = [
  { n: '01', title: 'Menos trabalho manual', text: 'Reduza o tempo gasto reunindo informações de diferentes marketplaces.' },
  { n: '02', title: 'Cada empresa acessa apenas seus dados', text: 'As informações e permissões permanecem separadas entre as empresas atendidas.' },
  { n: '03', title: 'Apoio para começar', text: 'Sua equipe recebe orientação durante a configuração e a entrada na nova rotina.' },
  { n: '04', title: 'Visão por marketplace', text: 'Entenda o resultado de cada marketplace e onde existem pontos de atenção.' },
  { n: '05', title: 'Estrutura preparada para crescer', text: 'Novos marketplaces podem entrar na gestão sem exigir a reconstrução de todos os controles.' },
  { n: '06', title: 'Acessos organizados', text: 'Cada pessoa utiliza o nível de acesso adequado à sua responsabilidade.' },
]
