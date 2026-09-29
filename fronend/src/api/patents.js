import client from './client'

export const listPatents = (status) =>
  client.get('/patents', { params: status ? { status } : {} }).then((r) => r.data)

export const createPatent = (payload) =>
  client.post('/patents', payload).then((r) => r.data)

export const getPatent = (id) =>
  client.get(`/patents/${id}`).then((r) => r.data)

export const updatePatent = (id, payload) =>
  client.put(`/patents/${id}`, payload).then((r) => r.data)

export const updatePatentStatus = (id, status) =>
  client.patch(`/patents/${id}/status`, { status }).then((r) => r.data)

export const getPatentTimeline = (patentId) =>
  client.get(`/patents/${patentId}/timeline`).then((r) => r.data)

export const addPatentTimelineEvent = (patentId, payload) =>
  client.post(`/patents/${patentId}/timeline`, payload).then((r) => r.data)

