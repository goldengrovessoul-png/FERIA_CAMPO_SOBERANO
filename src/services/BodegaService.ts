import { supabase } from '../lib/supabase';

export interface BodegaMovil {
    id: string;
    estado: string;
    nombre: string;
    created_at?: string;
}

export const BodegaService = {
    async getAll(): Promise<BodegaMovil[]> {
        const { data, error } = await supabase
            .from('cat_bodegas_moviles')
            .select('*')
            .order('estado', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(bodega: Omit<BodegaMovil, 'id' | 'created_at'>): Promise<BodegaMovil> {
        const { data, error } = await supabase
            .from('cat_bodegas_moviles')
            .insert([bodega])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('cat_bodegas_moviles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
