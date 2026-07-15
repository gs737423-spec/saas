import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Loader2, MessageCircle, ArrowLeft,
  ArrowRight, ShieldCheck, Plug, LayoutDashboard, AlertTriangle, Building2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import mark from '@/assets/acelera-mark.png';
import { whatsappAccessHelpUrl, whatsappDemoUrl } from '@/lib/whatsapp';
import '@/site/site.css';

// Limite de tentativas ANTES de um cooldown local. Isto é apenas fricção de
// UX contra reenvio acidental/repetido no mesmo dispositivo — NÃO é controle
// de segurança (reseta ao recarregar a página, é só estado em memória). A
// proteção real contra força bruta precisa acontecer no servidor, quando
// existir um endpoint de autenticação; hoje o login é 100% client-side.
const SOFT_ATTEMPT_LIMIT = 5;
const SOFT_COOLDOWN_MS = 30_000;

type View = 'login' | 'forgot';

const ink = '#F4F7FD';
const muted = '#93A0BC';
const blue = '#4C82F7';
const cardBorder = 'rgba(76,130,247,0.16)';

const benefits = [
  { icon: Plug, label: 'Integrações por API' },
  { icon: Building2, label: 'Dados isolados por empresa' },
  { icon: LayoutDashboard, label: 'Visão centralizada' },
];

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

  const inputCls = 'w-full rounded-xl py-3 pl-10 pr-4 text-[14px] outline-none transition-all';
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: ink };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = blue;
    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(76,130,247,0.18), 0 0 24px -8px rgba(76,130,247,0.5)';
    e.currentTarget.style.background = 'rgba(76,130,247,0.06)';
  };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
  };

  return (
    <div className="site-root fixed inset-0 overflow-y-auto site-dark" style={{ minHeight: '100vh' }}>
      {/* Halos de profundidade — respiram devagar, CSS puro */}
      <span aria-hidden="true" className="ambient-halo" style={{ width: 480, height: 480, top: '-12%', left: '-8%', background: 'radial-gradient(circle, rgba(76,130,247,0.22), transparent 70%)' }} />
      <span aria-hidden="true" className="ambient-halo" style={{ width: 420, height: 420, bottom: '-14%', right: '-6%', background: 'radial-gradient(circle, rgba(124,92,246,0.18), transparent 70%)', animationDelay: '3s' }} />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(130,160,220,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(130,160,220,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(90% 70% at 50% 30%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(90% 70% at 50% 30%, #000 0%, transparent 75%)',
        }}
      />

      <div className="relative flex min-h-full flex-col">
        {/* Header compacto */}
        <header className="flex items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={mark} alt="Marketplace" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-[14px] font-extrabold" style={{ color: ink }}>Marketplace</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:flex" style={{ color: muted }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ color: '#3DD68C', background: 'rgba(18,185,129,0.12)', border: '1px solid rgba(18,185,129,0.28)' }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        </header>

        {/* Corpo — card único centralizado, sem precisar rolar em telas comuns */}
        <div className="flex flex-1 items-center justify-center px-5 py-3 sm:px-8">
          <div
            className="relative w-full max-w-[440px] transition-all duration-700 ease-out"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)' }}
          >
            <div
              className="glow-on-hover relative overflow-hidden rounded-[28px] p-6 sm:p-7"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 40%, transparent 70%), linear-gradient(180deg, #101A31 0%, #0A1122 100%)',
                border: `1px solid ${cardBorder}`,
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 40px 80px -32px rgba(2,6,20,0.85)',
              }}
            >
              {view === 'login' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(18,185,129,0.1)', color: '#3DD68C' }}>
                    <ShieldCheck className="h-3 w-3" /> Acesso seguro à sua operação
                  </span>
                  <h2 className="mt-3 text-[24px] font-extrabold tracking-tight" style={{ color: ink }}>Acesse sua operação</h2>
                  <p className="mt-1.5 text-[13.5px]" style={{ color: muted }}>Entre com as credenciais liberadas pela equipe Marketplace.</p>

                  {/* Benefícios — chips compactos, não um painel separado */}
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {benefits.map((b) => (
                      <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: muted }}>
                        <b.icon className="h-3 w-3" style={{ color: blue }} /> {b.label}
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3.5">
                    <div>
                      <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: muted }}>E-mail</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#5A6A8F' }} />
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
                          className={inputCls}
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="login-password" className="block text-[13px] font-semibold" style={{ color: muted }}>Senha</label>
                        {capsLock && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#E9A83A' }}>
                            <AlertTriangle className="h-3 w-3" /> Caps Lock ativado
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#5A6A8F' }} />
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
                          className="w-full rounded-xl py-3 pl-10 pr-10 text-[14px] outline-none transition-all"
                          style={inputStyle}
                          onFocus={focusIn}
                          onBlur={focusOut}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                          style={{ color: '#5A6A8F' }}
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
                        <div className="rounded-lg px-3 py-2 text-[13px]" style={{ color: '#FF8FA3', background: 'rgba(240,70,108,0.1)', border: '1px solid rgba(240,70,108,0.22)' }}>
                          {error}
                        </div>
                      )}
                      {inCooldown && (
                        <div className="rounded-lg px-3 py-2 text-[13px]" style={{ color: '#F0C674', background: 'rgba(233,168,58,0.12)', border: '1px solid rgba(233,168,58,0.3)' }}>
                          Muitas tentativas. Aguarde {cooldownLeft}s antes de tentar novamente.
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || inCooldown}
                      className="btn btn-primary w-full"
                      style={{ opacity: loading || inCooldown ? 0.65 : 1 }}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Entrando...' : 'Entrar na plataforma'}
                    </button>
                  </form>

                  <div className="mt-3.5 flex items-center justify-between text-[13px]">
                    <button type="button" onClick={() => setView('forgot')} className="cursor-pointer bg-transparent font-medium hover:underline" style={{ color: '#7FA6FF' }}>
                      Esqueci minha senha
                    </button>
                    {accessHelpUrl && (
                      <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: muted }}>
                        Preciso de ajuda
                      </a>
                    )}
                  </div>

                  {accessHelpUrl && (
                    <a
                      href={accessHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-[14.5px] font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(180deg, rgba(18,185,129,0.22), rgba(18,185,129,0.14))', border: '1px solid rgba(18,185,129,0.4)', color: '#3DD68C', boxShadow: '0 10px 24px -12px rgba(18,185,129,0.5)' }}
                    >
                      <MessageCircle className="h-5 w-5" /> Falar com o suporte no WhatsApp
                    </a>
                  )}

                  <p className="mt-4 text-center text-[11.5px] leading-relaxed" style={{ color: '#5A6A8F' }}>
                    Acesso exclusivo para clientes. Após a implantação, nossa equipe cria os usuários e envia as instruções de primeiro acesso.
                  </p>

                  <div className="mt-4 border-t pt-3.5 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-[12.5px]" style={{ color: muted }}>Ainda não utiliza a Marketplace?</p>
                    <a href="/#demonstracao" className="mt-1.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold hover:underline" style={{ color: '#7FA6FF' }}>
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
                    style={{ color: muted }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
                  </button>

                  <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: ink }}>Recuperar acesso</h2>
                  <p className="mt-1.5 text-[13.5px]" style={{ color: muted }}>Informe seu e-mail. Se houver uma conta ativa vinculada a ele, enviaremos as instruções.</p>

                  {forgotSent ? (
                    <div className="mt-6 rounded-xl p-4 text-[13.5px]" style={{ background: 'rgba(18,185,129,0.1)', border: '1px solid rgba(18,185,129,0.28)', color: '#3DD68C' }}>
                      Caso exista uma conta ativa vinculada a este e-mail, enviaremos as instruções de recuperação.
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} noValidate className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className="mb-1.5 block text-[13px] font-semibold" style={{ color: muted }}>E-mail</label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#5A6A8F' }} />
                          <input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="seu@empresa.com"
                            required
                            autoComplete="username"
                            className={inputCls}
                            style={inputStyle}
                            onFocus={focusIn}
                            onBlur={focusOut}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary w-full">
                        Enviar instruções
                      </button>
                    </form>
                  )}

                  {accessHelpUrl && (
                    <a
                      href={accessHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14.5px] font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(180deg, rgba(18,185,129,0.22), rgba(18,185,129,0.14))', border: '1px solid rgba(18,185,129,0.4)', color: '#3DD68C' }}
                    >
                      <MessageCircle className="h-5 w-5" /> Prefiro falar com o suporte
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé mínimo */}
        <div className="relative flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-6 py-3 text-[11.5px]" style={{ color: '#5A6A8F' }}>
          <Link to="/privacidade" className="hover:underline">Política de Privacidade</Link>
          <Link to="/termos" className="hover:underline">Termos de Uso</Link>
          {accessHelpUrl && <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Suporte</a>}
          <span>&copy; {new Date().getFullYear()} Marketplace</span>
        </div>
      </div>
    </div>
  );
}
