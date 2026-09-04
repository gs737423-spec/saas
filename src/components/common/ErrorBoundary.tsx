import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Sem isto, qualquer erro de render (ex: página de detalhe com um id que
 *  não existe mais depois de voltar no histórico do navegador) derrubava a
 *  árvore React inteira — sobrava só o fundo escuro da página, sem nenhuma
 *  mensagem ("tela azul"). Reseta sozinho quando a rota muda (key na Routes
 *  em App.tsx já força remount), então só precisa oferecer uma saída manual
 *  enquanto isso não acontece. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-rose/10 text-accent-rose">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h2 className="text-base font-semibold text-text-primary">Algo deu errado nessa tela</h2>
          <p className="max-w-sm text-sm text-text-muted">
            Não conseguimos carregar essa página. Tente voltar para o início — se o problema continuar, entre em contato com o suporte.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              window.location.href = '/app'
            }}
            className="mt-1 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover"
          >
            Voltar para o início
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
