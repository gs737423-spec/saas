import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface StoredSession extends User {
  /** epoch ms — sessão expira mesmo sem fechar a aba (defesa extra) */
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'acelera_auth';
// Validade absoluta da sessão — mesmo sem fechar a aba, expira depois disso.
// Fechar a aba/navegador já derruba a sessão antes (sessionStorage, não
// localStorage: não sobrevive ao fechamento, diferente de antes).
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

const USERS: Record<string, { hash: string; name: string }> = {
  'rogger.salazar@climario.com.br': {
    hash: '0447f69377d581d341919f31c041985547f3a5a6e7216d3c010162062853c728',
    name: 'Rogger Salazar',
  },
  'g.souza.woork@gmail.com': {
    hash: '97624060b50cc4e421a8f4b6ae079676bbf9f973018423de1f2098d1ebe21bb3',
    name: 'G. Souza',
  },
};

// Optional demo/QA login, off by default. Only active when BOTH env vars are set —
// intended for local dev / Vercel Preview only. Never set VITE_DEMO_EMAIL or
// VITE_DEMO_PASSWORD_HASH in the Production environment target: like the rest of
// this login system, the check runs client-side, so whatever is set here ends up
// readable in the shipped JS bundle exactly like the two accounts above already are.
// See .env.example for how to generate the hash.
const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const demoPasswordHash = import.meta.env.VITE_DEMO_PASSWORD_HASH as string | undefined;
if (demoEmail && demoPasswordHash) {
  USERS[demoEmail.toLowerCase().trim()] = { hash: demoPasswordHash, name: 'Demo' };
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  return local
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readStoredUser(): User | null {
  try {
    // sessionStorage: some navegador limpa ao fechar a aba/janela — era o
    // bug reportado ("quase não pede senha mais"). localStorage sobrevive
    // indefinidamente entre sessões; sessionStorage não.
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredSession;
    if (!parsed.email) return null;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { email: parsed.email, name: parsed.name };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lido de forma síncrona no initializer (não em useEffect): se a leitura
  // acontecesse após o primeiro render, /login desenharia o formulário por
  // um instante mesmo para quem já está autenticado, antes do redirect —
  // um flash perceptível. Assim, isAuthenticated já vem correto na primeira
  // pintura da tela.
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    const knownUser = USERS[normalizedEmail];
    if (!knownUser) return false;

    const passwordHash = await sha256(password);
    if (passwordHash !== knownUser.hash) return false;

    const loggedInUser: User = {
      email: normalizedEmail,
      name: knownUser.name || deriveNameFromEmail(normalizedEmail),
    };

    setUser(loggedInUser);
    const session: StoredSession = { ...loggedInUser, expiresAt: Date.now() + SESSION_TTL_MS };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
