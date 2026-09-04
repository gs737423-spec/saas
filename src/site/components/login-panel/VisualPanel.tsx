// Painel institucional — apresenta a promessa da plataforma sem competir
// com o formulário. Nenhum print, ícone de marketplace, pessoa ou gráfico:
// só profundidade de luz e três faixas abstratas atrás da mensagem.
export default function VisualPanel() {
  return (
    <div className="login-visual-panel">
      {/* três faixas translúcidas — quebram o fundo chapado sem competir
          com o texto (opacidade 0.05–0.10, deslocamento máximo de 4px) */}
      <svg className="login-visual-panel__detail" viewBox="0 0 380 540" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-40 396 C 74 342, 150 300, 268 232 C 340 190, 382 158, 430 128" />
        <path d="M-40 452 C 86 396, 168 352, 288 282 C 356 242, 396 210, 442 180" />
        <path d="M-40 508 C 98 450, 186 404, 308 332 C 372 294, 410 262, 454 232" />
      </svg>

      <div className="login-visual-panel__brand">
        <span className="login-visual-panel__brand-mark" aria-hidden="true" />
        <span>MKTOnline</span>
      </div>

      <div className="login-visual-panel__message">
        <span className="login-visual-panel__eyebrow">GESTÃO PARA MARKETPLACES</span>
        <h2>Seus números já estão organizados.</h2>
        <p>Agora, você decide o próximo passo.</p>
      </div>
    </div>
  )
}
