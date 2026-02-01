export type UserRole = 'user' | 'manager' | 'admin';
export type WorkItemStatus = 'open' | 'in_progress' | 'on_hold' | 'done';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkItemType = 'task' | 'bug' | 'incident' | 'request';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignedTo?: string;
  createdBy: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
  assignedUser?: User;
  creator?: User;
  project?: Project;
}

export interface AISummary {
  id: string;
  content: string;
  createdFor: string;
  createdAt: string;
}

export interface DashboardData {
  openItems: WorkItem[];
  highPriorityItems: WorkItem[];
  onHoldItems: WorkItem[];
  itemsPerUser: {
    user: User;
    itemCount: number;
  }[];
}
