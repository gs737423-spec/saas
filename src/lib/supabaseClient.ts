import { createClient } from '@supabase/supabase-js'

// Cliente Supabase do NAVEGADOR — usa somente a URL pública do projeto e a
// chave publicável (publishable/anon), protegida por RLS no servidor. NUNCA
// importar aqui a service_role (essa fica só em src/server/integrations/
// supabaseAdmin.ts, usada exclusivamente por api/** — ver comentário lá).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (.env.local em dev, variáveis de ambiente na Vercel em produção).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // sessionStorage em vez do localStorage padrão: a sessão sobrevive a
    // navegação/refresh dentro da mesma aba, mas fechar a aba/navegador e
    // voltar depois exige login de novo (pedido explícito do usuário).
    storage: window.sessionStorage,
  },
})
