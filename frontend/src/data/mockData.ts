import { WorkItem, Project, User } from '../types';

// Mock Work Items for showcase mode
export const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: 'mock-1',
    title: 'Implement User Authentication',
    description: 'Set up secure login and registration system with JWT tokens',
    type: 'task',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'guest',
    createdBy: 'guest',
    projectId: 'mock-project-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedUser: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
    project: {
      id: 'mock-project-1',
      name: 'Core Features',
    },
  },
  {
    id: 'mock-2',
    title: 'Design Dashboard UI',
    description: 'Create responsive dashboard with work item overview and analytics',
    type: 'task',
    status: 'open',
    priority: 'medium',
    assignedTo: 'guest',
    createdBy: 'guest',
    projectId: 'mock-project-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedUser: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
    project: {
      id: 'mock-project-1',
      name: 'Core Features',
    },
  },
  {
    id: 'mock-3',
    title: 'Add Activity Logging',
    description: 'Track all changes to work items for audit trail',
    type: 'request',
    status: 'open',
    priority: 'medium',
    assignedTo: 'guest',
    createdBy: 'guest',
    projectId: 'mock-project-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedUser: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
    project: {
      id: 'mock-project-1',
      name: 'Core Features',
    },
  },
  {
    id: 'mock-4',
    title: 'Mobile App Development',
    description: 'Native mobile app for iOS and Android platforms',
    type: 'request',
    status: 'on_hold',
    priority: 'low',
    assignedTo: 'guest',
    createdBy: 'guest',
    projectId: 'mock-project-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedUser: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
    project: {
      id: 'mock-project-2',
      name: 'Future Features',
    },
  },
];

// Mock Projects for showcase mode
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'mock-project-1',
    name: 'Core Features',
    description: 'Essential features for the SmartOps platform',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-project-2',
    name: 'Future Features',
    description: 'Upcoming enhancements and new capabilities',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-project-3',
    name: 'Bug Fixes',
    description: 'Critical bug fixes and improvements',
    createdAt: new Date().toISOString(),
  },
];

// Mock Users for showcase mode
export const MOCK_USERS: User[] = [
  {
    id: 'guest',
    name: 'Showcase Admin',
    email: 'guest@smartops.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'manager',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];
