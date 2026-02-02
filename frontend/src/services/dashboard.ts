import api from '../utils/api';
import { DashboardData } from '../types';

// Fallback sample data for showcase mode when backend is down
const FALLBACK_DASHBOARD_DATA: DashboardData = {
  openItems: [
    {
      id: 'sample-1',
      title: 'Implement User Authentication',
      description: 'Set up secure login and registration system',
      type: 'task',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'guest',
      createdBy: 'guest',
      projectId: 'sample-project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUser: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      project: {
        id: 'sample-project-1',
        name: 'Core Features',
      },
    },
    {
      id: 'sample-2',
      title: 'Design Dashboard UI',
      description: 'Create responsive dashboard with work item overview',
      type: 'task',
      status: 'open',
      priority: 'medium',
      assignedTo: 'guest',
      createdBy: 'guest',
      projectId: 'sample-project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUser: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      project: {
        id: 'sample-project-1',
        name: 'Core Features',
      },
    },
    {
      id: 'sample-3',
      title: 'Add Activity Logging',
      description: 'Track all changes to work items for audit trail',
      type: 'request',
      status: 'open',
      priority: 'medium',
      assignedTo: 'guest',
      createdBy: 'guest',
      projectId: 'sample-project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUser: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      project: {
        id: 'sample-project-1',
        name: 'Core Features',
      },
    },
  ],
  highPriorityItems: [
    {
      id: 'sample-1',
      title: 'Implement User Authentication',
      description: 'Set up secure login and registration system',
      type: 'task',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'guest',
      createdBy: 'guest',
      projectId: 'sample-project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUser: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      project: {
        id: 'sample-project-1',
        name: 'Core Features',
      },
    },
  ],
  onHoldItems: [
    {
      id: 'sample-4',
      title: 'Mobile App Development',
      description: 'Native mobile app for iOS and Android',
      type: 'request',
      status: 'on_hold',
      priority: 'low',
      assignedTo: 'guest',
      createdBy: 'guest',
      projectId: 'sample-project-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUser: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      project: {
        id: 'sample-project-2',
        name: 'Future Features',
      },
    },
  ],
  itemsPerUser: [
    {
      user: {
        id: 'guest',
        name: 'Showcase Admin',
        email: 'guest@smartops.com',
        role: 'admin',
      },
      itemCount: 4,
    },
  ],
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get<DashboardData>('/dashboard');
      const data = response.data;
      
      // Ensure all arrays exist, default to empty arrays if missing
      return {
        openItems: data?.openItems || [],
        highPriorityItems: data?.highPriorityItems || [],
        onHoldItems: data?.onHoldItems || [],
        itemsPerUser: data?.itemsPerUser || [],
      };
    } catch (error: any) {
      // If backend is down (404, 500, network error), return fallback data for showcase
      if (
        error.response?.status === 404 ||
        error.response?.status === 500 ||
        error.response?.status === 503 ||
        !error.response
      ) {
        console.warn('[Dashboard] Backend unavailable, using fallback data:', error.response?.status || 'network error');
        return FALLBACK_DASHBOARD_DATA;
      }
      // For auth errors, still return fallback data for showcase mode
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('[Dashboard] Auth error, using fallback data for showcase mode');
        return FALLBACK_DASHBOARD_DATA;
      }
      // Re-throw other unexpected errors
      throw error;
    }
  },
};
