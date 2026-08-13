type LogLevel = 'info' | 'warn' | 'error'

export interface SecurityLogEvent {
  requestId: string
  route?: string
  userId?: string
  companyId?: string
  actorRole?: string
  status?: string
  reason?: string
}

export function securityLog(level: LogLevel, event: string, fields: SecurityLogEvent): void {
  const entry = { timestamp: new Date().toISOString(), level, event, ...fields }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.info(output)
}
