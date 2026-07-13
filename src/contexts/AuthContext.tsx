import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'acelera_auth';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
