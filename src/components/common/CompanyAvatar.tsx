import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { apiFetchJson } from '@/lib/apiFetch'
import { hueFor, initialsFor } from '@/lib/adminUi'

const TARGET_SIZE = 320

/** Lê o arquivo, recorta pro quadrado central e redimensiona pra
 *  TARGET_SIZExTARGET_SIZE via canvas — qualquer imagem que o usuário
 *  mandar (retrato, paisagem, gigante, minúscula) sai do mesmo tamanho, sem
 *  depender de processamento no servidor. */
function fileToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => { img.src = reader.result as string }
    reader.onerror = reject
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      const canvas = document.createElement('canvas')
      canvas.width = TARGET_SIZE
      canvas.height = TARGET_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas indisponível')); return }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  companyId: string
  companyName: string
  logoUrl: string | null
  size?: 'md' | 'lg'
  editable?: boolean
  onUploaded?: (url: string) => void
}

/** Avatar da empresa — logo real se tiver, iniciais coloridas como fallback
 *  (mesmo padrão hueFor/initialsFor já usado em todo o admin). Editável em
 *  qualquer tela que passar `editable` — upload atualiza `companies.logo_url`
 *  no banco, então admin e cliente sempre veem a mesma logo (é o mesmo
 *  registro, nunca uma cópia separada por lado). */
export default function CompanyAvatar({ companyId, companyName, logoUrl, size = 'lg', editable = false, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const dims = size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-sm'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      const dataUrl = await fileToSquareDataUrl(file)
      setPreview(dataUrl)
      setUploading(true)
      const res = await apiFetchJson<{ ok: boolean; logoUrl?: string; message?: string }>(`/api/company-logo?company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (res?.ok && res.logoUrl) {
        onUploaded?.(res.logoUrl)
      } else {
        setError(res?.message ?? 'Erro ao salvar a logo.')
        setPreview(null)
      }
    } catch {
      setError('Não foi possível processar essa imagem.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const shown = preview ?? logoUrl

  return (
    <div className="group relative shrink-0">
      <span className={`flex ${dims} shrink-0 items-center justify-center overflow-hidden rounded-full font-bold`} style={!shown ? { background: hueFor(companyId), color: '#081423' } : undefined}>
        {shown ? <img src={shown} alt={companyName} className="h-full w-full object-cover" /> : initialsFor(companyName)}
      </span>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Trocar logo da empresa"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/50 group-hover:opacity-100 disabled:opacity-100"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
        </>
      )}
      {error && <p className="absolute top-full mt-1 w-max max-w-[160px] text-[10px] text-accent-rose">{error}</p>}
    </div>
  )
}
