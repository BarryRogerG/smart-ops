import { useState, useCallback } from 'react';
import { projectsService } from '../services/projects';
import { Project } from '../types';

interface CreateProjectData {
  name: string;
  description?: string;
}

interface UpdateProjectData {
  name: string;
  description?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: CreateProjectData) => {
    await projectsService.create(projectData);
    await loadProjects();
  }, [loadProjects]);

  const updateProject = useCallback(async (projectId: string, projectData: UpdateProjectData) => {
    const payload = { ...projectData };
    if (!payload.description) delete payload.description;
    
    await projectsService.update(projectId, payload);
    await loadProjects();
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    await projectsService.delete(projectId);
    await loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
