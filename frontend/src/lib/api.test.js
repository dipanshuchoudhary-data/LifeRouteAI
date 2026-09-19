import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./session', () => ({
  getSessionToken: () => 'demo-token',
  setSessionToken: vi.fn(),
}))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('triggerSos', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('sends one SOS request to the hospital pipeline', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        session_id: 'abc',
        dispatch: { ambulance_dispatched: false },
        sathiEmergency: { id: 'case-1', actions: { ambulance_dispatched: false } },
      }),
    })
    const { triggerSos } = await import('./api')
    const payload = await triggerSos({ input: 'I need help', location: { lat: 28.6, lng: 77.2 } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v2/emergency/sos')
    expect(payload.sathiEmergency.id).toBe('case-1')
    expect(payload.dispatch.ambulance_dispatched).toBe(false)
  })
})

describe('sathiChat', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('does not call v1 when v2 returns a client error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Please say something first.' }),
    })
    const { sathiChat } = await import('./api')
    await expect(sathiChat({ message: 'hi' })).rejects.toThrow(/say something|busy/i)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v2/sathi/chat')
  })
})
