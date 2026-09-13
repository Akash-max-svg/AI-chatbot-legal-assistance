import { apiClient } from './apiClient';

export interface DashboardStats {
  totalUsers?: number;
  totalCases?: number;
  resolvedCases?: number;
  pendingCases?: number;
  aiQueriesProcessed?: number;
  activeUsersToday?: number;
  myCases?: number;
  upcomingHearings?: number;
  assignedCases?: number;
  clients?: number;
  researchQueries?: number;
  pendingHearings?: number;
  pendingJudgments?: number;
  completedCases?: number;
  recentHearings?: number;
}

export interface SystemStatus {
  systemHealth: string;
  backendStatus: string;
  aiStatus: string;
  databaseStatus: string;
  lastUpdated: string;
}

export interface Activity {
  action: string;
  detail: string;
  time: string;
  type: string;
}

export const dashboardService = {
  async getStats(): Promise<{ stats: DashboardStats }> {
    return apiClient.get('/dashboard/stats');
  },

  async getSystemStatus(): Promise<{ status: SystemStatus }> {
    return apiClient.get('/dashboard/status');
  },

  async getRecentActivity(): Promise<{ activities: Activity[] }> {
    return apiClient.get('/dashboard/activity');
  }
};
