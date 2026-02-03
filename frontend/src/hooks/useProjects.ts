import { useState, useCallback } from 'react';
import { projectsService } from '../services/projects';
import { Project } from '../types';
import { MOCK_PROJECTS } from '../data/mockData';

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
      // Ensure data is always an array, fallback to mock data
      setProjects(Array.isArray(data) && data.length > 0 ? data : MOCK_PROJECTS);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Use mock data on error for showcase mode
      setProjects(MOCK_PROJECTS);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: CreateProjectData) => {
    try {
      const newProject = await projectsService.create(projectData);
      // Optimistic update: add to local state immediately
      setProjects(prev => {
        const updated = [...prev, newProject];
        return updated;
      });
      // Reload to ensure sync with backend
      await loadProjects();
      return newProject;
    } catch (error) {
      // On error, reload to get correct state
      await loadProjects();
      throw error;
    }
  }, [loadProjects]);

  const updateProject = useCallback(async (projectId: string, projectData: UpdateProjectData) => {
    try {
      const payload = { ...projectData };
      if (!payload.description) delete payload.description;
      
      const updatedProject = await projectsService.update(projectId, payload);
      // Optimistic update: update in local state immediately
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      );
      // Reload to ensure sync with backend
      await loadProjects();
      return updatedProject;
    } catch (error) {
      // On error, reload to get correct state
      await loadProjects();
      throw error;
    }
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectsService.delete(projectId);
      // Optimistic update: remove from local state immediately
      setProjects(prev => prev.filter(p => p.id !== projectId));
      // Reload to ensure sync with backend
      await loadProjects();
    } catch (error) {
      // On error, reload to get correct state
      await loadProjects();
      throw error;
    }
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
