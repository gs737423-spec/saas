import { useState } from 'react'

interface Props {
  src: string
  alt: string
  /** Rótulo mostrado no fallback enquanto a captura real não existe */
  caption?: string
  priority?: boolean
  className?: string
}

// Moldura de navegador minimalista para as capturas reais da plataforma.
// Se a imagem ainda não foi capturada (arquivo ausente), mostra um fallback
// sóbrio com o contexto da tela — o site nunca aparece quebrado.
export default function BrowserFrame({ src, alt, caption, priority = false, className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  return (
    <figure className={`browser-frame ${className}`}>
      <div className="browser-frame__bar" aria-hidden="true">
        <span className="browser-frame__dot" style={{ background: '#F0466C' }} />
        <span className="browser-frame__dot" style={{ background: '#E9A83A' }} />
        <span className="browser-frame__dot" style={{ background: '#12B981' }} />
        <span
          style={{
            marginLeft: 12,
            height: 18,
            flex: 1,
            maxWidth: 320,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
      </div>

      {failed ? (
        <div
          style={{
            aspectRatio: '16 / 10',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 24,
            textAlign: 'center',
            background:
              'radial-gradient(600px 300px at 50% 0%, rgba(76,130,247,0.16), transparent 60%), linear-gradient(180deg,#0E1830,#0A1122)',
            color: 'var(--s-dark-muted)',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--s-blue-bright)',
            }}
          >
            Marketplace
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--s-dark-ink)', maxWidth: 360 }}>
            {caption ?? alt}
          </span>
        </div>
      ) : (
        <img
          className="browser-frame__img"
          src={src}
          alt={alt}
          width={2880}
          height={1800}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  )
}
