import { supabase } from '../lib/supabase';

export interface PlannerData {
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    pin: string;
    estado: string;
}

export class AdminService {
    static async createPlanner(data: PlannerData) {
        const email = `${data.cedula.toLowerCase()}@fcs.com`;
        
        const { data: response, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'create',
                userData: {
                    email,
                    password: data.pin,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    cedula: data.cedula,
                    telefono: data.telefono,
                    estado: data.estado,
                    rol: 'PLANIFICADOR'
                }
            }
        });

        if (error) throw error;
        if (response.error) throw new Error(response.error);
        return response;
    }

    static async updatePlanner(userId: string, data: PlannerData) {
        const email = `${data.cedula.toLowerCase()}@fcs.com`;
        
        const { data: response, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'update',
                userId,
                userData: {
                    email,
                    password: data.pin,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    cedula: data.cedula,
                    telefono: data.telefono,
                    estado: data.estado,
                    rol: 'PLANIFICADOR'
                }
            }
        });

        if (error) throw error;
        if (response.error) throw new Error(response.error);
        return response;
    }

    static async deleteUser(userId: string) {
        const { data: response, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'delete',
                userId
            }
        });

        if (error) throw error;
        if (response.error) throw new Error(response.error);
        return response;
    }
}
