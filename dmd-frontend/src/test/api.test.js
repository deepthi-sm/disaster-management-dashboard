import { describe, it, expect, vi, afterEach } from 'vitest'
import { getIncidents, patchIncident } from '../api'

afterEach(() => vi.restoreAllMocks())

describe('api', () => {
  it('getIncidents drops _design / _ docs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ _id: 'DR-001' }, { _id: '_design/incidents' }, { _id: '_x' }],
    })
    const res = await getIncidents()
    expect(res).toEqual([{ _id: 'DR-001' }])
  })

  it('getIncidents builds a query string from filters (skips empties)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    global.fetch = fetchMock
    await getIncidents({ status: 'active', severity: '' })
    expect(fetchMock).toHaveBeenCalledWith('/api/incidents?status=active')
  })

  it('patchIncident sends a PATCH with the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    global.fetch = fetchMock
    await patchIncident('DR-001', { status: 'resolved', casualties: 5 })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/incidents/DR-001/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved', casualties: 5 }),
      })
    )
  })

  it('throws on a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(getIncidents()).rejects.toThrow()
  })
})
