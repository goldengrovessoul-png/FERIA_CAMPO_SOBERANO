import { apiClient } from '../lib/api';

export class AdminService {
    static async getStats() {
        const response = await apiClient.get('/reports');
        const reports = response; // El apiClient ya devuelve response.data

        const total_beneficiarios = reports.reduce((acc: number, r: any) => acc + (Number(r.familias) || 0), 0);
        const total_toneladas = reports.reduce((acc: number, r: any) => 
            acc + (Number(r.total_proteina) + Number(r.total_frutas) + Number(r.total_hortalizas) + Number(r.total_verduras) + Number(r.total_viveres)), 0);

        return {
            total_reportes: reports.length,
            total_beneficiarios,
            total_toneladas: Number(total_toneladas.toFixed(2)),
            recent_reports: reports.slice(0, 10)
        };
    }

    static async getAllReports() {
        return await apiClient.get('/reports');
    }

    static async deleteReport(id: string) {
        return await apiClient.delete(`/reports/${id}`);
    }

    // Perfiles y Usuarios
    static async getAllProfiles() {
        return await apiClient.get('/admin/profiles');
    }

    static async updateProfile(userId: string, data: any) {
        return await apiClient.put(`/admin/profiles/${userId}`, data);
    }

    static async deleteUser(userId: string) {
        return await apiClient.delete(`/admin/profiles/${userId}`);
    }

    // Catálogos
    static async getCatalogItems(type: string) {
        return await apiClient.get(`/admin/catalogs/${type}`);
    }

    static async saveCatalogItem(data: any) {
        if (data.id) {
            return await apiClient.put(`/admin/catalogs/${data.id}`, data);
        }
        return await apiClient.post('/admin/catalogs', data);
    }

    static async deleteCatalogItem(id: string) {
        return await apiClient.delete(`/admin/catalogs/${id}`);
    }

    // Vulnerabilidades
    static async getVulnerabilities() {
        return await apiClient.get('/admin/vulnerabilities');
    }

    static async saveVulnerability(data: any) {
        if (data.id) {
            return await apiClient.put(`/admin/vulnerabilities/${data.id}`, data);
        }
        return await apiClient.post('/admin/vulnerabilities', data);
    }

    static async deleteVulnerability(id: string) {
        return await apiClient.delete(`/admin/vulnerabilities/${id}`);
    }

    // Planificadores
    static async createPlanner(data: any) {
        return await apiClient.post('/auth/register', { ...data, rol: 'PLANIFICADOR' });
    }

    static async updatePlanner(id: string, data: any) {
        return await apiClient.put(`/admin/profiles/${id}`, data);
    }

    // Emprendimientos
    static async getEntrepreneurTypes() {
        return await apiClient.get('/admin/entrepreneur-types');
    }

    static async saveEntrepreneurType(data: any) {
        if (data.id) {
            return await apiClient.put(`/admin/entrepreneur-types/${data.id}`, data);
        }
        return await apiClient.post('/admin/entrepreneur-types', data);
    }

    static async deleteEntrepreneurType(id: string) {
        return await apiClient.delete(`/admin/entrepreneur-types/${id}`);
    }

    static async getCustomFields() {
        return await apiClient.get('/admin/custom-fields');
    }

    static async saveCustomField(data: any) {
        if (data.id) {
            return await apiClient.put(`/admin/custom-fields/${data.id}`, data);
        }
        return await apiClient.post('/admin/custom-fields', data);
    }

    static async deleteCustomField(id: string) {
        return await apiClient.delete(`/admin/custom-fields/${id}`);
    }
}
