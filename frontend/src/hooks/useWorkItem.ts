import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { workItemsService } from '../services/workItems';
import { projectsService } from '../services/projects';
import { usersService } from '../services/users';
import { WorkItem, Project, User, WorkItemStatus, WorkItemPriority, WorkItemType } from '../types';
import { MOCK_WORK_ITEMS, MOCK_PROJECTS, MOCK_USERS } from '../data/mockData';

interface WorkItemFormData {
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignedTo: string;
  projectId: string;
}

export function useWorkItem(id: string | undefined) {
  const { user } = useAuth();
  const [workItem, setWorkItem] = useState<WorkItem | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
    
    try {
      // In showcase mode, use mock data immediately
      if (isShowcaseMode && id) {
        const mockItem = MOCK_WORK_ITEMS.find(item => item.id === id);
        if (mockItem) {
          setWorkItem(mockItem);
          setProjects(MOCK_PROJECTS);
          setUsers(MOCK_USERS);
          setIsLoading(false);
          return;
        }
      }

      // Always fetch projects and users
      const promises: Promise<any>[] = [
        projectsService.getAll(),
        user?.role === 'admin' || user?.role === 'manager' ? usersService.getAll() : Promise.resolve([]),
      ];

      // Only fetch work item if id exists
      if (id) {
        promises.unshift(workItemsService.getById(id));
      }

      const results = await Promise.all(promises);

      if (id) {
        // If id exists, first result is the work item
        const [item, projs, usrs] = results;
        setWorkItem(item || null);
        // Fallback if projects array is empty
        const safeProjs = Array.isArray(projs) && projs.length > 0 ? projs : (isShowcaseMode ? MOCK_PROJECTS : [{ id: 'default-1', name: 'General Project' }]);
        const safeUsrs = Array.isArray(usrs) ? usrs : (isShowcaseMode ? MOCK_USERS : []);
        setProjects(safeProjs);
        setUsers(safeUsrs);
      } else {
        // If no id, results are just projects and users
        const [projs, usrs] = results;
        // Fallback if projects array is empty
        const safeProjs = Array.isArray(projs) && projs.length > 0 ? projs : (isShowcaseMode ? MOCK_PROJECTS : [{ id: 'default-1', name: 'General Project' }]);
        const safeUsrs = Array.isArray(usrs) ? usrs : (isShowcaseMode ? MOCK_USERS : []);
        setProjects(safeProjs);
        setUsers(safeUsrs);
      }
    } catch (error) {
      console.error('[useWorkItem] Failed to load data:', error);
      // On error, try mock data if in showcase mode
      if (isShowcaseMode && id) {
        const mockItem = MOCK_WORK_ITEMS.find(item => item.id === id);
        if (mockItem) {
          setWorkItem(mockItem);
          setProjects(MOCK_PROJECTS);
          setUsers(MOCK_USERS);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.role, user?.id, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = useCallback(async (formData: WorkItemFormData) => {
    if (!id) return;

    const updated = await workItemsService.update(id, formData);
    setWorkItem(updated);
    return updated;
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;

    await workItemsService.delete(id);
  }, [id]);

  return {
    workItem,
    projects,
    users,
    isLoading,
    handleSubmit,
    handleDelete,
    reloadData: loadData,
  };
}
