import { apiClient } from '../lib/api';

export interface BodegaMovil {
    id: string;
    estado: string;
    nombre: string;
    created_at?: string;
}

export const BodegaService = {
    async getAll(): Promise<BodegaMovil[]> {
        return apiClient.get('/bodegas');
    },

    async create(bodega: Omit<BodegaMovil, 'id' | 'created_at'>): Promise<BodegaMovil> {
        return apiClient.post('/bodegas', bodega);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/bodegas/${id}`);
    },

    async update(id: string, bodega: Partial<Omit<BodegaMovil, 'id' | 'created_at'>>): Promise<BodegaMovil> {
        return apiClient.put(`/bodegas/${id}`, bodega);
    }
};
