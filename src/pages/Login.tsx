import { useState, useEffect, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import aceleraLogo from '@/assets/acelera-logo.png';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Já autenticado: não faz sentido ver o login — vai direto para a plataforma.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/app', { replace: true });
      } else {
        setError('Email ou senha incorretos.');
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 64, 135, 0.25) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(20, 80, 140, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 20% 80%, rgba(15, 60, 120, 0.1) 0%, transparent 50%),
          #060A16
        `,
      }}
    >
      <div
        className={`w-full max-w-[420px] rounded-2xl p-8 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0) 52%),
            linear-gradient(180deg, #15223C 0%, #0C1424 100%)
          `,
          border: '1px solid #2C3E66',
        }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden mb-4 flex items-center justify-center"
            style={{ background: 'rgba(76, 130, 247, 0.1)', border: '1px solid #26345A' }}
          >
            <img src={aceleraLogo} alt="Acelera Intelligence" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: '#F4F7FD' }}>
            Acelera Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: '#97A3BD' }}>
            Faca login para acessar o painel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#97A3BD' }}>
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: '#59688A' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:ring-1"
                style={{
                  background: '#0C1324',
                  border: '1px solid #1A2542',
                  color: '#F4F7FD',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4C82F7';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(76,130,247,0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#1A2542';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#97A3BD' }}>
              Senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: '#59688A' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: '#0C1324',
                  border: '1px solid #1A2542',
                  color: '#F4F7FD',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4C82F7';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(76,130,247,0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#1A2542';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: '#59688A' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: '#F87171',
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.15)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: '#4C82F7',
              color: '#F4F7FD',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#3A6FE0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4C82F7';
            }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Forgot password */}
        <div className="text-center mt-4">
          <button
            type="button"
            className="text-sm transition-colors hover:underline cursor-pointer bg-transparent"
            style={{ color: '#4C82F7' }}
          >
            Esqueceu a senha?
          </button>
        </div>

        {/* Voltar ao site institucional */}
        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-xs transition-colors hover:underline"
            style={{ color: '#59688A' }}
          >
            &larr; Voltar ao site
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#59688A' }}>
          &copy; 2026 Acelera Intelligence &middot; Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
