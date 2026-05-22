import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import IncidentControls from '../components/IncidentControls'
import { patchIncident } from '../api'

vi.mock('../api', () => ({ patchIncident: vi.fn() }))

const incident = {
  _id: 'DR-001', severity: 'critical', disaster_type: 'flood', description: 'Severe flooding',
  status: 'active', casualties_total: 10, casualties_rescued: 2, assigned_teams: [],
  location: { address: 'Anna Nagar' }, reported_by: 'HQ',
}
const teams = [{ _id: 'TEAM-04', name: 'Delta', status: 'available' }]

describe('IncidentControls', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits the chosen status via patchIncident', async () => {
    patchIncident.mockResolvedValue({ success: true })
    const onApplied = vi.fn()
    render(<IncidentControls incident={incident} teams={teams} onApplied={onApplied} />)

    fireEvent.click(screen.getByText('resolved')) // makes the form dirty
    fireEvent.click(screen.getByText('Apply update'))

    await waitFor(() =>
      expect(patchIncident).toHaveBeenCalledWith('DR-001', expect.objectContaining({ status: 'resolved' }))
    )
    await waitFor(() => expect(onApplied).toHaveBeenCalled())
  })

  it('surfaces an error when the update fails', async () => {
    patchIncident.mockRejectedValue(new Error('boom'))
    render(<IncidentControls incident={incident} teams={teams} />)

    fireEvent.click(screen.getByText('resolved'))
    fireEvent.click(screen.getByText('Apply update'))

    expect(await screen.findByText('boom')).toBeInTheDocument()
  })

  it('disables apply until something changes', () => {
    render(<IncidentControls incident={incident} teams={teams} />)
    expect(screen.getByText('Apply update')).toBeDisabled()
  })
})
