import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  totalRows: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function PaginationBar({ page, totalPages, totalRows, pageSize, onPageChange }: Props) {
  if (totalRows === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalRows)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-4 py-3 text-[11px] text-text-muted">
      <span>{start}–{end} de {totalRows}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-1.5 font-medium text-text-secondary">{page} / {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
