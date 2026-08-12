import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, ShieldPlus, Loader2, AlertTriangle, Settings, Trash2, KeyRound } from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import { supabase } from '@/lib/supabaseClient'

interface TotpFactor {
  id: string
  friendly_name: string | null
  status: string
  created_at: string
}

// Ativação de MFA (TOTP) pra contas platform_admins — totalmente client-side
// via Supabase Auth (supabase.auth.mfa.*), não precisa de endpoint próprio em
// api/**: o fator fica atrelado ao usuário logado, o mesmo isolamento que já
// protege qualquer outra chamada autenticada. Opcional — a conta continua
// funcionando sem 2FA, mas quem ativa aqui passa a precisar do código do app
// autenticador em login futuro (ver Login.tsx, fluxo `view === 'mfa'`).
export default function AdminSecurity() {
  const [checking, setChecking] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [factorsLoading, setFactorsLoading] = useState(true)
  const [factorsError, setFactorsError] = useState(false)

  const [enrolling, setEnrolling] = useState(false)
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [enrollError, setEnrollError] = useState('')

  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [removingId, setRemovingId] = useState<string | null>(null)

  // Mesmo padrão de gate de Admin.tsx: 403 = "não é admin" de verdade, erro
  // de rede não pode virar essa mensagem (1 retry absorve cold start).
  const checkAdmin = useCallback(async (isRetry = false) => {
    try {
      const res = await apiFetch('/api/admin/companies')
      if (res.status === 403) {
        setUnauthorized(true)
        setChecking(false)
        return
      }
      if (res.ok) {
        setUnauthorized(false)
        setChecking(false)
        return
      }
      throw new Error('unexpected_status')
    } catch {
      if (!isRetry) {
        await new Promise((r) => setTimeout(r, 800))
        return checkAdmin(true)
      }
      setLoadError(true)
      setChecking(false)
    }
  }, [])

  const loadFactors = useCallback(async () => {
    setFactorsLoading(true)
    setFactorsError(false)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setFactorsError(true)
      setFactorsLoading(false)
      return
    }
    setFactors((data?.totp ?? []).filter((f) => f.status === 'verified') as TotpFactor[])
    setFactorsLoading(false)
  }, [])

  useEffect(() => { checkAdmin() }, [checkAdmin])
  useEffect(() => { if (!checking && !unauthorized) loadFactors() }, [checking, unauthorized, loadFactors])

  async function startEnroll() {
    setEnrollError('')
    setEnrolling(true)
    setVerifyCode('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Autenticador ${new Date().toLocaleDateString('pt-BR')}` })
    if (error || !data) {
      setEnrollError('Não foi possível iniciar a ativação. Tente novamente.')
      setEnrolling(false)
      return
    }
    setEnrollFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
  }

  function cancelEnroll() {
    // unenroll do fator "unverified" que ficou pra trás — se o usuário
    // desistir no meio, não deixa fator órfão acumulando em listFactors().
    if (enrollFactorId) supabase.auth.mfa.unenroll({ factorId: enrollFactorId })
    setEnrolling(false)
    setEnrollFactorId(null)
    setQrCode(null)
    setSecret(null)
    setVerifyCode('')
    setEnrollError('')
  }

  async function confirmEnroll() {
    if (!enrollFactorId || verifyCode.trim().length < 6) return
    setVerifyLoading(true)
    setEnrollError('')
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollFactorId, code: verifyCode.trim() })
      if (error) {
        setEnrollError('Código inválido ou expirado. Confira o app autenticador e tente de novo.')
        return
      }
      setEnrolling(false)
      setEnrollFactorId(null)
      setQrCode(null)
      setSecret(null)
      setVerifyCode('')
      await loadFactors()
    } finally {
      setVerifyLoading(false)
    }
  }

  async function removeFactor(id: string) {
    setRemovingId(id)
    try {
      await supabase.auth.mfa.unenroll({ factorId: id })
      await loadFactors()
    } finally {
      setRemovingId(null)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Não foi possível carregar</h2>
        <p className="mt-1.5 text-sm text-text-muted">Falha de conexão ao verificar seu acesso. Tente novamente.</p>
        <button
          type="button"
          onClick={() => { setChecking(true); setLoadError(false); checkAdmin() }}
          className="mt-3 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-6 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <Settings className="h-5 w-5 text-accent-cyan" /> Segurança da conta
        </h1>
        <p className="mt-1 text-sm text-text-muted">Verificação em duas etapas (TOTP) pra contas da equipe interna. Opcional, mas recomendado.</p>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Autenticação em duas etapas</h3>
        </div>

        {factorsLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : factorsError ? (
          <p className="py-4 text-sm text-accent-rose">Não foi possível carregar seus fatores de verificação.</p>
        ) : (
          <>
            {factors.length > 0 && (
              <ul className="mb-4 flex flex-col divide-y divide-border-subtle">
                {factors.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/15"><KeyRound className="h-3.5 w-3.5 text-accent-emerald" /></span>
                      {f.friendly_name || 'Autenticador'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFactor(f.id)}
                      disabled={removingId === f.id}
                      className="flex items-center gap-1 text-[11px] font-medium text-accent-rose hover:underline disabled:opacity-50"
                    >
                      {removingId === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!enrolling && (
              <button
                type="button"
                onClick={startEnroll}
                className="flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-[#081423] transition-transform hover:scale-[1.02]"
              >
                <ShieldPlus className="h-4 w-4" /> {factors.length > 0 ? 'Adicionar outro autenticador' : 'Ativar verificação em duas etapas'}
              </button>
            )}

            {enrolling && (
              <div className="rounded-lg border border-border-subtle bg-bg-primary/30 p-4">
                <p className="mb-3 text-[13px] text-text-secondary">
                  Escaneie o QR code com um app autenticador (Google Authenticator, Authy, 1Password) e digite o código gerado.
                </p>
                {qrCode && (
                  <img
                    src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
                    alt="QR code de ativação do autenticador"
                    className="mx-auto mb-3 h-40 w-40 rounded-lg bg-white p-2"
                  />
                )}
                {secret && (
                  <p className="mb-3 break-all rounded-md bg-black/20 px-2 py-1.5 text-center text-[11px] text-text-muted">
                    Ou digite manualmente: <span className="font-mono text-text-secondary">{secret}</span>
                  </p>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="mb-2 w-full rounded-lg border border-border-subtle bg-bg-primary/50 px-3 py-2 text-center text-lg tracking-[0.3em] text-text-primary outline-none focus:border-accent-cyan"
                />

                {enrollError && <p className="mb-2 text-[12px] text-accent-rose">{enrollError}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmEnroll}
                    disabled={verifyLoading || verifyCode.length < 6}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-[#081423] disabled:opacity-50"
                  >
                    {verifyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={cancelEnroll}
                    disabled={verifyLoading}
                    className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-muted hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
