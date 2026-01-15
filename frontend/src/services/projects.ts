import api from '../utils/api';
import { Project } from '../types';

export interface CreateProjectData {
  name: string;
  description?: string;
}

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get<{ projects: Project[] }>('/projects');
    return response.data.projects;
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get<{ project: Project }>(`/projects/${id}`);
    return response.data.project;
  },

  async create(data: CreateProjectData): Promise<Project> {
    const response = await api.post<{ project: Project }>('/projects', data);
    return response.data.project;
  },

  async update(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put<{ project: Project }>(`/projects/${id}`, data);
    return response.data.project;
  },
};
