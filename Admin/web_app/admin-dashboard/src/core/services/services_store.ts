import { create } from 'zustand'
import { adminDatasource } from '@data/datasources/admin_datasource'
import type { Service } from '@data/models/admin_models'

interface ServicesState {
  services: Service[]
  loading: boolean
  fetched: boolean
  fetchServices: () => Promise<void>
  refreshServices: () => Promise<void>
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  loading: true,
  fetched: false,

  fetchServices: async () => {
    const { fetched } = get()
    if (fetched) return // Only fetch once automatically

    set({ loading: true })
    try {
      const data = await adminDatasource.getServicesList()
      set({ services: data, loading: false, fetched: true })
    } catch (err) {
      console.error('Failed to fetch services:', err)
      set({ loading: false, fetched: true })
    }
  },

  refreshServices: async () => {
    try {
      const data = await adminDatasource.getServicesList()
      set({ services: data, loading: false })
    } catch (err) {
      console.error('Failed to refresh services:', err)
    }
  },
}))
