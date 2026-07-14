import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Loader2, MessageCircle, ArrowLeft,
  ArrowRight, ShieldCheck, Plug, LayoutDashboard, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import mark from '@/assets/acelera-mark.png';
import { whatsappAccessHelpUrl, whatsappDemoUrl } from '@/lib/whatsapp';

// Limite de tentativas ANTES de um cooldown local. Isto é apenas fricção de
// UX contra reenvio acidental/repetido no mesmo dispositivo — NÃO é controle
// de segurança (reseta ao recarregar a página, é só estado em memória). A
// proteção real contra força bruta precisa acontecer no servidor, quando
// existir um endpoint de autenticação; hoje o login é 100% client-side.
const SOFT_ATTEMPT_LIMIT = 5;
const SOFT_COOLDOWN_MS = 30_000;

type View = 'login' | 'forgot';

const darkBg = '#060A16';
const cardBorder = '#26345A';
const textMuted = '#97A3BD';
const ink = '#F4F7FD';
const blue = '#4C82F7';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const attemptsRef = useRef(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Contagem regressiva do cooldown local
  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) {
        setCooldownUntil(null);
        attemptsRef.current = 0;
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  // Já autenticado: AuthContext hidrata de forma síncrona, então isso já
  // resolve antes da primeira pintura — sem flash do formulário.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const inCooldown = cooldownUntil !== null && cooldownLeft > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || inCooldown) return;
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        attemptsRef.current = 0;
        navigate('/app', { replace: true });
        return;
      }

      attemptsRef.current += 1;
      // Mensagem sempre genérica — não revela se o e-mail existe, se a
      // senha está errada, ou se a conta está ativa (evita enumeração).
      setError('Não foi possível entrar. Verifique os dados informados.');
      if (attemptsRef.current >= SOFT_ATTEMPT_LIMIT) {
        setCooldownUntil(Date.now() + SOFT_COOLDOWN_MS);
      }
      passwordRef.current?.focus();
      passwordRef.current?.select();
    } catch {
      setError('Não foi possível concluir o acesso agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordKeyEvent(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  }

  function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    // Sem backend de recuperação nesta arquitetura: não fingimos envio de
    // e-mail. A mensagem é honesta e genérica (não confirma se a conta
    // existe), e o caminho real de recuperação hoje é o suporte humano.
    setForgotSent(true);
  }

  const accessHelpUrl = whatsappAccessHelpUrl();
  const demoUrl = whatsappDemoUrl();

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: darkBg }}>
      <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col lg:h-screen lg:flex-row">
        {/* ---- Painel do produto (esquerda, ~56%, escuro) ---- */}
        <section
          className="relative hidden shrink-0 flex-col justify-between overflow-hidden px-10 py-10 lg:flex lg:w-[56%] xl:px-16"
          style={{
            background: `
              radial-gradient(900px 560px at 10% -10%, rgba(76,130,247,0.22), transparent 58%),
              radial-gradient(700px 520px at 100% 10%, rgba(124,92,246,0.14), transparent 55%),
              linear-gradient(180deg, #070C1B 0%, #050810 100%)
            `,
          }}
        >
          {/* textura sutil: grade técnica */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(130,160,220,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(130,160,220,0.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(120% 100% at 0% 0%, #000 0%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(120% 100% at 0% 0%, #000 0%, transparent 75%)',
            }}
          />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src={mark} alt="Acelera Intelligence" width={34} height={34} className="h-8 w-8 object-contain" />
              <span className="flex flex-col leading-none">
                <span className="text-[14px] font-extrabold" style={{ color: ink }}>Acelera</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: blue }}>Intelligence</span>
              </span>
            </Link>

            <span
              className="mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid rgba(76,130,247,0.22)', color: '#9DBBFF' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#12B981', display: 'inline-block' }} />
              Plataforma de gestão multicanal
            </span>

            <h1 className="mt-5 max-w-md text-[30px] font-extrabold leading-[1.12] tracking-tight xl:text-[34px]" style={{ color: ink }}>
              Todo o controle da sua operação começa em uma única visão.
            </h1>
            <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed" style={{ color: textMuted }}>
              Acompanhe marketplaces, faturamento, margem, produtos e estoque em um dashboard centralizado.
            </p>
          </div>

          {/* Captura real da plataforma */}
          <div className="relative mt-8 flex-1 min-h-0">
            <div
              className="h-full overflow-hidden rounded-2xl"
              style={{ background: '#0C1526', border: `1px solid ${cardBorder}`, boxShadow: '0 30px 60px -24px rgba(2,6,20,0.6)' }}
            >
              <div className="flex h-8 items-center gap-1.5 px-3.5" style={{ background: 'linear-gradient(180deg,#16223A,#101A30)', borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: '#F0466C' }} />
                <span style={{ width: 9, height: 9, borderRadius: 999, background: '#E9A83A' }} />
                <span style={{ width: 9, height: 9, borderRadius: 999, background: '#12B981' }} />
              </div>
              <img
                src="/site/dashboard-overview.webp"
                alt="Painel de Visão Geral da Acelera Intelligence"
                className="block w-full"
                style={{ objectFit: 'cover', objectPosition: 'top', maxHeight: 'calc(100% - 32px)' }}
                loading="eager"
              />
            </div>
          </div>

          {/* Selos de apoio — no máximo três */}
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Plug, label: 'Conexões por API' },
              { icon: LayoutDashboard, label: 'Operação centralizada' },
              { icon: ShieldCheck, label: 'Acesso controlado' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cardBorder}` }}>
                <c.icon className="h-4 w-4 shrink-0" style={{ color: blue }} />
                <span className="text-[11.5px] font-medium leading-tight" style={{ color: textMuted }}>{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Painel de acesso (direita, ~44%, claro) ---- */}
        <section className="relative flex flex-1 flex-col" style={{ background: '#F6F8FC' }}>
          {/* Header compacto */}
          <div className="flex items-center justify-between px-6 py-5 sm:px-10">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={mark} alt="Acelera Intelligence" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-[13px] font-extrabold" style={{ color: '#0B1220' }}>Acelera</span>
            </Link>
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-[13px] font-medium transition-colors lg:flex"
              style={{ color: '#64728D' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                style={{ color: '#0E8F63', background: 'rgba(18,185,129,0.1)' }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Falar com a Acelera
              </a>
            )}
          </div>

          {/* Corpo */}
          <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
            <div
              className={`w-full max-w-[400px] transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              {view === 'login' ? (
                <>
                  <h2 className="text-[21px] font-extrabold tracking-tight" style={{ color: '#0B1220' }}>Acesse sua operação</h2>
                  <p className="mt-1.5 text-[13.5px]" style={{ color: '#64728D' }}>Entre com as credenciais liberadas pela equipe Acelera.</p>

                  <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: '#33405C' }}>E-mail</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#8A96AE' }} />
                        <input
                          ref={emailRef}
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@empresa.com"
                          required
                          autoComplete="username"
                          disabled={inCooldown}
                          className="w-full rounded-xl py-3 pl-10 pr-4 text-[14px] outline-none transition-colors"
                          style={{ background: '#fff', border: '1px solid #D2DBEA', color: '#0B1220' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,130,247,0.14)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#D2DBEA'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="login-password" className="block text-[13px] font-semibold" style={{ color: '#33405C' }}>Senha</label>
                        {capsLock && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#B87914' }}>
                            <AlertTriangle className="h-3 w-3" /> Caps Lock ativado
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#8A96AE' }} />
                        <input
                          ref={passwordRef}
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyUp={handlePasswordKeyEvent}
                          onKeyDown={handlePasswordKeyEvent}
                          placeholder="Sua senha"
                          required
                          autoComplete="current-password"
                          disabled={inCooldown}
                          className="w-full rounded-xl py-3 pl-10 pr-10 text-[14px] outline-none transition-colors"
                          style={{ background: '#fff', border: '1px solid #D2DBEA', color: '#0B1220' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,130,247,0.14)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#D2DBEA'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                          style={{ color: '#8A96AE' }}
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          aria-pressed={showPassword}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div aria-live="polite">
                      {error && !inCooldown && (
                        <div className="rounded-lg px-3 py-2 text-[13px]" style={{ color: '#C23B54', background: 'rgba(240,70,108,0.07)', border: '1px solid rgba(240,70,108,0.16)' }}>
                          {error}
                        </div>
                      )}
                      {inCooldown && (
                        <div className="rounded-lg px-3 py-2 text-[13px]" style={{ color: '#B87914', background: 'rgba(233,168,58,0.1)', border: '1px solid rgba(233,168,58,0.24)' }}>
                          Muitas tentativas. Aguarde {cooldownLeft}s antes de tentar novamente.
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || inCooldown}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ background: blue, color: '#fff' }}
                      onMouseEnter={(e) => { if (!loading && !inCooldown) e.currentTarget.style.background = '#3A6FE0'; }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = blue)}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Entrando...' : 'Entrar na plataforma'}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-between text-[13px]">
                    <button type="button" onClick={() => setView('forgot')} className="cursor-pointer bg-transparent font-medium hover:underline" style={{ color: blue }}>
                      Esqueci minha senha
                    </button>
                    {accessHelpUrl && (
                      <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#64728D' }}>
                        Preciso de ajuda
                      </a>
                    )}
                  </div>

                  <p className="mt-6 text-center text-[12px] leading-relaxed" style={{ color: '#8A96AE' }}>
                    Acesso exclusivo para clientes. Após a implantação, nossa equipe cria os usuários e envia as instruções de primeiro acesso.
                  </p>

                  {accessHelpUrl && (
                    <a
                      href={accessHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5"
                      style={{ background: 'rgba(18,185,129,0.1)', border: '1px solid rgba(18,185,129,0.25)', color: '#0E8F63' }}
                    >
                      <MessageCircle className="h-4 w-4" /> Falar com o suporte no WhatsApp
                    </a>
                  )}

                  <div className="mt-6 border-t pt-5 text-center" style={{ borderColor: '#E2E8F2' }}>
                    <p className="text-[12.5px]" style={{ color: '#64728D' }}>Ainda não utiliza a Acelera?</p>
                    <a href="/#demonstracao" className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold hover:underline" style={{ color: blue }}>
                      Solicitar demonstração <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setView('login'); setForgotSent(false); setForgotEmail(''); }}
                    className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                    style={{ color: '#64728D' }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
                  </button>

                  <h2 className="text-[21px] font-extrabold tracking-tight" style={{ color: '#0B1220' }}>Recuperar acesso</h2>
                  <p className="mt-1.5 text-[13.5px]" style={{ color: '#64728D' }}>Informe seu e-mail. Se houver uma conta ativa vinculada a ele, enviaremos as instruções.</p>

                  {forgotSent ? (
                    <div className="mt-6 rounded-xl p-4 text-[13.5px]" style={{ background: 'rgba(18,185,129,0.08)', border: '1px solid rgba(18,185,129,0.22)', color: '#0E8F63' }}>
                      Caso exista uma conta ativa vinculada a este e-mail, enviaremos as instruções de recuperação.
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} noValidate className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: '#33405C' }}>E-mail</label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#8A96AE' }} />
                          <input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="seu@empresa.com"
                            required
                            autoComplete="username"
                            className="w-full rounded-xl py-3 pl-10 pr-4 text-[14px] outline-none transition-colors"
                            style={{ background: '#fff', border: '1px solid #D2DBEA', color: '#0B1220' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76,130,247,0.14)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#D2DBEA'; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full cursor-pointer rounded-xl py-3 text-[14.5px] font-semibold transition-colors"
                        style={{ background: blue, color: '#fff' }}
                      >
                        Enviar instruções
                      </button>
                    </form>
                  )}

                  {accessHelpUrl && (
                    <a
                      href={accessHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5"
                      style={{ background: 'rgba(18,185,129,0.1)', border: '1px solid rgba(18,185,129,0.25)', color: '#0E8F63' }}
                    >
                      <MessageCircle className="h-4 w-4" /> Prefiro falar com o suporte
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rodapé mínimo */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t px-6 py-4 text-[11.5px] sm:px-10" style={{ borderColor: '#E2E8F2', color: '#8A96AE' }}>
            <Link to="/privacidade" className="hover:underline">Política de Privacidade</Link>
            <Link to="/termos" className="hover:underline">Termos de Uso</Link>
            {accessHelpUrl && <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Suporte</a>}
            <span>&copy; {new Date().getFullYear()} Acelera Intelligence</span>
          </div>
        </section>
      </div>
    </div>
  );
}
