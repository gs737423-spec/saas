import PeriodDropdown from '@/components/common/PeriodDropdown'
import type { PeriodOption } from '@/lib/periods'

interface Props {
  options: PeriodOption[]
  selectedKey: string
  onChange: (key: string) => void
}

// Compact meta strip: period selector. Single row.
export default function ExecutiveHeader({ options, selectedKey, onChange }: Props) {
  return (
    <div className="overview-glass flex items-center justify-end rounded-xl px-3.5 py-2.5">
      <PeriodDropdown options={options} selectedKey={selectedKey} onChange={onChange} />
    </div>
  )
}
