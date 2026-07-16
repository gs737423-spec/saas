// Foto humanizada no tamanho/proporção final da seção. Sem `src`, mostra um
// placeholder — o label "foto pendente" aparece SÓ em desenvolvimento
// (import.meta.env.DEV), nunca no site publicado. Com `src`, renderiza a
// imagem real (fundo já removido/otimizada — ver public/site/people/).
export default function PersonPhotoSlot({
  id, src, alt = '', ratio = '4 / 5', className = '', rounded = 24, objectPosition = 'center',
}: {
  id: string
  src?: string
  alt?: string
  ratio?: string
  className?: string
  rounded?: number
  objectPosition?: string
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        aspectRatio: ratio,
        borderRadius: rounded,
        background: src ? 'transparent' : 'linear-gradient(160deg, rgba(15,107,99,0.16), rgba(11,46,60,0.28))',
        border: src ? 'none' : '1px solid var(--s-line)',
      }}
      data-photo-slot={id}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
          style={{ objectPosition }}
          loading="lazy"
          draggable={false}
        />
      ) : (
        import.meta.env.DEV && (
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}
          >
            foto pendente: {id}
          </span>
        )
      )}
    </div>
  )
}
