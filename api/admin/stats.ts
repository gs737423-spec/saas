import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'

// Totais reais somados de TODOS os clientes (nunca por período — é o
// acumulado desde sempre) pro dashboard estratégico do admin. Nunca
// fabricado: pedido pago de verdade, de qualquer empresa conectada.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const supabase = await getSupabaseAdmin()
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
    if (ordersError) throw new Error(ordersError.message)

    const { data: revenueRows, error: revenueError } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'paid')
        .range(from, to)
    )
    if (revenueError) throw new Error(revenueError.message)

    const totalGmv = (revenueRows ?? []).reduce((s, o) => s + Number(o.total_amount ?? 0), 0)

    res.status(200).json({ ok: true, ordersCount: ordersCount ?? 0, totalGmv })
  } catch (err) {
    console.error('[api/admin/stats]', err)
    res.status(500).json({ ok: false, message: 'Erro ao calcular totais.' })
  }
}
