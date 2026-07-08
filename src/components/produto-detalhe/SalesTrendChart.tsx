import { getSalesTrend } from '@/data/mockData'

export default function SalesTrendChart({ sku }: { sku: string }) {
  const data = getSalesTrend(sku)
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Tendência de Vendas</h3>
        <p className="mt-0.5 text-xs text-text-muted">Unidades vendidas · últimas 8 semanas</p>
      </div>
      <div className="flex h-40 items-stretch gap-2 sm:h-48">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${(d.value / max) * 100}%`,
                  background: 'linear-gradient(180deg, #4C82F7, #4C82F755)',
                  boxShadow: '0 0 14px -4px #4C82F799',
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
