/**
 * Vintec Motion Card — faixa animada do topo do card de login.
 *
 * FASE 1 (atual): composição ESTÁTICA. A corrida (sprite) é a Fase 2, só depois
 * de a sprite profissional ser fornecida. Coordenadas em unidades do viewBox.
 */
export const BAND_VIEWBOX = { w: 600, h: 190 } as const

/**
 * Caminho da sprite sheet profissional do corredor (Fase 2). Ainda NÃO existe
 * no projeto — a Fase 1 apenas reserva o espaço exato e usa um marcador discreto.
 * Quando o asset for fornecido aqui, a animação usa background-position + steps().
 */
export const RUNNER_SPRITE_SRC = '/illustrations/vintec-runner-sprite.webp'

/** Slot reservado do personagem (área exata), em unidades do viewBox. */
export const RUNNER_SLOT = { x: 268, y: 50, w: 70, h: 104 } as const
