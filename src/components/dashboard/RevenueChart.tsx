import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { revenueData } from '@/data/mockData'

const formatCurrency = (v: number) =>
  `R$ ${(v / 1000).toFixed(0)}k`

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4 shadow-2xl">
      <p className="mb-2 text-sm font-semibold text-text-primary">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name}</span>
          </div>
          <span className="font-mono font-medium text-text-primary">
            R$ {p.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function RevenueChart() {
  return (
    <div className="glass-panel rounded-3xl p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Receita por Marketplace</h3>
          <p className="text-sm text-text-muted">Evolução mensal — 2024</p>
        </div>
        <div className="flex gap-2">
          {['12M', '6M', '3M', '1M'].map((period, i) => (
            <button
              key={period}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                i === 0
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gML" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE600" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FFE600" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gShopee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EE4D2D" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EE4D2D" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAmazon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9900" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FF9900" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gLoja" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={0}
            wrapperStyle={{ display: 'none' }}
          />
          <Area type="monotone" dataKey="mercadoLivre" name="Mercado Livre" stroke="#FFE600" fill="url(#gML)" strokeWidth={2} />
          <Area type="monotone" dataKey="shopee" name="Shopee" stroke="#EE4D2D" fill="url(#gShopee)" strokeWidth={2} />
          <Area type="monotone" dataKey="amazon" name="Amazon" stroke="#FF9900" fill="url(#gAmazon)" strokeWidth={2} />
          <Area type="monotone" dataKey="lojaPropria" name="Loja Própria" stroke="#3B82F6" fill="url(#gLoja)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6">
        {[
          { name: 'Mercado Livre', color: '#FFE600' },
          { name: 'Shopee', color: '#EE4D2D' },
          { name: 'Amazon', color: '#FF9900' },
          { name: 'Loja Própria', color: '#3B82F6' },
        ].map((mp) => (
          <div key={mp.name} className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: mp.color }} />
            {mp.name}
          </div>
        ))}
      </div>
    </div>
  )
}
