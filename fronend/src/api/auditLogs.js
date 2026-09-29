import client from './client'

export const listAuditLogs = (entityType, limit = 50) =>
  client.get('/audit-logs', { params: { ...(entityType ? { entity_type: entityType } : {}), limit } }).then((r) => r.data)
