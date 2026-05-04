import { apiClient } from '../lib/api';

export class ReportService {
  static async save(reportData: any) {
    const response = await apiClient.post('/reports', reportData);
    return response.data;
  }

  static async getAll() {
    const response = await apiClient.get('/reports');
    return response.data;
  }

  static async getCatalogs() {
    const response = await apiClient.get('/catalogs/full');
    return response.data;
  }

  static async getDpa() {
    const response = await apiClient.get('/catalogs/dpa');
    return response.data;
  }

  static async getEntrepreneurData() {
    const response = await apiClient.get('/catalogs/entrepreneurs');
    return response.data;
  }

  static async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Usamos fetch directo o apiClient configurado para multipart
    const response = await apiClient.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  }

  static async getReportById(id: string) {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  }

  static async getInspectorReports(inspectorId: string) {
    const response = await apiClient.get(`/reports/inspector/${inspectorId}`);
    return response.data;
  }
}
