import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { workItemsService } from '../services/workItems';
import { projectsService } from '../services/projects';
import { usersService } from '../services/users';
import { WorkItem, Project, User, WorkItemStatus, WorkItemPriority, WorkItemType } from '../types';

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
    try {
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
        setWorkItem(item);
        // Fallback if projects array is empty
        setProjects(projs.length > 0 ? projs : [{ id: 'default-1', name: 'General Project' }]);
        setUsers(usrs);
      } else {
        // If no id, results are just projects and users
        const [projs, usrs] = results;
        // Fallback if projects array is empty
        setProjects(projs.length > 0 ? projs : [{ id: 'default-1', name: 'General Project' }]);
        setUsers(usrs);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.role]);

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
