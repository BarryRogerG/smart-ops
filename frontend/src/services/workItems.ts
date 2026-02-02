import api from '../utils/api';
import { WorkItem, WorkItemStatus, WorkItemPriority, WorkItemType } from '../types';

export interface CreateWorkItemData {
  title: string;
  description?: string;
  type?: WorkItemType;
  priority?: WorkItemPriority;
  assignedTo?: string;
  projectId: string;
}

export interface UpdateWorkItemData {
  title?: string;
  description?: string;
  type?: WorkItemType;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  assignedTo?: string;
  projectId?: string;
}

export const workItemsService = {
  async getAll(filters?: {
    status?: WorkItemStatus;
    priority?: WorkItemPriority;
    assignedTo?: string;
    projectId?: string;
    search?: string;
  }): Promise<WorkItem[]> {
    const response = await api.get<{ workItems: WorkItem[] }>('/work-items', {
      params: filters,
    });
    return response.data.workItems;
  },

  async getById(id: string): Promise<WorkItem> {
    const response = await api.get<{ workItem: WorkItem }>(`/work-items/${id}`);
    return response.data.workItem;
  },

  async create(data: CreateWorkItemData): Promise<WorkItem> {
    const response = await api.post<{ workItem: WorkItem }>('/work-items', data);
    return response.data.workItem;
  },

  async update(id: string, data: UpdateWorkItemData): Promise<WorkItem> {
    const response = await api.put<{ workItem: WorkItem }>(`/work-items/${id}`, data);
    return response.data.workItem;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/work-items/${id}`);
  },
};
