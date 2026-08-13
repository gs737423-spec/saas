export type DependencyCounts = Record<string, number>

export function companyDeletionDecision(counts: DependencyCounts): { allowed: true } | { allowed: false; dependencies: DependencyCounts } {
  const dependencies = Object.fromEntries(Object.entries(counts).filter(([, count]) => Number.isFinite(count) && count > 0))
  return Object.keys(dependencies).length === 0 ? { allowed: true } : { allowed: false, dependencies }
}
