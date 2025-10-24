import type { Trip } from '@/types/itinerary'

const API_BASE = '/api/trips'

export const tripsApi = {
  // Fetch all trips for the current user
  async getAll(): Promise<Trip[]> {
    const response = await fetch(API_BASE)
    if (!response.ok) {
      throw new Error('Failed to fetch trips')
    }
    const data = await response.json()
    return data.trips
  },

  // Fetch a single trip by ID
  async getById(id: string): Promise<Trip> {
    const response = await fetch(`${API_BASE}/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch trip')
    }
    const data = await response.json()
    return data.trip
  },

  // Create a new trip
  async create(trip: Trip): Promise<Trip> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trip),
    })
    if (!response.ok) {
      throw new Error('Failed to create trip')
    }
    const data = await response.json()
    return data.trip
  },

  // Update an existing trip
  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('Failed to update trip')
    }
    const data = await response.json()
    return data.trip
  },

  // Delete a trip
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete trip')
    }
  },
}
