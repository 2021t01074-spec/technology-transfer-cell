import client from './client'

export const listDisclosures = (status, department) =>
  client.get('/disclosures', { params: { ...(status ? { status } : {}), ...(department ? { department } : {}) } }).then((r) => r.data)

export const createDisclosure = (payload) =>
  client.post('/disclosures', payload).then((r) => r.data)

export const getDisclosure = (id) =>
  client.get(`/disclosures/${id}`).then((r) => r.data)

export const updateDisclosure = (id, payload) =>
  client.put(`/disclosures/${id}`, payload).then((r) => r.data)

export const updateDisclosureStatus = (id, status, evaluationNotes) =>
  client.patch(`/disclosures/${id}/status`, { status, evaluation_notes: evaluationNotes }).then((r) => r.data)

export const evaluateDisclosure = (id, payload) =>
  client.patch(`/disclosures/${id}/evaluate`, payload).then((r) => r.data)
