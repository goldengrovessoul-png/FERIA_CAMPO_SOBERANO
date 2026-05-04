import { apiClient } from '../lib/api';

export class PlanningService {
    static async getPlanningByState(estado: string): Promise<any[]> {
        return await apiClient.get(`/planning/state/${estado}`);
    }

    static async getPlanningWeeks(estado: string): Promise<string[]> {
        const data = await this.getPlanningByState(estado);
        if (!data) return [];
        const uniqueSemanas = Array.from(new Set(data.map((d: any) => String(d.periodo))))
            .sort((a, b) => b.localeCompare(a));
        return uniqueSemanas;
    }

    static async getPlanningByWeek(estado: string, periodo: string): Promise<any[]> {
        return await apiClient.get(`/planning/state/${estado}/week/${periodo}`);
    }
}
