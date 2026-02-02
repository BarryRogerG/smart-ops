import api from '../utils/api';
import { ActivityLog } from '../types';

export const activityLogsService = {
  /**
   * Get activity logs for a work item
   */
  async getByWorkItemId(workItemId: string): Promise<ActivityLog[]> {
    const response = await api.get<{ activityLogs: ActivityLog[] }>(
      `/work-items/${workItemId}/activity`
    );
    return response.data.activityLogs;
  },
};
