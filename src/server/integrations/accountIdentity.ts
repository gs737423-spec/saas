export function isExternalAccountSwitch(
  currentExternalAccountId: string | null | undefined,
  requestedExternalAccountId: string | null | undefined,
): boolean {
  if (!currentExternalAccountId || !requestedExternalAccountId) return false
  return currentExternalAccountId.trim().toLowerCase() !== requestedExternalAccountId.trim().toLowerCase()
}
